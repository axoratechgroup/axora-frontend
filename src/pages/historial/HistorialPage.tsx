import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, History, Plus, Send, type LucideIcon } from 'lucide-react'
import { useWallet } from '../../hooks/useWallet.ts'
import { formatAmount, formatTransactionType } from '../../utils/formatters.ts'
import type { Transaction } from '../../types/wallet.ts'
import './HistorialPage.css'

const TRANSACTION_ICONS: Record<string, LucideIcon> = {
  TOP_UP: Plus,
  TRANSFER: Send,
  SWAP: ArrowLeftRight,
}

function transactionSubtitle(tx: Transaction): string {
  if (tx.type === 'TRANSFER' && tx.counterparty_username) {
    return tx.direction === 'sent'
      ? `Enviado a ${tx.counterparty_username}`
      : `Recibido de ${tx.counterparty_username}`
  }
  if (tx.type === 'SWAP' && tx.from_currency) {
    return `${tx.from_currency} → ${tx.to_currency}`
  }
  return formatTransactionType(tx.type)
}

export default function HistorialPage() {
  const navigate = useNavigate()
  const { transactions, transactionsLoading, transactionsError } = useWallet()

  return (
    <div className="historial-page">
      <div className="historial-card">
        <div className="historial-header">
          <h1 className="historial-title">Historial de transacciones</h1>
          <button className="historial-back" onClick={() => navigate('/dashboard')}>
            Volver
          </button>
        </div>

        {transactionsError && (
          <p className="historial-empty">No se pudo cargar tu historial: {transactionsError}</p>
        )}

        {!transactionsError && transactionsLoading && (
          <p className="historial-empty">Cargando…</p>
        )}

        {!transactionsError && !transactionsLoading && transactions.length === 0 && (
          <p className="historial-empty">Todavía no hiciste ninguna transacción.</p>
        )}

        {!transactionsError && transactions.length > 0 && (
          <ul className="historial-list">
            {transactions.map((tx) => {
              const TxIcon = TRANSACTION_ICONS[tx.type] ?? History
              const isReceived = tx.direction === 'received'
              return (
                <li className="historial-item" key={tx.id}>
                  <div className="historial-icon">
                    <TxIcon size={18} aria-hidden="true" />
                  </div>
                  <div className="historial-details">
                    <span className="historial-type">{formatTransactionType(tx.type)}</span>
                    <span className="historial-subtitle">{transactionSubtitle(tx)}</span>
                  </div>
                  <div className="historial-value">
                    <span
                      className={`historial-amount${
                        tx.type === 'TRANSFER' ? (isReceived ? ' is-received' : ' is-sent') : ''
                      }`}
                    >
                      {tx.type === 'TRANSFER' &&
                        (isReceived ? (
                          <ArrowDownLeft size={14} aria-hidden="true" />
                        ) : (
                          <ArrowUpRight size={14} aria-hidden="true" />
                        ))}
                      {formatAmount(tx.to_amount)} {tx.to_currency}
                    </span>
                    <span className="historial-date">{new Date(tx.created_at).toLocaleString('es-AR')}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
