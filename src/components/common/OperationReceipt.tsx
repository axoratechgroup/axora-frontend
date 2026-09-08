import { CheckCircle, Copy } from 'lucide-react'
import { toast } from 'react-toastify'
import type { SummaryItem } from './OperationConfirmModal.tsx'
import './OperationReceipt.css'

export interface OperationReceiptProps {
  title: string
  subtitle: string
  items: SummaryItem[]
  onPrimaryAction: () => void
  primaryActionText?: string
  onSecondaryAction?: () => void
  secondaryActionText?: string
  referenceId?: string
}

export function OperationReceipt({
  title,
  subtitle,
  items,
  onPrimaryAction,
  primaryActionText = 'Ir al panel principal',
  onSecondaryAction,
  secondaryActionText,
  referenceId,
}: OperationReceiptProps) {
  const handleCopyReference = () => {
    if (referenceId) {
      navigator.clipboard
        .writeText(referenceId)
        .then(() => {
          toast.success('Referencia copiada al portapapeles.', { autoClose: 2000 })
        })
        .catch(() => {})
    }
  }

  return (
    <div className="op-receipt-card" role="region" aria-label="Comprobante de operación">
      <div className="op-receipt-icon-wrapper" aria-hidden="true">
        <CheckCircle size={40} />
      </div>

      <h2 className="op-receipt-title">{title}</h2>
      <p className="op-receipt-subtitle">{subtitle}</p>

      {referenceId && (
        <div className="op-receipt-ref-banner">
          <span className="op-receipt-ref-label">Ref:</span>
          <span className="op-receipt-ref-id">{referenceId}</span>
          <button
            type="button"
            className="op-receipt-copy-btn"
            onClick={handleCopyReference}
            title="Copiar referencia"
            aria-label="Copiar referencia"
          >
            <Copy size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="op-receipt-box">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`op-receipt-row ${item.isHighlight ? 'is-highlight' : ''}`}
          >
            <span className="op-receipt-row-label">{item.label}</span>
            <span className="op-receipt-row-value">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="op-receipt-actions">
        <button
          type="button"
          className="op-receipt-btn-primary"
          onClick={onPrimaryAction}
        >
          {primaryActionText}
        </button>
        {onSecondaryAction && secondaryActionText && (
          <button
            type="button"
            className="op-receipt-btn-secondary"
            onClick={onSecondaryAction}
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  )
}
