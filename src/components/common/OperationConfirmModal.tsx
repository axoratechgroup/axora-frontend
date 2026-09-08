import type { ReactNode } from 'react'
import './OperationConfirmModal.css'

export interface SummaryItem {
  label: string
  value: ReactNode
  isHighlight?: boolean
  isMuted?: boolean
}

export interface OperationConfirmModalProps {
  isOpen: boolean
  title: string
  subtitle?: string
  items: SummaryItem[]
  confirmText?: string
  cancelText?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function OperationConfirmModal({
  isOpen,
  title,
  subtitle,
  items,
  confirmText = 'Confirmar operación',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onClose,
}: OperationConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="op-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="op-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="op-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="op-modal-header">
          <h2 id="op-modal-title" className="op-modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="op-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar ventana de confirmación"
          >
            ×
          </button>
        </div>

        {subtitle && <p className="op-modal-subtitle">{subtitle}</p>}

        <div className="op-modal-summary">
          {items.map((item, index) => (
            <div
              key={index}
              className={`op-modal-row ${item.isHighlight ? 'is-highlight' : ''} ${
                item.isMuted ? 'is-muted' : ''
              }`}
            >
              <span className="op-modal-label">{item.label}</span>
              <span className="op-modal-value">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="op-modal-actions">
          <button
            type="button"
            className="op-modal-btn op-modal-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="op-modal-btn op-modal-btn-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
