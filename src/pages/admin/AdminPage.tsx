import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  ArrowLeftRight,
  ShieldCheck,
  Search,
  ArrowLeft,
  RefreshCw,
  Clock,
  ShieldAlert,
  Send,
  PlusCircle,
} from 'lucide-react'
import { getAdminUsersApi, getAdminTransactionsApi, type AdminUser, type AdminTransaction } from '../../api/admin.api.ts'
import { formatAmount, formatTransactionType } from '../../utils/formatters.ts'
import './AdminPage.css'

export default function AdminPage() {
  const navigate = useNavigate()

  // Control de rol
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const isAdmin = currentUser?.role === 'admin'

  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    if (!isAdmin) return
    setLoading(true)
    setError(null)
    try {
      const [usersData, txData] = await Promise.all([
        getAdminUsersApi(),
        getAdminTransactionsApi(),
      ])
      setUsers(usersData)
      setTransactions(txData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de administración.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalUsers = users.length
    const totalTx = transactions.length
    const swapTx = transactions.filter((t) => t.type === 'SWAP').length
    const transferTx = transactions.filter((t) => t.type === 'TRANSFER').length
    const topupTx = transactions.filter((t) => t.type === 'TOP_UP').length

    return { totalUsers, totalTx, swapTx, transferTx, topupTx }
  }, [users, transactions])

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users
    const query = searchTerm.toLowerCase()
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.first_name.toLowerCase().includes(query) ||
        u.last_name.toLowerCase().includes(query),
    )
  }, [users, searchTerm])

  // Filtrado de transacciones
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions
    const query = searchTerm.toLowerCase()
    return transactions.filter(
      (t) =>
        t.username.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query) ||
        t.to_currency.toLowerCase().includes(query) ||
        (t.from_currency && t.from_currency.toLowerCase().includes(query)),
    )
  }, [transactions, searchTerm])

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-restricted-card">
          <div className="admin-restricted-icon">
            <ShieldAlert size={48} color="#ef4444" />
          </div>
          <h2>Acceso Restringido</h2>
          <p>
            Esta vista está reservada exclusivamente para cuentas con rol de <strong>Administrador</strong>. Tu cuenta actual no posee los permisos necesarios.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header de Administración */}
        <header className="admin-header">
          <div className="admin-header-title">
            <div className="admin-title-row">
              <h1>Panel de Administración</h1>
              <span className="admin-badge">
                <ShieldCheck size={14} /> Admin
              </span>
            </div>
            <p className="admin-subtitle">
              Supervisión de usuarios, auditoría de transacciones y conciliación de saldos en AXORA.
            </p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-secondary" onClick={loadData} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Actualizar
            </button>
            <button className="admin-btn admin-btn-primary" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={15} /> Dashboard
            </button>
          </div>
        </header>

        {/* Métricas rápidas */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <div className="metric-icon metric-icon-users">
              <Users size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Usuarios Registrados</span>
              <span className="metric-value">{metrics.totalUsers}</span>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="metric-icon metric-icon-tx">
              <Clock size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Transacciones Globales</span>
              <span className="metric-value">{metrics.totalTx}</span>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="metric-icon metric-icon-swap">
              <ArrowLeftRight size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Intercambios (SWAP)</span>
              <span className="metric-value">{metrics.swapTx}</span>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="metric-icon metric-icon-transfers">
              <Send size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Transferencias / Cargas</span>
              <span className="metric-value">{metrics.transferTx + metrics.topupTx}</span>
            </div>
          </div>
        </div>

        {/* Barra de control: Pestañas y Buscador */}
        <div className="admin-controls-bar">
          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={16} /> Usuarios ({users.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <ArrowLeftRight size={16} /> Transacciones ({transactions.length})
            </button>
          </div>

          <div className="admin-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder={activeTab === 'users' ? 'Buscar por usuario o email…' : 'Buscar transacción…'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Mensaje de error si falla */}
        {error && (
          <div className="admin-error-box">
            <p>{error}</p>
            <button onClick={loadData}>Reintentar</button>
          </div>
        )}

        {/* Contenido según pestaña */}
        {loading ? (
          <div className="admin-loading-box">
            <RefreshCw size={28} className="spin" />
            <p>Cargando registros del servidor…</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            {activeTab === 'users' ? (
              filteredUsers.length === 0 ? (
                <p className="admin-empty">No se encontraron usuarios que coincidan con la búsqueda.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre Completo</th>
                      <th>Correo Electrónico</th>
                      <th>ID de Cuenta</th>
                      <th>Fecha de Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-cell">
                            <span className="user-avatar">{u.username.slice(0, 2).toUpperCase()}</span>
                            <span className="user-username">@{u.username}</span>
                          </div>
                        </td>
                        <td>{u.first_name} {u.last_name}</td>
                        <td>{u.email}</td>
                        <td><code className="admin-id-code">{u.id.slice(0, 8)}…</code></td>
                        <td>{new Date(u.created_at).toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : filteredTransactions.length === 0 ? (
              <p className="admin-empty">No se encontraron transacciones que coincidan con la búsqueda.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Usuario</th>
                    <th>Tipo</th>
                    <th>Detalle de Operación</th>
                    <th>Monto Final</th>
                    <th>Tasa Aplicada</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.created_at).toLocaleString('es-AR')}</td>
                      <td>
                        <div className="tx-user-info">
                          <strong>@{tx.username}</strong>
                          <small>{tx.email}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`tx-type-pill tx-${tx.type.toLowerCase()}`}>
                          {tx.type === 'TOP_UP' && <PlusCircle size={12} />}
                          {tx.type === 'TRANSFER' && <Send size={12} />}
                          {tx.type === 'SWAP' && <ArrowLeftRight size={12} />}
                          {formatTransactionType(tx.type)}
                        </span>
                      </td>
                      <td>
                        {tx.type === 'SWAP' && tx.from_currency
                          ? `${tx.from_currency} → ${tx.to_currency}`
                          : tx.description || 'Operación estándar'}
                      </td>
                      <td>
                        <strong>{formatAmount(tx.to_amount)} {tx.to_currency}</strong>
                      </td>
                      <td>
                        {tx.applied_exchange_rate
                          ? Number(tx.applied_exchange_rate).toLocaleString('es-AR', { maximumFractionDigits: 4 })
                          : '—'}
                      </td>
                      <td>
                        <span className="tx-status-badge status-completed">{tx.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
