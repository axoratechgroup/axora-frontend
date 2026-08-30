import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import './DashboardPage.css'

const SLOGANS = [
  'Tu dinero, sin fronteras.',
  'Cambia de moneda sin perder tiempo ni plata.',
  'Un solo lugar para todas tus divisas.',
]

interface StoredUser {
  first_name: string
  last_name: string
  username: string
  email: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()

  const [showBalance, setShowBalance] = useState(true)
  const [slogan] = useState(() => SLOGANS[Math.floor(Math.random() * SLOGANS.length)])

  const storedUser = localStorage.getItem('user')
  const user: StoredUser | null = storedUser ? JSON.parse(storedUser) : null
  const firstName = user?.first_name ?? 'usuario'

  // TODO: reemplazar por fetch real cuando el backend exponga el endpoint de wallet/balances.
  // const [wallet, setWallet] = useState<WalletResponse | null>(null)
  //
  // useEffect(() => {
  //   const token = localStorage.getItem('token')
  //   fetch(`${import.meta.env.VITE_API_URL}/wallet`, {
  //     headers: { Authorization: `Bearer ${token}` },
  //   })
  //     .then((res) => res.json())
  //     .then(setWallet)
  //     .catch((err) => console.error('Error al cargar la wallet:', err))
  // }, [])

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
              {showBalance
                ? <>$1,504 <span className="currency-label">mxn</span></>
                : '••••••'}
            </p>

            <div className="account-actions">
              <button className="action-item">
                <div className="action-circle"></div>
                <span>recibir<br/>dinero</span>
              </button>
              <button className="action-item">
                <div className="action-circle"></div>
                <span>enviar<br/>dinero</span>
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
              <div className="asset-card">
                <div className="asset-icon"></div>
                <div className="asset-info">
                  <span className="asset-name">DOLLAR USD</span>
                  <span className="asset-code">USD</span>
                </div>
                <div className="asset-amount">{showBalance ? '1075 USD' : '••••'}</div>
              </div>

              <div className="asset-card">
                <div className="asset-icon"></div>
                <div className="asset-info">
                  <span className="asset-name">PESO MEXICANO</span>
                  <span className="asset-code">MXN</span>
                </div>
                <div className="asset-amount">{showBalance ? '1075 MXN' : '••••'}</div>
              </div>

              <div className="asset-card">
                <div className="asset-icon"></div>
                <div className="asset-info">
                  <span className="asset-name">PESO COLOMBIANO</span>
                  <span className="asset-code">MXN</span>
                </div>
                <div className="asset-amount">{showBalance ? '1075 MXN' : '••••'}</div>
              </div>

              <div className="asset-card">
                <div className="asset-icon"></div>
                <div className="asset-info">
                  <span className="asset-name">LIBRA ESTERLINA</span>
                  <span className="asset-code">LBR</span>
                </div>
                <div className="asset-amount">{showBalance ? '1075 MXN' : '••••'}</div>
              </div>

              <div className="asset-card">
                <div className="asset-icon"></div>
                <div className="asset-info">
                  <span className="asset-name">EURO</span>
                  <span className="asset-code">EUR</span>
                </div>
                <div className="asset-amount">{showBalance ? '1075 MXN' : '••••'}</div>
              </div>
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
              <li className="transaction-item">
                <div className="transaction-icon"></div>
                <div className="transaction-details">
                  <span className="transaction-type">Recibido</span>
                  <span className="transaction-source">desde 8913135</span>
                </div>
                <div className="transaction-value">
                  <span className="transaction-amount">500 mxn</span>
                  <span className="transaction-date">25 de agosto de 2026 15:00</span>
                </div>
              </li>
              <li className="transaction-item">
                <div className="transaction-icon"></div>
                <div className="transaction-details">
                  <span className="transaction-type">Recibido</span>
                  <span className="transaction-source">desde 8913135</span>
                </div>
                <div className="transaction-value">
                  <span className="transaction-amount">250 mxn</span>
                  <span className="transaction-date">25 de agosto de 2026 18:00</span>
                </div>
              </li>
              <li className="transaction-item">
                <div className="transaction-icon"></div>
                <div className="transaction-details">
                  <span className="transaction-type">Recibido</span>
                  <span className="transaction-source">desde 8913135</span>
                </div>
                <div className="transaction-value">
                  <span className="transaction-amount">500 mxn</span>
                  <span className="transaction-date">25 de agosto de 2026 15:00</span>
                </div>
              </li>
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