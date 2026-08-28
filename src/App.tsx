import { useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'

const menuLinks = [
  { label: 'Inicio',              href: '#inicio',        to: null },
  { label: 'Servicios',           href: '#servicios',     to: null },
  { label: 'Simulador',           href: '#simulador',     to: null },
  { label: 'Iniciar sesión',      href: null,             to: '/login' },
  { label: 'Preguntas frecuentes', href: '#faq',          to: null },
]

const services = [
  { number: '01', title: 'Compra de moneda', description: 'Compra la moneda que necesitas usando el saldo disponible en tu billetera.' },
  { number: '02', title: 'Venta de moneda', description: 'Vende una moneda de tu balance y consulta la tasa aplicada antes de confirmar.' },
  { number: '03', title: 'Transferencias', description: 'Envía saldo simulado a otra persona de forma clara, rápida y trazable.' },
]

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" onClick={closeMenu} aria-label="AXORA, ir al inicio">AXORA</a>
        <div className="header-actions">
          <a className="register-link" href="#registro">Regístrate</a>
          <Link className="register-link" to="/login" style={{ marginLeft: 0 }}>Iniciar sesión</Link>
          <button className="menu-button" type="button" aria-expanded={isMenuOpen} aria-controls="main-menu" onClick={() => setIsMenuOpen((isOpen) => !isOpen)}>
            <span className="sr-only">{isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
            <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
          </button>
        </div>
      </header>

      <div className={`menu-overlay ${isMenuOpen ? 'is-visible' : ''}`} onClick={closeMenu} />
      <aside id="main-menu" className={`side-menu ${isMenuOpen ? 'is-open' : ''}`} aria-label="Menú principal">
        <div className="side-menu__top"><span className="brand">AXORA</span><button className="close-menu" type="button" onClick={closeMenu} aria-label="Cerrar menú">×</button></div>
        <nav><ul>{menuLinks.map((link) =>
          <li key={link.to ?? link.href}>
            {link.to
              ? <Link to={link.to} onClick={closeMenu}>{link.label}</Link>
              : <a href={link.href!} onClick={closeMenu}>{link.label}</a>
            }
          </li>
        )}</ul></nav>
      </aside>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">TU CUENTA GLOBAL PARA</p>
            <h1>MOVER DINERO ENTRE MONEDAS</h1>
            <p className="hero-description">Más de 5 personas confían en nosotros.</p>
            <a className="primary-button" href="#registro">Crear cuenta</a>
          </div>
          <div className="visual-placeholder hero-placeholder" aria-label="Espacio reservado para una imagen de la aplicación"><span>Imagen de la app</span></div>
        </section>

        <section id="servicios" className="services-section" aria-labelledby="services-title">
          <p className="section-label">LO QUE PUEDES HACER</p><h2 id="services-title">Tu dinero, sin fronteras</h2>
          <div className="services-grid">{services.map((service) => <article className="service-card" key={service.number}><span className="service-icon" aria-hidden="true">{service.number}</span><h3>{service.title}</h3><p>{service.description}</p></article>)}</div>
        </section>

        <section id="simulador" className="simulator-section" aria-labelledby="simulator-title">
          <div className="simulator-copy"><p className="section-label">SIMULA ANTES DE ENVIAR</p><h2 id="simulator-title">Transferencias internacionales al mejor precio</h2><p>Consulta cuánto envías, cuánto recibe tu contacto y la tasa usada antes de confirmar.</p><a className="text-link" href="#registro">Crear cuenta para transferir <span aria-hidden="true">↓</span></a></div>
          <div className="visual-placeholder simulator-placeholder" aria-label="Espacio reservado para el simulador interactivo"><span>Simulador interactivo</span></div>
        </section>

        <section className="countries-section" aria-labelledby="countries-title">
          <p className="section-label">ALCANCE GLOBAL</p><h2 id="countries-title">Envía dinero a más de 5 países</h2>
          <div className="country-list" aria-label="Países disponibles próximamente">{['México', 'Argentina', 'Colombia', 'Europa', 'Inglaterra'].map((country) => <span key={country}><i aria-hidden="true"></i>{country}</span>)}</div>
        </section>

        <section id="registro" className="register-section"><p>¿Listo para gestionar tus monedas?</p><a className="primary-button" href="#iniciar-sesion">Crear mi cuenta</a></section>
      </main>

      <footer id="faq" className="site-footer"><div><a href="#contacto">Contacto</a><a href="#faq">FAQ</a></div><p>2026 · AXORA. Todos los derechos reservados.</p></footer>
    </div>
  )
}

export default App
