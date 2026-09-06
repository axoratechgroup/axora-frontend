import { Link } from 'react-router-dom'
import './BrandLogo.css'

interface BrandLogoProps {
  to?: string
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
  onClick?: () => void
  'aria-label'?: string
}

export function BrandLogo({
  to,
  size = 'md',
  showWordmark = true,
  className = '',
  onClick,
  'aria-label': ariaLabel = 'AXORA, ir al inicio',
}: BrandLogoProps) {
  const content = (
    <div className={`brand-logo brand-logo--${size} ${className}`.trim()}>
      <svg
        className="brand-logo__icon"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Norte — Acento Principal */}
        <polygon points="15,2 15,15 2,15 9,9" fill="#E8821E" />
        {/* Este — Acento Claro */}
        <polygon points="17,2 23,9 30,15 17,15" fill="#F6C68B" />
        {/* Sur — Acento Oscuro */}
        <polygon points="30,17 23,23 17,30 17,17" fill="#C26A10" />
        {/* Oeste — Neutro Adaptable */}
        <polygon points="15,17 15,30 9,23 2,17" fill="currentColor" opacity="0.85" />
      </svg>
      {showWordmark && <span className="brand-logo__wordmark">AXORA</span>}
    </div>
  )

  if (to) {
    if (to.startsWith('#')) {
      return (
        <a href={to} className="brand-logo-link" onClick={onClick} aria-label={ariaLabel}>
          {content}
        </a>
      )
    }
    return (
      <Link to={to} className="brand-logo-link" onClick={onClick} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  }

  return content
}
