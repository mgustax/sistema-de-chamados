import { Filter, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChamadoCard } from '../components/ChamadoCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Alert, EmptyState, Loading } from '../components/Feedback'
import { useAuth } from '../contexts/AuthContext'
import { excluirChamado, listarMeusChamados } from '../services/chamados'
import type { Chamado, StatusChamado } from '../types'

export function MoradorDashboard() {
  const { usuario } = useAuth()
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<StatusChamado | 'Todos'>('Todos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(() => sessionStorage.getItem('flash') || '')
  const [paraExcluir, setParaExcluir] = useState<Chamado | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = useCallback(async () => {
    if (!usuario) return
    setCarregando(true)
    setErro('')
    try { setChamados(await listarMeusChamados(usuario.id)) }
    catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível carregar os chamados.') }
    finally { setCarregando(false) }
  }, [usuario])

  useEffect(() => {
    sessionStorage.removeItem('flash')
    void carregar()
  }, [carregar])

  const filtrados = useMemo(() => chamados.filter((chamado) => {
    const correspondeBusca = chamado.descricao.toLowerCase().includes(busca.toLowerCase())
    return correspondeBusca && (status === 'Todos' || chamado.status === status)
  }), [chamados, busca, status])

  async function confirmarExclusao() {
    if (!paraExcluir || !usuario) return
    setExcluindo(true)
    setErro('')
    try {
      await excluirChamado(paraExcluir.id, usuario.id)
      setChamados((lista) => lista.filter((item) => item.id !== paraExcluir.id))
      setSucesso('Chamado excluído com sucesso.')
      setParaExcluir(null)
    } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível excluir.') }
    finally { setExcluindo(false) }
  }

  return <>
    <div className="page-heading">
      <div><p className="overline">VISÃO GERAL</p><h1>Meus chamados</h1><p>Acompanhe suas solicitações e o andamento da manutenção.</p></div>
      <Link className="button button-primary" to="/chamados/novo"><Plus size={19} /> Novo chamado</Link>
    </div>
    {sucesso && <Alert tipo="sucesso">{sucesso}</Alert>}
    {erro && <Alert tipo="erro">{erro}</Alert>}
    <section className="filters" aria-label="Filtros dos chamados">
      <label className="search-field"><Search size={19} /><span className="sr-only">Buscar pela descrição</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pela descrição..." /></label>
      <label className="select-field"><Filter size={17} /><span className="sr-only">Filtrar por status</span><select value={status} onChange={(e) => setStatus(e.target.value as StatusChamado | 'Todos')}><option>Todos</option><option>Aberto</option><option>Aceito</option><option>Feito</option></select></label>
    </section>
    {carregando ? <Loading texto="Carregando seus chamados..." /> : filtrados.length === 0 ?
      <EmptyState titulo={chamados.length ? 'Nenhum resultado' : 'Tudo tranquilo por aqui'} texto={chamados.length ? 'Tente ajustar a busca ou o filtro.' : 'Quando precisar, abra um chamado para a equipe de manutenção.'} acao={!chamados.length && <Link className="button button-primary" to="/chamados/novo"><Plus size={18} /> Abrir primeiro chamado</Link>} /> :
      <div className="tickets-grid">{filtrados.map((chamado) => <ChamadoCard key={chamado.id} chamado={chamado} podeEditar={chamado.status === 'Aberto'} podeExcluir={chamado.status === 'Aberto'} onExcluir={setParaExcluir} />)}</div>}
    <ConfirmDialog aberto={Boolean(paraExcluir)} titulo="Excluir chamado?" descricao="Esta ação não pode ser desfeita. O chamado e seu histórico serão removidos." confirmando={excluindo} onCancelar={() => setParaExcluir(null)} onConfirmar={confirmarExclusao} />
  </>
}
