import { Link } from 'react-router-dom'
import { BrandLogo } from '../../components/common/BrandLogo.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { getStoredUser, getHomeRoute } from '../../utils/user.ts'
import './NotFoundPage.css'

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth()
  const user = getStoredUser()
  const homePath = isAuthenticated ? getHomeRoute(user?.role) : '/'
  const homeLabel = isAuthenticated
    ? (user?.role === 'admin' ? 'Volver al panel' : 'Volver al dashboard')
    : 'Volver al inicio'
  
  return (
    <div className="not-found-page">
      {/* Brand mark */}
      <div className="not-found-brand-wrapper">
        <BrandLogo size="lg" to={homePath} />
      </div>

      {/* Card */}
      <div className="not-found-card" role="main">
        <div className="not-found-cat" aria-hidden="true">
          🐱
        </div>
        <h1 className="not-found-code">404</h1>
        <p className="not-found-subtitle">Ups… este gatito no encontró la página.</p>
        <p className="not-found-description">La página que buscas no existe.</p>

        <Link className="not-found-btn" to={homePath}>
          {homeLabel}
        </Link>
      </div>
    </div>
  )
}
