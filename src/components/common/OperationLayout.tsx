import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './OperationLayout.css'

export interface OperationLayoutProps {
  title: string
  subtitle: string
  onBack?: () => void
  backLabel?: string
  children: ReactNode
  className?: string
  cardClassName?: string
}

export function OperationLayout({
  title,
  subtitle,
  onBack,
  backLabel = 'Volver al panel',
  children,
  className = '',
  cardClassName = '',
}: OperationLayoutProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className={`op-page ${className}`.trim()}>
      <div className={`op-card ${cardClassName}`.trim()}>
        <div className="op-card-header">
          <button
            type="button"
            className="op-back-btn"
            onClick={handleBack}
            aria-label={backLabel}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{backLabel}</span>
          </button>
        </div>

        <h1 className="op-title">{title}</h1>
        <p className="op-subtitle">{subtitle}</p>

        {children}
      </div>
    </div>
  )
}
