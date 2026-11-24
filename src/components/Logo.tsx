import { Building2 } from 'lucide-react'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo" aria-label="Meu Chamado">
      <span className="logo-mark" aria-hidden="true"><Building2 size={21} strokeWidth={2.2} /></span>
      {!compact && <span>Meu Chamado</span>}
    </div>
  )
}
