import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, HelpCircle, LogOut, Plus, ArrowLeftRight, Send, History, Settings, Globe, ShieldCheck, Compass, Search, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'
import { getCountryCode } from '../../utils/currency.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import { useWallet } from '../../hooks/useWallet.ts'

import { CurrencyHistoryChart } from '../../components/dashboard/CurrencyHistoryChart.tsx'
import { BrandLogo } from '../../components/common/BrandLogo.tsx'
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
  'Axora, tu billetera de viaje.',
  'Un solo lugar para todas tus divisas.',
]


function getPaginationRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const range: (number | 'ellipsis')[] = [1]
  if (current > 3) range.push('ellipsis')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) range.push(i)
  if (current < total - 2) range.push('ellipsis')
  range.push(total)
  return range
}

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

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ACTIVITY_PAGE_SIZE = 8

  const availableCurrencies = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach((tx) => {
      if (tx.to_currency) set.add(tx.to_currency)
      if (tx.from_currency) set.add(tx.from_currency)
    })
    return Array.from(set).sort()
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase().replace(/^@/, '')
    return transactions.filter((tx) => {
      if (typeFilter && tx.type !== typeFilter) return false
      if (currencyFilter && tx.to_currency !== currencyFilter && tx.from_currency !== currencyFilter) return false

      if (query) {
        const matchesUsername = tx.counterparty_username?.toLowerCase().includes(query)
        const matchesType = formatTransactionType(tx.type).toLowerCase().includes(query)
        const matchesDescription = tx.description?.toLowerCase().includes(query)
        if (!matchesUsername && !matchesType && !matchesDescription) return false
      }

      const txDate = new Date(tx.created_at)
      if (dateFrom && txDate < new Date(`${dateFrom}T00:00:00`)) return false
      if (dateTo && txDate > new Date(`${dateTo}T23:59:59`)) return false

      return true
    })
  }, [transactions, typeFilter, currencyFilter, searchQuery, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ACTIVITY_PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedTransactions = filteredTransactions.slice(
    (safePage - 1) * ACTIVITY_PAGE_SIZE,
    safePage * ACTIVITY_PAGE_SIZE,
  )
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
        <div className="dashboard-header-left">
          <BrandLogo size="sm" to="/dashboard" />
          <div className="dashboard-greeting">
            Hola, <span className="text-orange">{firstName}</span>
            {user?.username && (
              <span className="username-badge" title={`Usuario: @${user.username}`}>
                @{user.username}
              </span>
            )}
          </div>
        </div>

        <div className="dashboard-slogan-badge" role="status" aria-label="Lema de Axora">
          <Compass size={15} aria-hidden="true" className="slogan-icon" />
          <span className="slogan-text">{slogan}</span>
        </div>

        <div className="dashboard-header-icons">
          {user?.role === 'admin' && (
            <Link
              className="icon-btn"
              to="/admin"
              aria-label="Panel de Administración"
              title="Panel de Administración"
              style={{ color: '#f87171' }}
            >
              <ShieldCheck size={18} aria-hidden="true" />
            </Link>
          )}
          <button
            className="icon-btn"
            aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            onClick={() => setShowBalance((prev) => !prev)}
          >
            {showBalance ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
          </button>
          <Link
            className="icon-btn"
            to="/configuracion"
            aria-label="Configuración de la cuenta"
            title="Configuración"
          >
            <Settings size={18} aria-hidden="true" />
          </Link>
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
               {/* FILA SUPERIOR: cuenta + histórico de divisa */}
        <div className="dashboard-top-row">
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
              {walletError && (
                <p className="assets-empty">No se pudo cargar tu saldo: {walletError}</p>
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
                <span>Cargar</span>
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
                <span>Cambiar</span>
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
              <button
                className="action-item"
                onClick={() => navigate('/configuracion')}
                title="Configuración de la cuenta"
              >
                <div className="action-circle">
                  <Settings size={20} aria-hidden="true" />
                </div>
                <span>Ajustes</span>
              </button>
            </div>
          </section>

          {/* HISTORICO DE DIVISA */}
          <section className="dashboard-card history-section">
            <CurrencyHistoryChart />
          </section>
        </div>

        {/* ACTIVIDAD */}
        <section className="dashboard-card activity-section">
          <div className="activity-header">
            <h2 className="section-title">Actividad</h2>
            <span className="activity-count">{filteredTransactions.length} movimientos</span>
          </div>

          <div className="activity-filters">
            <div className="activity-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar por usuario o descripción..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <select
              className="activity-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">Todo tipo</option>
              <option value="TOP_UP">Recarga</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="SWAP">Cambio de moneda</option>
            </select>

            <select
              className="activity-select"
              value={currencyFilter}
              onChange={(e) => {
                setCurrencyFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">Toda moneda</option>
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="activity-date-range">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label="Desde"
              />
              <span>—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label="Hasta"
              />
            </div>
          </div>

          <div className="activity-table-header">
            <span>Movimiento</span>
            <span>Contraparte</span>
            <span>Monto</span>
            <span>Fecha</span>
          </div>

          <ul className="activity-list">
            {transactionsError && (
              <p className="assets-empty">No se pudieron cargar tus transacciones: {transactionsError}</p>
            )}

            {!transactionsError && !transactionsLoading && filteredTransactions.length === 0 && (
              <p className="assets-empty">No se encontraron movimientos con esos filtros.</p>
            )}

            {!transactionsError &&
              paginatedTransactions.map((tx) => {
                const TxIcon = TRANSACTION_ICONS[tx.type] ?? History
                return (
                  <li className="activity-row" key={tx.id}>
                    <div className="activity-movement">
                      <div className="transaction-icon">
                        <TxIcon size={16} aria-hidden="true" />
                      </div>
                      <div className="transaction-details">
                        <span className="transaction-type">{formatTransactionType(tx.type)}</span>
                        <span className="transaction-source">
                          {tx.type === 'SWAP' && tx.from_currency
                            ? `${tx.from_currency} → ${tx.to_currency}`
                            : tx.status}
                        </span>
                      </div>
                    </div>
                    <div className="activity-counterparty">
                      {tx.counterparty_username ? `@${tx.counterparty_username}` : '—'}
                    </div>
                    <div className="activity-amount">
                      {formatAmount(tx.to_amount)} {tx.to_currency}
                    </div>
                    <div className="activity-date">
                      {new Date(tx.created_at).toLocaleDateString('es-AR')}
                    </div>
                  </li>
                )
              })}
          </ul>

          {totalPages > 1 && (
            <div className="activity-pagination">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              {getPaginationRange(safePage, totalPages).map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                ) : (
                  <button
                    key={item}
                    className={`page-btn ${item === safePage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
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
