import { CalendarDays, MapPin, Pencil, Trash2, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Chamado } from '../types'
import { StatusBadge } from './StatusBadge'

export function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(data))
}

interface Props {
  chamado: Chamado
  podeEditar?: boolean
  podeExcluir?: boolean
  onExcluir?: (chamado: Chamado) => void
}

export function ChamadoCard({ chamado, podeEditar, podeExcluir, onExcluir }: Props) {
  return (
    <article className="ticket-card">
      <div className="ticket-card-top">
        <span className="category">{chamado.categoria}</span>
        <StatusBadge status={chamado.status} />
      </div>
      <h3><Link to={`/chamados/${chamado.id}`}>{chamado.descricao}</Link></h3>
      <div className="ticket-meta">
        <span><MapPin size={16} /> {chamado.local?.nome ?? 'Local não informado'}</span>
        <span><CalendarDays size={16} /> {formatarData(chamado.data_abertura)}</span>
        {chamado.atendente?.nome && <span><UserRound size={16} /> {chamado.atendente.nome}</span>}
      </div>
      <div className="ticket-actions">
        <Link className="text-link" to={`/chamados/${chamado.id}`}>Ver detalhes</Link>
        <span className="action-spacer" />
        {podeEditar && <Link className="icon-button" to={`/chamados/${chamado.id}/editar`} aria-label={`Editar ${chamado.descricao}`}><Pencil size={17} /></Link>}
        {podeExcluir && <button className="icon-button icon-danger" onClick={() => onExcluir?.(chamado)} aria-label={`Excluir ${chamado.descricao}`}><Trash2 size={17} /></button>}
      </div>
    </article>
  )
}
