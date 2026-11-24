import { Check, Clock3, MapPin, UserCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, EmptyState, Loading } from '../components/Feedback'
import { StatusBadge } from '../components/StatusBadge'
import { formatarData } from '../components/ChamadoCard'
import { useAuth } from '../contexts/AuthContext'
import { aceitarChamado, listarFilaDaEquipe, marcarComoFeito } from '../services/chamados'
import type { Chamado } from '../types'

export function EquipeDashboard() {
  const { usuario } = useAuth()
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [aba, setAba] = useState<'fila' | 'meus'>('fila')

  const carregar = useCallback(async () => {
    if (!usuario?.categoria) return
    setCarregando(true)
    setErro('')
    try { setChamados(await listarFilaDaEquipe(usuario.id, usuario.categoria)) }
    catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível carregar a fila.') }
    finally { setCarregando(false) }
  }, [usuario])
  useEffect(() => { void carregar() }, [carregar])

  const fila = useMemo(() => chamados.filter((c) => c.status === 'Aberto'), [chamados])
  const meus = useMemo(() => chamados.filter((c) => c.atendente_id === usuario?.id), [chamados, usuario?.id])
  const visiveis = aba === 'fila' ? fila : meus

  async function agir(chamado: Chamado) {
    if (!usuario) return
    setProcessando(chamado.id); setErro(''); setSucesso('')
    try {
      const atualizado = chamado.status === 'Aberto' ? await aceitarChamado(chamado.id, usuario.id) : await marcarComoFeito(chamado.id, usuario.id)
      setChamados((lista) => lista.map((item) => item.id === atualizado.id ? atualizado : item))
      setSucesso(chamado.status === 'Aberto' ? 'Chamado aceito. Ele já aparece nos seus atendimentos.' : 'Chamado marcado como feito.')
      if (chamado.status === 'Aberto') setAba('meus')
    } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível atualizar o chamado.'); await carregar() }
    finally { setProcessando(null) }
  }

  return <>
    <div className="page-heading"><div><p className="overline">MANUTENÇÃO · {usuario?.categoria?.toUpperCase()}</p><h1>Fila de manutenção</h1><p>Assuma novos chamados e acompanhe seus atendimentos.</p></div></div>
    {!usuario?.categoria && <Alert tipo="aviso">Seu perfil de funcionário ainda não possui uma categoria. Peça a um administrador para configurá-la.</Alert>}
    {sucesso && <Alert tipo="sucesso">{sucesso}</Alert>}{erro && <Alert tipo="erro">{erro}</Alert>}
    <div className="tabs" role="tablist"><button role="tab" aria-selected={aba === 'fila'} className={aba === 'fila' ? 'active' : ''} onClick={() => setAba('fila')}>Disponíveis <span>{fila.length}</span></button><button role="tab" aria-selected={aba === 'meus'} className={aba === 'meus' ? 'active' : ''} onClick={() => setAba('meus')}>Meus atendimentos <span>{meus.length}</span></button></div>
    {carregando ? <Loading texto="Atualizando a fila..." /> : !visiveis.length ? <EmptyState titulo={aba === 'fila' ? 'Fila em dia' : 'Nenhum atendimento assumido'} texto={aba === 'fila' ? 'Não há chamados abertos para sua categoria agora.' : 'Os chamados que você aceitar aparecerão aqui.'} /> :
      <div className="maintenance-list">{visiveis.map((chamado) => <article className="maintenance-card" key={chamado.id}>
        <div className="maintenance-main"><div className="ticket-card-top"><span className="category">{chamado.categoria}</span><StatusBadge status={chamado.status} /></div><h3>{chamado.descricao}</h3><div className="ticket-meta"><span><MapPin size={16} /> {chamado.local?.nome ?? 'Local não informado'}</span><span><Clock3 size={16} /> {formatarData(chamado.data_abertura)}</span>{chamado.morador?.nome && <span><UserCheck size={16} /> {chamado.morador.nome}</span>}</div></div>
        {chamado.status !== 'Feito' && <button className="button button-primary" disabled={processando === chamado.id} onClick={() => agir(chamado)}>{chamado.status === 'Aberto' ? <UserCheck size={18} /> : <Check size={18} />}{processando === chamado.id ? 'Atualizando...' : chamado.status === 'Aberto' ? 'Aceitar chamado' : 'Marcar como feito'}</button>}
      </article>)}</div>}
  </>
}
