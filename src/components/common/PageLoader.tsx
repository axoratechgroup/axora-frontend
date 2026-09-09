import { BrandLogo } from './BrandLogo.tsx'
import './PageLoader.css'

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = 'Cargando Axora…' }: PageLoaderProps) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader__content">
        <div className="page-loader__logo-wrapper">
          <BrandLogo size="lg" showWordmark={true} />
        </div>
        <div className="page-loader__spinner" />
        <p className="page-loader__message">{message}</p>
      </div>
    </div>
  )
}
