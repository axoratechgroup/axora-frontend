import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import { getStoredUser, getHomeRoute } from '../utils/user.ts'

export default function PublicOnlyRoute({ children }: PropsWithChildren) {
  const { status, isAuthenticated } = useAuth()

  if (status === 'checking') {
    return (
      <div
        className="auth-loading"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Cargando…</p>
      </div>
    )
  }

  if (isAuthenticated) {
    const user = getStoredUser()
    return <Navigate to={getHomeRoute(user?.role)} replace />
  }

  return children
}
