import { CheckCircle2, Clock, AlertCircle, Ban, RefreshCw, type LucideIcon } from 'lucide-react'
import { formatTransactionStatus } from '../../utils/formatters.ts'
import './StatusBadge.css'

export type TransactionStatusType =
  | 'COMPLETED'
  | 'PENDING'
  | 'PROCESSING'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED'
  | string

export interface StatusBadgeProps {
  status: TransactionStatusType
  showIcon?: boolean
  className?: string
}

const STATUS_ICONS: Record<string, LucideIcon> = {
  COMPLETED: CheckCircle2,
  PENDING: Clock,
  PROCESSING: RefreshCw,
  FAILED: AlertCircle,
  REJECTED: AlertCircle,
  CANCELLED: Ban,
}

export function StatusBadge({ status, showIcon = true, className = '' }: StatusBadgeProps) {
  const normStatus = (status || '').toUpperCase()
  const Icon = STATUS_ICONS[normStatus]
  const label = formatTransactionStatus(normStatus)
  const statusModifier = normStatus.toLowerCase()

  return (
    <span
      className={`status-badge status-badge--${statusModifier} ${className}`.trim()}
      role="status"
      aria-label={`Estado: ${label}`}
    >
      {showIcon && Icon && <Icon size={12} className="status-badge__icon" aria-hidden="true" />}
      <span className="status-badge__label">{label}</span>
    </span>
  )
}
