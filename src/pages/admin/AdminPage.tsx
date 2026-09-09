import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
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
  LogOut,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  getAdminUsersApi,
  getAdminTransactionsApi,
  updateUserRoleApi,
  type AdminUser,
  type AdminTransaction,
  type UserRole,
} from '../../api/admin.api.ts'
import { formatAmount, formatTransactionType } from '../../utils/formatters.ts'
import { BrandLogo } from '../../components/common/BrandLogo.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { getStoredUser } from '../../utils/user.ts'
import './AdminPage.css'

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

export default function AdminPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()

  // Control de rol
  const currentUser = useMemo(() => getStoredUser(), [])

  const isAdmin = currentUser?.role === 'admin'

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [pendingRoleChange, setPendingRoleChange] = useState<{ user: AdminUser; nextRole: UserRole } | null>(null)

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuthenticated(false)
    toast.info('Sesión cerrada correctamente.')
    navigate('/login')
  }

  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  // Paginación y filtros secundarios
  const [usersPage, setUsersPage] = useState(1)
  const [txPage, setTxPage] = useState(1)
  const [txTypeFilter, setTxTypeFilter] = useState('')
  const [txStatusFilter, setTxStatusFilter] = useState('')
  const PAGE_SIZE = 8

  useEffect(() => {
    setUsersPage(1)
  }, [searchTerm])

  useEffect(() => {
    setTxPage(1)
  }, [searchTerm, txTypeFilter, txStatusFilter])

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
    if (!isAdmin) return

    let isMounted = true

    Promise.all([getAdminUsersApi(), getAdminTransactionsApi()])
      .then(([usersData, txData]) => {
        if (!isMounted) return
        setUsers(usersData)
        setTransactions(txData)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Error al cargar los datos de administración.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isAdmin])

  const handleRoleSelect = (user: AdminUser, nextRole: UserRole) => {
    if (nextRole === user.role) return
    setPendingRoleChange({ user, nextRole })
  }

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return
    const { user, nextRole } = pendingRoleChange
    setPendingRoleChange(null)

    setRoleError(null)
    setUpdatingUserId(user.id)
    try {
      const updated = await updateUserRoleApi(user.id, nextRole)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u)))
      toast.success(`Rol de @${user.username} actualizado a ${nextRole === 'admin' ? 'Administrador' : 'Usuario'}.`)
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'No se pudo actualizar el rol del usuario.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalUsers = users.length
    const totalAdmins = users.filter((u) => u.role === 'admin').length
    const totalTx = transactions.length
    const swapTx = transactions.filter((t) => t.type === 'SWAP').length
    const transferTx = transactions.filter((t) => t.type === 'TRANSFER').length
    const topupTx = transactions.filter((t) => t.type === 'TOP_UP').length
    const completedTx = transactions.filter((t) => t.status === 'COMPLETED').length

    return { totalUsers, totalAdmins, totalTx, swapTx, transferTx, topupTx, completedTx }
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

  // Paginación de usuarios
  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safeUsersPage = Math.min(usersPage, usersTotalPages)
  const paginatedUsers = useMemo(() => {
    const start = (safeUsersPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, safeUsersPage])

  // Filtrado de transacciones
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (txTypeFilter && t.type !== txTypeFilter) return false
      if (txStatusFilter && t.status !== txStatusFilter) return false
      if (!searchTerm.trim()) return true
      const query = searchTerm.toLowerCase()
      return (
        t.username.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query) ||
        t.to_currency.toLowerCase().includes(query) ||
        (t.from_currency && t.from_currency.toLowerCase().includes(query)) ||
        (t.recipient_username && t.recipient_username.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query))
      )
    })
  }, [transactions, searchTerm, txTypeFilter, txStatusFilter])

  // Paginación de transacciones
  const txTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const safeTxPage = Math.min(txPage, txTotalPages)
  const paginatedTransactions = useMemo(() => {
    const start = (safeTxPage - 1) * PAGE_SIZE
    return filteredTransactions.slice(start, start + PAGE_SIZE)
  }, [filteredTransactions, safeTxPage])

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
              <BrandLogo size="sm" to="/admin" />
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
            <button className="admin-btn admin-btn-secondary" onClick={loadData} disabled={loading} title="Actualizar datos">
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Actualizar
            </button>
            <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/configuracion')} title="Configuración de la cuenta">
              <Settings size={15} /> Configuración
            </button>
            <button className="admin-btn admin-btn-danger" onClick={() => setIsLogoutModalOpen(true)} title="Cerrar sesión">
              <LogOut size={15} /> Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Métricas estructuradas con jerarquía */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card admin-metric-featured">
            <div className="metric-icon metric-icon-users">
              <Users size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Usuarios Registrados</span>
              <span className="metric-value">{metrics.totalUsers}</span>
              <div className="metric-subtext">
                <span className="metric-subtext-badge">{metrics.totalAdmins} admin</span>
                <span>{metrics.totalUsers - metrics.totalAdmins} estándar</span>
              </div>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="metric-icon metric-icon-users">
              <ShieldCheck size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Administradores</span>
              <span className="metric-value">{metrics.totalAdmins}</span>
              <div className="metric-subtext">
                <span>{metrics.totalUsers > 0 ? Math.round((metrics.totalAdmins / metrics.totalUsers) * 100) : 0}% del total</span>
              </div>
            </div>
          </div>
          <div className="admin-metric-card admin-metric-featured">
            <div className="metric-icon metric-icon-tx">
              <Clock size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Transacciones Globales</span>
              <span className="metric-value">{metrics.totalTx}</span>
              <div className="metric-subtext">
                <span className="metric-subtext-badge">{metrics.completedTx} completadas</span>
              </div>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="metric-icon metric-icon-swap">
              <ArrowLeftRight size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Intercambios (SWAP)</span>
              <span className="metric-value">{metrics.swapTx}</span>
              <div className="metric-subtext">
                <span>{metrics.totalTx > 0 ? Math.round((metrics.swapTx / metrics.totalTx) * 100) : 0}% del volumen</span>
              </div>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="metric-icon metric-icon-transfers">
              <Send size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Transferencias / Cargas</span>
              <span className="metric-value">{metrics.transferTx + metrics.topupTx}</span>
              <div className="metric-subtext">
                <span>{metrics.transferTx} transf. · {metrics.topupTx} cargas</span>
              </div>
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

          <div className="admin-search-wrapper" role="search">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              className="admin-search-input"
              aria-label={activeTab === 'users' ? 'Buscar usuario por nombre o correo electrónico' : 'Buscar transacción por identificador o descripción'}
              placeholder={activeTab === 'users' ? 'Buscar por usuario o email…' : 'Buscar transacción…'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Filtros secundarios para transacciones */}
        {activeTab === 'transactions' && (
          <div className="admin-filters-strip" role="toolbar" aria-label="Filtros de transacciones">
            <div className="admin-filter-item">
              <label htmlFor="tx_type_filter">Tipo:</label>
              <select
                id="tx_type_filter"
                className="admin-select"
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                aria-label="Filtrar por tipo de transacción"
              >
                <option value="">Todos los tipos</option>
                <option value="TOP_UP">Cargas de saldo</option>
                <option value="TRANSFER">Transferencias</option>
                <option value="SWAP">Intercambios (SWAP)</option>
              </select>
            </div>

            <div className="admin-filter-item">
              <label htmlFor="tx_status_filter">Estado:</label>
              <select
                id="tx_status_filter"
                className="admin-select"
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value)}
                aria-label="Filtrar por estado de transacción"
              >
                <option value="">Todos los estados</option>
                <option value="COMPLETED">Completadas</option>
                <option value="PENDING">Pendientes</option>
                <option value="FAILED">Fallidas</option>
              </select>
            </div>

            {(txTypeFilter || txStatusFilter || searchTerm) && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ padding: '0.35rem 0.75rem', minHeight: '34px', fontSize: '0.8rem' }}
                onClick={() => {
                  setTxTypeFilter('')
                  setTxStatusFilter('')
                  setSearchTerm('')
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Mensaje de error si falla */}
        {error && (
          <div className="admin-error-box">
            <p>{error}</p>
            <button onClick={loadData}>Reintentar</button>
          </div>
        )}

        {roleError && (
          <div className="admin-error-box">
            <p>{roleError}</p>
            <button onClick={() => setRoleError(null)}>Cerrar</button>
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
                <div className="admin-empty-card">
                  <div className="admin-empty-icon" aria-hidden="true">
                    <Search size={28} />
                  </div>
                  <h3 className="admin-empty-title">
                    {searchTerm ? "No se encontraron usuarios" : "Sin usuarios registrados"}
                  </h3>
                  <p className="admin-empty-desc">
                    {searchTerm
                      ? "No se encontraron usuarios que coincidan con la búsqueda."
                      : "Aún no se han registrado cuentas de usuario en AXORA."}
                  </p>
                  {searchTerm && (
                    <div className="admin-empty-action">
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={() => setSearchTerm('')}
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Nombre Completo</th>
                        <th>Correo Electrónico</th>
                        <th>ID de Cuenta</th>
                        <th>Fecha de Registro</th>
                        <th>Rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((u) => {
                        const isSelf = u.id === currentUser?.id
                        const isUpdating = updatingUserId === u.id
                        return (
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
                            <td>
                              <select
                                className={`role-select role-select-${u.role}`}
                                value={u.role}
                                aria-label={`Cambiar rol para ${u.email}`}
                                disabled={isSelf || isUpdating}
                                title={isSelf ? 'No puedes cambiar tu propio rol' : undefined}
                                onChange={(e) => handleRoleSelect(u, e.target.value as UserRole)}
                              >
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  <div className="admin-pagination-bar">
                    <span className="admin-pagination-info">
                      Mostrando {(safeUsersPage - 1) * PAGE_SIZE + 1} a {Math.min(safeUsersPage * PAGE_SIZE, filteredUsers.length)} de {filteredUsers.length} usuarios
                    </span>
                    {usersTotalPages > 1 && (
                      <div className="admin-pagination-controls" role="navigation" aria-label="Paginación de usuarios">
                        <button
                          className="admin-page-btn"
                          onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                          disabled={safeUsersPage === 1}
                          aria-label="Página anterior"
                        >
                          <ChevronLeft size={16} aria-hidden="true" />
                        </button>
                        {getPaginationRange(safeUsersPage, usersTotalPages).map((item, idx) =>
                          item === 'ellipsis' ? (
                            <span key={`users-ellipsis-${idx}`} className="admin-page-ellipsis">…</span>
                          ) : (
                            <button
                              key={`users-page-${item}`}
                              className={`admin-page-btn ${item === safeUsersPage ? 'active' : ''}`}
                              onClick={() => setUsersPage(item)}
                              aria-current={item === safeUsersPage ? 'page' : undefined}
                            >
                              {item}
                            </button>
                          ),
                        )}
                        <button
                          className="admin-page-btn"
                          onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                          disabled={safeUsersPage === usersTotalPages}
                          aria-label="Página siguiente"
                        >
                          <ChevronRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )
            ) : filteredTransactions.length === 0 ? (
              <div className="admin-empty-card">
                <div className="admin-empty-icon" aria-hidden="true">
                  <Search size={28} />
                </div>
                <h3 className="admin-empty-title">
                  {searchTerm || txTypeFilter || txStatusFilter
                    ? "No se encontraron transacciones"
                    : "Sin transacciones registradas"}
                </h3>
                <p className="admin-empty-desc">
                  {searchTerm || txTypeFilter || txStatusFilter
                    ? "No se encontraron transacciones que coincidan con los filtros seleccionados."
                    : "Aún no se han procesado operaciones en el sistema."}
                </p>
                {(searchTerm || txTypeFilter || txStatusFilter) && (
                  <div className="admin-empty-action">
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() => {
                        setSearchTerm('')
                        setTxTypeFilter('')
                        setTxStatusFilter('')
                      }}
                    >
                      Restablecer filtros
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
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
                    {paginatedTransactions.map((tx) => (
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
                          {tx.type === 'TRANSFER' ? (
                            <div className="tx-transfer-detail">
                              <span>@{tx.username} → {tx.recipient_username ? `@${tx.recipient_username}` : '—'}</span>
                              {tx.description && <small>{tx.description}</small>}
                            </div>
                          ) : tx.type === 'SWAP' && tx.from_currency ? (
                            `${tx.from_currency} → ${tx.to_currency}`
                          ) : (
                            tx.description || 'Operación estándar'
                          )}
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
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="admin-pagination-bar">
                  <span className="admin-pagination-info">
                    Mostrando {(safeTxPage - 1) * PAGE_SIZE + 1} a {Math.min(safeTxPage * PAGE_SIZE, filteredTransactions.length)} de {filteredTransactions.length} transacciones
                  </span>
                  {txTotalPages > 1 && (
                    <div className="admin-pagination-controls" role="navigation" aria-label="Paginación de transacciones">
                      <button
                        className="admin-page-btn"
                        onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        disabled={safeTxPage === 1}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft size={16} aria-hidden="true" />
                      </button>
                      {getPaginationRange(safeTxPage, txTotalPages).map((item, idx) =>
                        item === 'ellipsis' ? (
                          <span key={`tx-ellipsis-${idx}`} className="admin-page-ellipsis">…</span>
                        ) : (
                          <button
                            key={`tx-page-${item}`}
                            className={`admin-page-btn ${item === safeTxPage ? 'active' : ''}`}
                            onClick={() => setTxPage(item)}
                            aria-current={item === safeTxPage ? 'page' : undefined}
                          >
                            {item}
                          </button>
                        ),
                      )}
                      <button
                        className="admin-page-btn"
                        onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                        disabled={safeTxPage === txTotalPages}
                        aria-label="Página siguiente"
                      >
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        title="Cerrar sesión"
        message="¿Seguro que quieres cerrar sesión? Tendrás que volver a ingresar tus credenciales."
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingRoleChange)}
        title={pendingRoleChange?.nextRole === 'admin' ? 'Promover a Administrador' : 'Quitar rol de Administrador'}
        message={
          pendingRoleChange
            ? `¿Seguro que quieres ${
                pendingRoleChange.nextRole === 'admin'
                  ? 'promover a administrador a'
                  : 'quitar el rol de administrador a'
              } @${pendingRoleChange.user.username}?`
            : ''
        }
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant={pendingRoleChange?.nextRole === 'admin' ? 'warning' : 'danger'}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setPendingRoleChange(null)}
      />
    </div>
  )
}
