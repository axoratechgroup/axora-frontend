import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, Plus, ArrowLeftRight, Send, Globe, ArrowDown } from 'lucide-react'
import { useAuth } from './hooks/useAuth.ts'
import { useTheme } from './hooks/useTheme.ts'
import { BrandLogo } from './components/common/BrandLogo.tsx'
import { getFallbackExchangeRate } from './utils/currency.ts'
import { getStoredUser, getHomeRoute } from './utils/user.ts'
import './App.css'
import { SUPPORT_EMAIL } from './constants/config.ts'


const menuLinks = [
  { label: 'Inicio',               href: '#inicio',        to: null },
  { label: 'Servicios',            href: '#servicios',     to: null },
  { label: 'Simulador',            href: '#simulador',     to: null },
  { label: 'Preguntas frecuentes', href: '#faq',           to: null },
  { label: 'Contacto',             href: '#contacto',      to: null },
]

const services = [
  { number: '01', title: 'Compra de moneda', description: 'Compra la moneda que necesitas usando el saldo disponible en tu billetera.' },
  { number: '02', title: 'Venta de moneda', description: 'Vende una moneda de tu balance y consulta la tasa aplicada antes de confirmar.' },
  { number: '03', title: 'Transferencias', description: 'Envía saldo simulado a otra persona de forma clara, rápida y trazable.' },
]

const coverageDestinations = [
  {
    name: 'Europa (Zona Euro)',
    badge: 'EUR',
    flag: '🇪🇺',
    detail: 'España, Francia, Alemania y +20 países bajo el estándar Euro',
    featured: true,
  },
  {
    name: 'Estados Unidos',
    badge: 'USD',
    flag: '🇺🇸',
    detail: 'Dólares estadounidenses y transferencias globales',
    featured: false,
  },
  {
    name: 'Colombia',
    badge: 'COP',
    flag: '🇨🇴',
    detail: 'Moneda local y transferencias en Pesos colombianos',
    featured: false,
  },
  {
    name: 'México',
    badge: 'MXN',
    flag: '🇲🇽',
    detail: 'Operaciones en Pesos mexicanos sin fricciones',
    featured: false,
  },
  {
    name: 'Argentina',
    badge: 'ARS',
    flag: '🇦🇷',
    detail: 'Conversión directa y saldos en Pesos argentinos',
    featured: false,
  },
  {
    name: 'Brasil',
    badge: 'BRL',
    flag: '🇧🇷',
    detail: 'Gestión integrada en Reales brasileños',
    featured: false,
  },
]

function CurrencySimulator() {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')

  const rate = getFallbackExchangeRate(from, to)
  const hasRate = rate > 0
  const converted = hasRate ? (Number(amount) || 0) * rate : 0

  return (
    <div className="simulator-widget" aria-label="Simulador de cambio">
      <div className="simulator-field">
        <label htmlFor="sim-amount">Tú envías</label>
        <div className="simulator-input-group">
          <input
            id="sim-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            aria-label="Monto a enviar"
          />
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Moneda origen"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="ARS">ARS</option>
            <option value="COP">COP</option>
            <option value="MXN">MXN</option>
            <option value="BRL">BRL</option>
          </select>
        </div>
      </div>

      <div className="simulator-rate-info">
        {hasRate ? (
          <span>Tasa de cambio de referencia: 1 {from} ≈ {rate.toLocaleString('es-ES', { maximumFractionDigits: 4 })} {to}</span>
        ) : (
          <span className="simulator-rate-unavailable">Cotización no disponible para este par</span>
        )}
      </div>

      <div className="simulator-field">
        <label htmlFor="sim-result">El destinatario recibe aproximadamente</label>
        <div className="simulator-input-group">
          <input
            id="sim-result"
            type="text"
            readOnly
            value={hasRate ? converted.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'No disponible'}
            aria-label="Monto aproximado que recibe"
          />
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Moneda destino"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
            <option value="COP">COP</option>
            <option value="MXN">MXN</option>
            <option value="BRL">BRL</option>
          </select>
        </div>
      </div>
    </div>
  )
}


function App() {
  const navigate = useNavigate()
  const { status, isAuthenticated } = useAuth()

  useEffect(() => {
    if (status !== 'checking' && isAuthenticated) {
      const user = getStoredUser()
      navigate(getHomeRoute(user?.role), { replace: true })
    }
  }, [status, isAuthenticated, navigate])

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  // Global theme
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="site-shell">
      <header className="site-header">
        <BrandLogo size="md" to="#inicio" onClick={closeMenu} />
        <nav className="desktop-nav" aria-label="Navegación principal">
          <ul>
            {menuLinks.map((link) =>
              <li key={link.to ?? link.href}>
                {link.to
                  ? <Link to={link.to}>{link.label}</Link>
                  : <a href={link.href!}>{link.label}</a>
                }
              </li>
            )}
          </ul>
        </nav>
        <div className="header-actions">
          <button 
            type="button" 
            className="header-theme-btn" 
            onClick={toggleTheme} 
            aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <Link className="login-link" to="/login">Iniciar sesión</Link>
          <Link className="register-link" to="/registro">Regístrate</Link>
          <button className="menu-button" type="button" aria-expanded={isMenuOpen} aria-controls="main-menu" onClick={() => setIsMenuOpen((isOpen) => !isOpen)}>
            <span className="sr-only">{isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
            <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
          </button>
        </div>
      </header>

      <div className={`menu-overlay ${isMenuOpen ? 'is-visible' : ''}`} onClick={closeMenu} />
      <aside id="main-menu" className={`side-menu ${isMenuOpen ? 'is-open' : ''}`} aria-label="Menú principal">
        <div className="side-menu__top">
          <BrandLogo size="md" to="#inicio" onClick={closeMenu} />
          <button className="close-menu" type="button" onClick={closeMenu} aria-label="Cerrar menú">×</button>
        </div>
        <nav>
          <ul>
            {menuLinks.map((link) =>
              <li key={link.to ?? link.href}>
                {link.to
                  ? <Link to={link.to} onClick={closeMenu}>{link.label}</Link>
                  : <a href={link.href!} onClick={closeMenu}>{link.label}</a>
                }
              </li>
            )}
          </ul>
        </nav>

        <div className="side-menu-auth">
          <Link className="side-menu-btn side-menu-btn-primary" to="/registro" onClick={closeMenu}>
            Regístrate gratis
          </Link>
          <Link className="side-menu-btn side-menu-btn-secondary" to="/login" onClick={closeMenu}>
            Iniciar sesión
          </Link>
        </div>
        
        <div className="theme-toggle">
          <div className="theme-toggle-label">
            <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8 }}>
              {theme === 'dark' ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}
            </span>
            Modo {theme === 'dark' ? 'oscuro' : 'claro'}
          </div>
          <button 
            type="button" 
            className={`theme-switch ${theme === 'light' ? 'is-light' : ''}`}
            onClick={toggleTheme}
            aria-label="Alternar tema"
          >
            <span className="theme-switch-icon" aria-hidden="true">
              {theme === 'light' ? <Sun size={13} /> : <Moon size={13} />}
            </span>
          </button>
        </div>
      </aside>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">TU CUENTA GLOBAL PARA</p>
            <h1>MOVER DINERO ENTRE MONEDAS</h1>
            <p className="hero-description">Gestiona seis monedas desde una sola cuenta.</p>
            <Link className="primary-button" to="/registro">Crear cuenta</Link>
          </div>
          <div className="hero-app-mockup" aria-label="Vista previa de la aplicación AXORA">
            <div className="mockup-header">
              <span className="mockup-dot red"></span>
              <span className="mockup-dot yellow"></span>
              <span className="mockup-dot green"></span>
              <span className="mockup-title">axora.app/dashboard</span>
            </div>
            <div className="mockup-content">
              <div className="mockup-balance-card">
                <span className="mockup-label">Cuenta Axora</span>
                <p className="mockup-amount">≈ $ 1.504,00 <span className="mockup-currency">USD</span></p>
                <div className="mockup-pills">
                  <span className="mockup-pill active">
                    <Globe size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Total USD
                  </span>
                  <span className="mockup-pill">USD</span>
                  <span className="mockup-pill">EUR</span>
                  <span className="mockup-pill">ARS</span>
                </div>
              </div>
              <div className="mockup-actions">
                <div className="mockup-action-btn">
                  <Plus size={14} aria-hidden="true" />
                  <span>Cargar</span>
                </div>
                <div className="mockup-action-btn">
                  <ArrowLeftRight size={14} aria-hidden="true" />
                  <span>Cambiar</span>
                </div>
                <div className="mockup-action-btn">
                  <Send size={14} aria-hidden="true" />
                  <span>Transferir</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="servicios" className="services-section" aria-labelledby="services-title">
          <p className="section-label">LO QUE PUEDES HACER</p><h2 id="services-title">Tu dinero, sin fronteras</h2>
          <div className="services-grid">{services.map((service) => <article className="service-card" key={service.number}><span className="service-icon" aria-hidden="true">{service.number}</span><h3>{service.title}</h3><p>{service.description}</p></article>)}</div>
        </section>

        <section id="simulador" className="simulator-section" aria-labelledby="simulator-title">
          <div className="simulator-copy">
            <p className="section-label">SIMULA ANTES DE ENVIAR</p>
            <h2 id="simulator-title">Transferencias internacionales al mejor precio</h2>
            <p>Consulta cuánto envías, cuánto recibe tu contacto y la tasa usada antes de confirmar.</p>
            <Link className="text-link" to="/registro">
              Crear cuenta para transferir <ArrowDown size={15} aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            </Link>
          </div>
          <CurrencySimulator />
        </section>


        <section className="countries-section" aria-labelledby="countries-title">
          <p className="section-label">ALCANCE GLOBAL</p>
          <h2 id="countries-title">Envía dinero a más de 5 países y a toda Europa</h2>
          <p className="countries-subtitle">
            El Euro (EUR) es el estándar monetario que te conecta con España y más de 20 países europeos desde una sola cuenta, junto a las principales economías de América.
          </p>
          <div className="coverage-grid" aria-label="Destinos y monedas disponibles">
            {coverageDestinations.map((dest) => (
              <article key={dest.name} className={`coverage-card ${dest.featured ? 'coverage-card--featured' : ''}`}>
                <div className="coverage-flag" aria-hidden="true">{dest.flag}</div>
                <div className="coverage-info">
                  <div className="coverage-header">
                    <h3 className="coverage-name">{dest.name}</h3>
                    <span className="coverage-badge">{dest.badge}</span>
                  </div>
                  <p className="coverage-detail">{dest.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="faq-section" aria-labelledby="faq-title">
          <p className="section-label">RESOLVEMOS TUS DUDAS</p>
          <h2 id="faq-title">Preguntas frecuentes</h2>
          <div className="faq-list">
            <details className="faq-item">
              <summary>¿Qué monedas puedo gestionar en AXORA?</summary>
              <p>Puedes operar con Dólares estadounidenses (USD), Euros (EUR), Pesos argentinos (ARS), Pesos colombianos (COP), Pesos mexicanos (MXN) y Reales brasileños (BRL).</p>
            </details>
            <details className="faq-item">
              <summary>¿Cómo se calcula el total de mi patrimonio?</summary>
              <p>Consolidamos todos tus saldos en tiempo real convirtiéndolos a USD según la tasa de cambio oficial de mercado.</p>
            </details>
            <details className="faq-item">
              <summary>¿Cuál es la comisión por cambiar entre monedas?</summary>
              <p>Aplicamos una comisión transparente del 0.3% sobre el monto convertido, sin cargos ocultos.</p>
            </details>
            <details className="faq-item">
              <summary>¿Tienen costo las transferencias entre usuarios?</summary>
              <p>No, las transferencias entre cuentas de la comunidad AXORA son 100% gratuitas e instantáneas.</p>
            </details>
          </div>
        </section>

        <section id="contacto" className="contact-section" aria-labelledby="contact-title">
          <p className="section-label">ATENCIÓN PERSONALIZADA</p>
          <h2 id="contact-title">¿Necesitas ayuda o tienes consultas?</h2>
          <p className="contact-desc">Nuestro equipo de soporte está disponible para asistirte en todo momento.</p>
          <div className="contact-actions">
            <a className="primary-button" href={`mailto:${SUPPORT_EMAIL}`}>Contactar a soporte</a>
            <Link className="secondary-button" to="/soporte">Centro de ayuda</Link>
          </div>
        </section>

        <section id="registro" className="register-section"><p>¿Listo para gestionar tus monedas?</p><Link className="primary-button" to="/registro">Crear mi cuenta</Link></section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-content">
          <BrandLogo size="sm" to="#inicio" />
          <div className="footer-links">
            <a href="#contacto">Contacto</a>
            <a href="#faq">FAQ</a>
            <Link to="/soporte">Soporte</Link>
          </div>
        </div>
        <p>2026 · AXORA. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

export default App
