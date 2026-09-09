import { Zap, ArrowLeftRight, ShieldCheck, Globe } from 'lucide-react'
import { BrandLogo } from './BrandLogo.tsx'
import './AuthShowcase.css'

interface AuthShowcaseProps {
  title?: string
  subtitle?: string
}

export function AuthShowcase({
  title = 'Mueve tu dinero por el mundo sin fronteras',
  subtitle = 'Gestiona, convierte y transfiere entre 6 monedas desde una sola cuenta con total transparencia, seguridad bancaria y cotización en tiempo real.',
}: AuthShowcaseProps) {
  return (
    <div className="auth-showcase" aria-label="Beneficios y características de AXORA">
      <div className="auth-showcase__brand">
        <BrandLogo size="lg" to="/" />
      </div>

      <div className="auth-showcase__content">
        <span className="auth-showcase__eyebrow">
          <Globe size={13} aria-hidden="true" />
          TU CUENTA GLOBAL MULTI-MONEDA
        </span>

        <h1 className="auth-showcase__title">{title}</h1>
        <p className="auth-showcase__subtitle">{subtitle}</p>

        <ul className="auth-showcase__features">
          <li className="auth-showcase__feature-item">
            <div className="auth-showcase__feature-icon" aria-hidden="true">
              <Zap size={18} />
            </div>
            <div className="auth-showcase__feature-text">
              <strong>Transferencias instantáneas y gratuitas</strong>
              <span>Envía dinero a otros usuarios AXORA en segundos con $0 comisión.</span>
            </div>
          </li>

          <li className="auth-showcase__feature-item">
            <div className="auth-showcase__feature-icon" aria-hidden="true">
              <ArrowLeftRight size={18} />
            </div>
            <div className="auth-showcase__feature-text">
              <strong>Cambio de divisas con cotización justa</strong>
              <span>Tasa de cambio transparente con una comisión de solo 0.3%.</span>
            </div>
          </li>

          <li className="auth-showcase__feature-item">
            <div className="auth-showcase__feature-icon" aria-hidden="true">
              <ShieldCheck size={18} />
            </div>
            <div className="auth-showcase__feature-text">
              <strong>Seguridad y trazabilidad total</strong>
              <span>Monitoreo en vivo de movimientos y notificaciones automáticas.</span>
            </div>
          </li>
        </ul>

        <div className="auth-showcase__mockup" aria-hidden="true">
          <div className="auth-showcase__mockup-header">
            <span className="mockup-dot red"></span>
            <span className="mockup-dot yellow"></span>
            <span className="mockup-dot green"></span>
            <span className="mockup-title">Billetera global multi-moneda</span>
          </div>
          <div className="auth-showcase__mockup-body">
            <div className="auth-showcase__mockup-currency-pills">
              <span className="auth-pill active">USD</span>
              <span className="auth-pill">EUR</span>
              <span className="auth-pill">COP</span>
              <span className="auth-pill">MXN</span>
              <span className="auth-pill">ARS</span>
              <span className="auth-pill">BRL</span>
            </div>
            <div className="auth-showcase__mockup-rate">
              <span>Tipo de cambio de referencia en vivo</span>
              <strong>1 USD ≈ 1.510,10 ARS · 1 EUR ≈ 1,08 USD</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
