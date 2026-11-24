import { ArrowLeft, Save } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Loading } from '../components/Feedback'
import { useAuth } from '../contexts/AuthContext'
import { buscarChamado, criarChamado, editarChamado, listarLocais } from '../services/chamados'
import { CATEGORIAS, type ChamadoInput, type LocalCondominio } from '../types'

const vazio: ChamadoInput = { descricao: '', categoria: '', local_id: '' }

export function ChamadoFormPage() {
  const { id } = useParams()
  const editar = Boolean(id)
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(vazio)
  const [locais, setLocais] = useState<LocalCondominio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function preparar() {
      try {
        const [lista, chamado] = await Promise.all([listarLocais(), id ? buscarChamado(id) : Promise.resolve(null)])
        setLocais(lista)
        if (chamado) {
          if (chamado.morador_id !== usuario?.id || chamado.status !== 'Aberto') throw new Error('Este chamado não pode mais ser editado.')
          setForm({ descricao: chamado.descricao, categoria: chamado.categoria, local_id: chamado.local_id })
        }
      } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível preparar o formulário.') }
      finally { setCarregando(false) }
    }
    void preparar()
  }, [id, usuario?.id])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!usuario) return
    setSalvando(true)
    setErro('')
    try {
      if (editar && id) await editarChamado(id, usuario.id, form)
      else await criarChamado(usuario.id, form)
      sessionStorage.setItem('flash', editar ? 'Chamado atualizado com sucesso.' : 'Chamado cadastrado com sucesso.')
      navigate('/')
    } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível salvar o chamado.') }
    finally { setSalvando(false) }
  }

  if (carregando) return <Loading texto="Preparando formulário..." />
  return <div className="narrow-page">
    <Link className="back-link" to={id ? `/chamados/${id}` : '/'}><ArrowLeft size={18} /> Voltar</Link>
    <div className="page-heading"><div><p className="overline">SOLICITAÇÃO DE MANUTENÇÃO</p><h1>{editar ? 'Editar chamado' : 'Novo chamado'}</h1><p>Conte o que aconteceu. Quanto mais detalhes, melhor.</p></div></div>
    {erro && <Alert tipo="erro">{erro}</Alert>}
    <form className="form-card form-stack" onSubmit={submit}>
      <label>Local do problema<select value={form.local_id} onChange={(e) => setForm({ ...form, local_id: e.target.value })} required><option value="">Selecione um local</option>{locais.map((local) => <option key={local.id} value={local.id}>{local.nome}</option>)}</select><small>Escolha onde a equipe deve realizar o atendimento.</small></label>
      <label>Categoria<select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} required><option value="">Selecione uma categoria</option>{CATEGORIAS.map((categoria) => <option key={categoria}>{categoria}</option>)}</select></label>
      <label>Descrição do problema<textarea rows={6} maxLength={800} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required placeholder="Ex.: A torneira da pia está vazando desde ontem..." /><small className="char-count">{form.descricao.length}/800</small></label>
      <div className="form-actions"><Link className="button button-secondary" to="/">Cancelar</Link><button className="button button-primary" disabled={salvando || Boolean(erro && !locais.length)}><Save size={18} /> {salvando ? 'Salvando...' : editar ? 'Salvar alterações' : 'Cadastrar chamado'}</button></div>
    </form>
  </div>
}
