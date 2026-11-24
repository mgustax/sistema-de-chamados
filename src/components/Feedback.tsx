import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'

export function Loading({ texto = 'Carregando...' }: { texto?: string }) {
  return <div className="state-inline"><LoaderCircle className="spin" size={19} /> {texto}</div>
}

export function Alert({ tipo, children }: { tipo: 'erro' | 'sucesso' | 'aviso'; children: React.ReactNode }) {
  const Icon = tipo === 'sucesso' ? CheckCircle2 : AlertCircle
  return <div className={`alert alert-${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}><Icon size={19} /> <span>{children}</span></div>
}

export function EmptyState({ titulo, texto, acao }: { titulo: string; texto: string; acao?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">✓</span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {acao}
    </div>
  )
}
