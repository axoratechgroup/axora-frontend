import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, HelpCircle, LogOut, Plus, ArrowLeftRight, Send, History, Settings, Globe, type LucideIcon } from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'
import { getCountryCode } from '../../utils/currency.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import { useWallet } from '../../hooks/useWallet.ts'
import { AssetCard } from '../../components/dashboard/AssetCard.tsx'
import { CurrencyHistoryChart } from '../../components/dashboard/CurrencyHistoryChart.tsx'
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

  const [selectedCurrency, setSelectedCurrency] = useState<string>('TOTAL')
  const [showBalance, setShowBalance] = useState(true)
  const [slogan] = useState(() => SLOGANS[Math.floor(Math.random() * SLOGANS.length)])

  const activeBalance = wallet?.balances.find((b) => b.currency === selectedCurrency)

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
          {user?.username && (
            <span className="username-badge" title={`Usuario: @${user.username}`}>
              @{user.username}
            </span>
          )}
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
            <div className="account-card-header">
              <h2 className="section-title">Cuenta Axora</h2>
              {selectedCurrency !== 'TOTAL' && (
                <button
                  className="btn-back-total"
                  onClick={() => setSelectedCurrency('TOTAL')}
                  title="Volver a ver el total general en USD"
                >
                  Ver total USD
                </button>
              )}
            </div>

            {/* CURRENCY SELECTOR PILLS */}
            <div className="currency-pills-bar" role="tablist" aria-label="Seleccionar moneda">
              <button
                role="tab"
                aria-selected={selectedCurrency === 'TOTAL'}
                className={`currency-pill ${selectedCurrency === 'TOTAL' ? 'active' : ''}`}
                onClick={() => setSelectedCurrency('TOTAL')}
              >
                <Globe size={16} aria-hidden="true" />
                <span>Total (USD)</span>
              </button>
              {wallet?.balances.map((b) => {
                const cCode = getCountryCode(b.currency)
                return (
                  <button
                    key={b.currency}
                    role="tab"
                    aria-selected={selectedCurrency === b.currency}
                    className={`currency-pill ${selectedCurrency === b.currency ? 'active' : ''}`}
                    onClick={() => setSelectedCurrency(b.currency)}
                  >
                    {cCode && (
                      <ReactCountryFlag
                        countryCode={cCode}
                        svg
                        style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                        aria-label={b.currency_name}
                      />
                    )}
                    <span>{b.currency}</span>
                  </button>
                )
              })}
            </div>

            {/* FOCUSED BALANCE */}
            <div className="account-balance-wrapper">
              <p className="account-balance" data-testid="account-balance">
                {walletLoading ? (
                  'cargando…'
                ) : showBalance ? (
                  selectedCurrency === 'TOTAL' ? (
                    <>
                      <span className="balance-approx">≈ $</span>
                      {formatAmount(totalBalance)}{' '}
                      <span className="currency-label">USD</span>
                    </>
                  ) : (
                    <>
                      <span className="balance-symbol">{activeBalance?.symbol || '$'}</span>
                      {formatAmount(activeBalance?.amount || 0)}{' '}
                      <span className="currency-label">{selectedCurrency}</span>
                    </>
                  )
                ) : (
                  '••••••'
                )}
              </p>
              {!walletLoading && showBalance && (
                <p className="account-balance-hint" data-testid="account-balance-hint">
                  {selectedCurrency === 'TOTAL'
                    ? 'Patrimonio total consolidado en USD (según tipo de cambio actual)'
                    : activeBalance?.currency_name ?? selectedCurrency}
                </p>
              )}
            </div>

            <div className="account-actions">
              <button
                className="action-item"
                onClick={() =>
                  navigate(
                    selectedCurrency !== 'TOTAL'
                      ? `/topup?currency=${selectedCurrency}`
                      : '/topup',
                  )
                }
              >
                <div className="action-circle">
                  <Plus size={22} aria-hidden="true" />
                </div>
                <span>Cargar<br />saldo</span>
              </button>
              <button
                className="action-item"
                onClick={() =>
                  navigate(
                    selectedCurrency !== 'TOTAL'
                      ? `/exchange?from=${selectedCurrency}`
                      : '/exchange',
                  )
                }
              >
                <div className="action-circle">
                  <ArrowLeftRight size={20} aria-hidden="true" />
                </div>
                <span>Comprar /<br />vender</span>
              </button>
              <button
                className="action-item"
                onClick={() =>
                  navigate(
                    selectedCurrency !== 'TOTAL'
                      ? `/transfer?currency=${selectedCurrency}`
                      : '/transfer',
                  )
                }
              >
                <div className="action-circle">
                  <Send size={19} aria-hidden="true" />
                </div>
                <span>Transferir</span>
              </button>
              <button className="action-item" onClick={() => navigate('/historial')}>
                <div className="action-circle">
                  <History size={20} aria-hidden="true" />
                </div>
                <span>Historial</span>
              </button>
              <button
                className="action-item"
                onClick={() => navigate('/configuracion')}
                title="Configuración de la cuenta"
              >
                <div className="action-circle">
                  <Settings size={20} aria-hidden="true" />
                </div>
                <span>Configuración</span>
              </button>
            </div>
          </section>

          {/* MIS ACTIVOS */}
          <section className="assets-section">
            <div className="section-header">
              <h2 className="section-title">Mis activos</h2>
              <button
                className="btn-small"
                onClick={() => navigate('/exchange')}
                title="Ir a comprar / vender activos"
              >
                Ver más
              </button>
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
                  <AssetCard
                    key={balance.currency}
                    balance={balance}
                    showBalance={showBalance}
                    isSelected={selectedCurrency === balance.currency}
                    onClick={() => setSelectedCurrency(balance.currency)}
                  />
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
              <button className="btn-small" onClick={() => navigate('/historial')}>Ver más</button>
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
            <CurrencyHistoryChart />
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
