import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, MessageCircle, HelpCircle, Compass, ShieldCheck } from 'lucide-react'
import { BrandLogo } from '../../components/common/BrandLogo.tsx'
import './SoportePage.css'
import { SUPPORT_EMAIL } from '../../constants/config.ts'

export default function SoportePage() {
  const navigate = useNavigate()

  return (
    <div className="soporte-page">
      <div className="soporte-container">
        <header className="soporte-header">
          <button
            type="button"
            className="soporte-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Volver atrás"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Volver</span>
          </button>
          <BrandLogo size="md" to="/" />
        </header>

        <section className="soporte-hero">
          <div className="soporte-hero-icon" aria-hidden="true">
            <Compass size={36} />
          </div>
          <h1 className="soporte-title">Centro de Ayuda AXORA</h1>
          <p className="soporte-subtitle">
            Estamos aquí para acompañar cada uno de tus viajes y transacciones.
          </p>
        </section>

        <div className="soporte-grid">
          <article className="soporte-card">
            <div className="soporte-card-icon">
              <Mail size={22} />
            </div>
            <h2>Correo de Soporte</h2>
            <p>Atención personalizada para consultas sobre tu cuenta, transferencias o balances.</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="soporte-card-btn">
              {SUPPORT_EMAIL}
            </a>
          </article>

          <article className="soporte-card">
            <div className="soporte-card-icon">
              <MessageCircle size={22} />
            </div>
            <h2>Asistente Virtual IA</h2>
            <p>Disponible 24/7 en tu panel de control para cotizar divisas o resolver dudas al instante.</p>
            <button
              type="button"
              className="soporte-card-btn"
              onClick={() => navigate('/dashboard')}
            >
              Ir al Dashboard
            </button>
          </article>

          <article className="soporte-card">
            <div className="soporte-card-icon">
              <ShieldCheck size={22} />
            </div>
            <h2>Seguridad & Garantía</h2>
            <p>Tus operaciones cuentan con trazabilidad en tiempo real y conciliación inmediata.</p>
            <span className="soporte-badge">Protección Activa</span>
          </article>
        </div>

        <section className="soporte-faq">
          <div className="soporte-faq-title">
            <HelpCircle size={20} />
            <h2>Preguntas Frecuentes</h2>
          </div>

          <details className="soporte-faq-item">
            <summary>¿Cuánto tardan las transferencias entre cuentas Axora?</summary>
            <p>Son instantáneas y 100% gratuitas entre usuarios de la comunidad Axora.</p>
          </details>

          <details className="soporte-faq-item">
            <summary>¿Cómo se aplican las tasas de cambio?</summary>
            <p>Utilizamos tasas interbancarias actualizadas con una comisión transparente del 0.3% sin cargos ocultos.</p>
          </details>

          <details className="soporte-faq-item">
            <summary>¿Qué hago si envié fondos a un usuario incorrecto?</summary>
            <p>Escríbenos inmediatamente a {SUPPORT_EMAIL} con el ID de la transacción disponible en tu Historial.</p>
          </details>
        </section>
      </div>
    </div>
  )
}
