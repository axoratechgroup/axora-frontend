import { Link } from 'react-router-dom'
import './NotFoundPage.css'

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      {/* Brand mark */}
      <div className="not-found-brand" aria-label="Axora">
        <span className="not-found-brand-icon" aria-hidden="true">◈</span>
        <p className="not-found-brand-name">AXORA</p>
      </div>

      {/* Card */}
      <div className="not-found-card" role="main">
        <div className="not-found-cat" aria-hidden="true">
          🐱
        </div>
        <h1 className="not-found-code">404</h1>
        <p className="not-found-subtitle">Ups… este gatito no encontró la página.</p>
        <p className="not-found-description">La página que buscas no existe.</p>

        <Link className="not-found-btn" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
