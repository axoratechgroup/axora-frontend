import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, LogOut, ShieldAlert, X } from 'lucide-react'
import './ConfirmDialog.css'

export type ConfirmVariant = 'danger' | 'warning' | 'info'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  iconType?: 'logout' | 'warning' | 'shield' | 'none'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  iconType = 'logout',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!loading) onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, loading, onCancel])

  if (!isOpen) return null

  const renderIcon = () => {
    switch (iconType) {
      case 'logout':
        return <LogOut size={24} aria-hidden="true" />
      case 'shield':
        return <ShieldAlert size={24} aria-hidden="true" />
      case 'warning':
        return <AlertTriangle size={24} aria-hidden="true" />
      default:
        return null
    }
  }

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel()
        }
      }}
      role="presentation"
    >
      <div
        className={`confirm-dialog-card confirm-dialog-card--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        <button
          type="button"
          className="confirm-dialog-close"
          onClick={onCancel}
          disabled={loading}
          aria-label="Cerrar modal"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {iconType !== 'none' && (
          <div className={`confirm-dialog-icon-wrapper confirm-dialog-icon-wrapper--${variant}`}>
            {renderIcon()}
          </div>
        )}

        <h3 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h3>

        <div id="confirm-dialog-desc" className="confirm-dialog-message">
          {message}
        </div>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-btn confirm-dialog-btn--cancel"
            data-testid="confirm-dialog-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-dialog-btn confirm-dialog-btn--confirm confirm-dialog-btn--${variant}`}
            data-testid="confirm-dialog-confirm"
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
