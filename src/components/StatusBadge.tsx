import type { StatusChamado } from '../types'

export function StatusBadge({ status }: { status: StatusChamado }) {
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>
}
