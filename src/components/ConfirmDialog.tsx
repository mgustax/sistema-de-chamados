import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface Props {
  aberto: boolean
  titulo: string
  descricao: string
  confirmando?: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

export function ConfirmDialog({ aberto, titulo, descricao, confirmando, onCancelar, onConfirmar }: Props) {
  const cancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (aberto) cancelarRef.current?.focus()
  }, [aberto])

  if (!aberto) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancelar}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onCancelar} aria-label="Fechar"><X size={19} /></button>
        <span className="modal-icon"><AlertTriangle size={24} /></span>
        <h2 id="modal-title">{titulo}</h2>
        <p>{descricao}</p>
        <div className="modal-actions">
          <button ref={cancelarRef} className="button button-secondary" onClick={onCancelar} disabled={confirmando}>Cancelar</button>
          <button className="button button-danger" onClick={onConfirmar} disabled={confirmando}>
            {confirmando ? 'Excluindo...' : 'Sim, excluir'}
          </button>
        </div>
      </section>
    </div>
  )
}
