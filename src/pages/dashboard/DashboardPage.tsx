import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import { fetchWithAuth } from '../../api/fetchWithAuth.ts'
import './DashboardPage.css'

const SLOGANS = [
  'Tu dinero, sin fronteras.',
  'Juan, nuestro calvo favorito <3.',
  'Un solo lugar para todas tus divisas.',
]

interface StoredUser {
  first_name: string
  last_name: string
  username: string
  email: string
}

interface Balance {
  currency: string
  currency_name: string
  symbol: string
  amount: string
  updated_at: string
}

interface WalletResponse {
  wallet_id: string
  created_at: string
  balances: Balance[]
}

interface Transaction {
  id: string
  type: string
  status: string
  from_currency: string | null
  from_amount: string | null
  to_currency: string
  to_amount: string
  applied_exchange_rate: string | null
  description: string | null
  created_at: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()

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

  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [walletError, setWalletError] = useState('')
  const [walletLoading, setWalletLoading] = useState(true)

  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/wallet`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'No se pudo cargar la wallet.')
        }
        const data = await res.json()
        setWallet(data)
      })
      .catch((err: unknown) => {
        setWalletError(err instanceof Error ? err.message : 'No se pudo cargar la wallet.')
      })
      .finally(() => setWalletLoading(false))
  }, [])

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsError, setTransactionsError] = useState('')
  const [transactionsLoading, setTransactionsLoading] = useState(true)

  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/wallet/transactions`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'No se pudieron cargar las transacciones.')
        }
        const data = await res.json()
        setTransactions(data.transactions || [])
      })
      .catch((err: unknown) => {
        setTransactionsError(err instanceof Error ? err.message : 'No se pudieron cargar las transacciones.')
      })
      .finally(() => setTransactionsLoading(false))
  }, [])


  const totalBalance = wallet?.balances.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0) ?? 0

  const handleLogout = () => {
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
          <span className="search-icon" aria-hidden="true">◈</span>
          <input type="text" placeholder={slogan} className="search-input" readOnly />
        </div>

        <div className="dashboard-header-icons">
          <button
            className="icon-btn"
            aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            onClick={() => setShowBalance((prev) => !prev)}
          >
            <span aria-hidden="true">{showBalance ? '◉' : '◎'}</span>
          </button>
          <Link className="icon-btn" to="/soporte" aria-label="Soporte">
            <span aria-hidden="true">?</span>
          </Link>
          <button className="icon-btn" aria-label="Cerrar sesión" onClick={handleLogout}>
            <span aria-hidden="true">⊞</span>
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
                <>${totalBalance.toFixed(2)} <span className="currency-label">total</span></>
              ) : (
                '••••••'
              )}
            </p>

            <div className="account-actions">
              <button className="action-item">
                <div className="action-circle"></div>
                <span>recibir<br />dinero</span>
              </button>
              <button className="action-item">
                <div className="action-circle"></div>
                <span>enviar<br />dinero</span>
              </button>
              <button className="action-item">
                <div className="action-circle"></div>
                <span>historial</span>
              </button>
              <button className="action-item">
                <div className="action-circle"></div>
                <span>convertir</span>
              </button>
              <button className="action-item">
                <div className="action-circle"></div>
                <span>configuracion</span>
              </button>
            </div>
          </section>

          {/* MIS ACTIVOS */}
          <section className="assets-section">
            <div className="section-header">
              <h2 className="section-title">Mis activos</h2>
              <button className="btn-small">ver mas</button>
            </div>

            <div className="assets-grid">
              {walletError && (
                <p className="assets-empty">No se pudieron cargar tus activos: {walletError}</p>
              )}

              {!walletError && !walletLoading && wallet?.balances.length === 0 && (
                <p className="assets-empty">
                  Todavía no tenés saldo en ninguna moneda. Recargá o recibí dinero para ver tus activos acá.
                </p>
              )}

              {!walletError &&
                wallet?.balances.map((balance) => (
                  <div className="asset-card" key={balance.currency}>
                    <div className="asset-icon"></div>
                    <div className="asset-info">
                      <span className="asset-name">{balance.currency_name}</span>
                      <span className="asset-code">{balance.currency}</span>
                    </div>
                    <div className="asset-amount">
                      {showBalance ? `${balance.amount} ${balance.currency}` : '••••'}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-right">
          {/* TRANSACCIONES RECIENTES */}
          <section className="dashboard-card transactions-section">
            <div className="section-header">
              <h2 className="section-title">transacciones recientes</h2>
              <button className="btn-small">ver mas</button>
            </div>

            <ul className="transaction-list">
              {transactionsError && (
                <p className="assets-empty">No se pudieron cargar tus transacciones: {transactionsError}</p>
              )}

              {!transactionsError && !transactionsLoading && transactions.length === 0 && (
                <p className="assets-empty">Todavía no hiciste ninguna transacción.</p>
              )}

              {!transactionsError &&
                transactions.map((tx) => (
                  <li className="transaction-item" key={tx.id}>
                    <div className="transaction-icon"></div>
                    <div className="transaction-details">
                      <span className="transaction-type">{tx.type}</span>
                      <span className="transaction-source">{tx.status}</span>
                    </div>
                    <div className="transaction-value">
                      <span className="transaction-amount">{tx.to_amount} {tx.to_currency}</span>
                      <span className="transaction-date">{new Date(tx.created_at).toLocaleString('es-AR')}</span>
                    </div>
                  </li>
                ))}
            </ul>
          </section>

          {/* HISTORICO DE DIVISA */}
          <section className="dashboard-card history-section">
            <div className="section-header">
              <h2 className="section-title">historico de divisa</h2>
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

      {/* CHAT IA BUTTON */}
      <button className="chat-ia-btn">CHAT IA</button>
    </div>
  )
}