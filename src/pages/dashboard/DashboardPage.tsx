import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, HelpCircle, LogOut, Plus, ArrowLeftRight, Send, History, Settings, type LucideIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.ts'
import { useWallet } from '../../hooks/useWallet.ts'
import { AssetCard } from '../../components/dashboard/AssetCard.tsx'
import { formatAmount, formatTransactionType } from '../../utils/formatters.ts'
import type { StoredUser } from '../../types/auth.ts'
import { ChatWidget } from '../../components/chat/ChatWidget.tsx'
import './DashboardPage.css'

const TRANSACTION_ICONS: Record<string, LucideIcon> = {
  TOP_UP: Plus,
  TRANSFER: Send,
  SWAP: ArrowLeftRight,
}

const SLOGANS = [
  'Tu dinero, sin fronteras.',
  'Axora, tu banco favorito.',
  'Un solo lugar para todas tus divisas.',
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()
  const {
    wallet,
    totalBalance,
    walletLoading,
    walletError,
    transactions,
    transactionsLoading,
    transactionsError,
    reloadWallet,
    reloadTransactions,
  } = useWallet()

  const [showBalance, setShowBalance] = useState(true)
  const [slogan] = useState(() => SLOGANS[Math.floor(Math.random() * SLOGANS.length)])

  const user: StoredUser | null = (() => {
    try {
      const storedUser = localStorage.getItem('user')
      return storedUser ? (JSON.parse(storedUser) as StoredUser) : null
    } catch {
      return null
    }
  })()

  const firstName = user?.first_name ?? 'usuario'

  const handleLogout = () => {
    if (!window.confirm('¿Seguro que quieres cerrar sesión?')) return
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuthenticated(false)
    navigate('/login')
  }

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="dashboard-greeting">
          Hola, <span className="text-orange">{firstName}</span>
        </div>

        <div className="dashboard-search-bar">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="search-icon" />
          <input type="text" placeholder={slogan} className="search-input" readOnly />
        </div>

        <div className="dashboard-header-icons">
          <button
            className="icon-btn"
            aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            onClick={() => setShowBalance((prev) => !prev)}
          >
            {showBalance ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
          </button>
          <Link className="icon-btn" to="/soporte" aria-label="Soporte" title="Soporte">
            <HelpCircle size={18} aria-hidden="true" />
          </Link>
          <button className="icon-btn" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* LEFT COLUMN */}
        <div className="dashboard-left">
          {/* CUENTA AXORA */}
          <section className="dashboard-card account-section">
            <h2 className="section-title">Cuenta Axora</h2>
            <p className="account-balance">
              {walletLoading ? (
                'cargando…'
              ) : showBalance ? (
                <>${formatAmount(totalBalance)} <span className="currency-label">total</span></>
              ) : (
                '••••••'
              )}
            </p>

            <div className="account-actions">
              <button className="action-item" onClick={() => navigate('/topup')}>
                <div className="action-circle">
                  <Plus size={22} aria-hidden="true" />
                </div>
                <span>cargar<br />saldo</span>
              </button>
              <button className="action-item" onClick={() => navigate('/exchange')}>
                <div className="action-circle">
                  <ArrowLeftRight size={20} aria-hidden="true" />
                </div>
                <span>comprar /<br />vender</span>
              </button>
              <button className="action-item" onClick={() => navigate('/transfer')}>
                <div className="action-circle">
                  <Send size={19} aria-hidden="true" />
                </div>
                <span>transferir</span>
              </button>
              <button className="action-item">
                <div className="action-circle">
                  <History size={20} aria-hidden="true" />
                </div>
                <span>historial</span>
              </button>
              <button className="action-item">
                <div className="action-circle">
                  <Settings size={20} aria-hidden="true" />
                </div>
                <span>configuración</span>
              </button>
            </div>
          </section>

          {/* MIS ACTIVOS */}
          <section className="assets-section">
            <div className="section-header">
              <h2 className="section-title">Mis activos</h2>
              <button className="btn-small">Ver más</button>
            </div>

            <div className="assets-grid">
              {walletError && (
                <p className="assets-empty">No se pudieron cargar tus activos: {walletError}</p>
              )}

              {!walletError && !walletLoading && wallet?.balances.length === 0 && (
                <p className="assets-empty">
                  Todavía no tienes saldo en ninguna moneda. Recarga o recibe dinero para ver tus activos aquí.
                </p>
              )}

              {!walletError &&
                wallet?.balances.map((balance) => (
                  <AssetCard key={balance.currency} balance={balance} showBalance={showBalance} />
                ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-right">
          {/* TRANSACCIONES RECIENTES */}
          <section className="dashboard-card transactions-section">
            <div className="section-header">
              <h2 className="section-title">Transacciones recientes</h2>
              <button className="btn-small">Ver más</button>
            </div>

            <ul className="transaction-list">
              {transactionsError && (
                <p className="assets-empty">No se pudieron cargar tus transacciones: {transactionsError}</p>
              )}

              {!transactionsError && !transactionsLoading && transactions.length === 0 && (
                <p className="assets-empty">Todavía no hiciste ninguna transacción.</p>
              )}

              {!transactionsError &&
                transactions.map((tx) => {
                  const TxIcon = TRANSACTION_ICONS[tx.type] ?? History
                  return (
                    <li className="transaction-item" key={tx.id}>
                      <div className="transaction-icon">
                        <TxIcon size={16} aria-hidden="true" />
                      </div>
                      <div className="transaction-details">
                        <span className="transaction-type">{formatTransactionType(tx.type)}</span>
                        <span className="transaction-source">{tx.status}</span>
                      </div>
                      <div className="transaction-value">
                        <span className="transaction-amount">{formatAmount(tx.to_amount)} {tx.to_currency}</span>
                        <span className="transaction-date">{new Date(tx.created_at).toLocaleString('es-AR')}</span>
                      </div>
                    </li>
                  )
                })}
            </ul>
          </section>

          {/* HISTORICO DE DIVISA */}
          <section className="dashboard-card history-section">
            <div className="section-header">
              <h2 className="section-title">Histórico de divisa</h2>
              <select className="currency-select">
                <option>MXN ↓</option>
              </select>
            </div>

            <div className="graph-placeholder" aria-label="Gráfica de cambio de divisa">
              <div className="graph-y-axis">
                <span>10</span>
                <span>9</span>
                <span>8</span>
                <span>7</span>
                <span>6</span>
                <span>5</span>
              </div>
              <div className="graph-area">
                <div className="graph-grid"></div>
              </div>
              <div className="graph-x-axis">
                <span>enero</span>
                <span>febrero</span>
                <span>marzo</span>
                <span>abril</span>
                <span>mayo</span>
                <span>junio</span>
                <span>julio</span>
                <span>agosto</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* CHAT IA */}
      <ChatWidget
        onActionConfirmed={() => {
          reloadWallet()
          reloadTransactions()
        }}
      />
    </div>
  )
}