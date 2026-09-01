import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
