import { ArrowLeft, CalendarDays, MapPin, Pencil, Tag, Trash2, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatarData } from '../components/ChamadoCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Alert, Loading } from '../components/Feedback'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { buscarChamado, excluirChamado } from '../services/chamados'
import type { Chamado } from '../types'

export function ChamadoDetailPage() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [chamado, setChamado] = useState<Chamado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    if (!id) return
    buscarChamado(id).then(setChamado).catch((error) => setErro(error.message)).finally(() => setCarregando(false))
  }, [id])

  async function excluir() {
    if (!chamado || !usuario) return
    setExcluindo(true)
    try {
      await excluirChamado(chamado.id, usuario.id)
      sessionStorage.setItem('flash', 'Chamado excluído com sucesso.')
      navigate('/')
    } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível excluir.'); setConfirmar(false) }
    finally { setExcluindo(false) }
  }

  if (carregando) return <Loading texto="Carregando chamado..." />
  if (erro || !chamado) return <div className="narrow-page"><Alert tipo="erro">{erro || 'Chamado não encontrado.'}</Alert><Link className="back-link" to="/"><ArrowLeft size={18} /> Voltar</Link></div>
  const proprio = chamado.morador_id === usuario?.id
  const podeAlterar = proprio && chamado.status === 'Aberto'

  return <div className="narrow-page">
    <Link className="back-link" to="/"><ArrowLeft size={18} /> Voltar aos chamados</Link>
    <article className="detail-card">
      <div className="detail-header"><div><p className="overline">CHAMADO #{chamado.id.slice(0, 8).toUpperCase()}</p><h1>{chamado.descricao}</h1></div><StatusBadge status={chamado.status} /></div>
      <div className="detail-grid">
        <div><span><MapPin /> Local</span><strong>{chamado.local?.nome ?? 'Não informado'}</strong></div>
        <div><span><Tag /> Categoria</span><strong>{chamado.categoria}</strong></div>
        <div><span><CalendarDays /> Aberto em</span><strong>{formatarData(chamado.data_abertura)}</strong></div>
        <div><span><UserRound /> Atendente</span><strong>{chamado.atendente?.nome ?? 'Aguardando aceite'}</strong></div>
      </div>
      <div className="progress-track" aria-label={`Status atual: ${chamado.status}`}>
        {['Aberto', 'Aceito', 'Feito'].map((etapa, index) => { const atual = ['Aberto', 'Aceito', 'Feito'].indexOf(chamado.status); return <div key={etapa} className={index <= atual ? 'progress-done' : ''}><span>{index < atual ? '✓' : index + 1}</span><strong>{etapa}</strong></div> })}
      </div>
      {podeAlterar && <div className="detail-actions"><Link className="button button-secondary" to={`/chamados/${chamado.id}/editar`}><Pencil size={18} /> Editar</Link><button className="button button-danger-soft" onClick={() => setConfirmar(true)}><Trash2 size={18} /> Excluir</button></div>}
    </article>
    <ConfirmDialog aberto={confirmar} titulo="Excluir chamado?" descricao="Esta ação não pode ser desfeita. O chamado será removido permanentemente." confirmando={excluindo} onCancelar={() => setConfirmar(false)} onConfirmar={excluir} />
  </div>
}
