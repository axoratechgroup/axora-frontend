import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Shield, Moon, Sun, CheckCircle } from 'lucide-react'
import './ConfiguracionPage.css'

interface StoredUser {
  first_name?: string
  last_name?: string
  username?: string
  email?: string
  role?: string
}

export default function ConfiguracionPage() {
  const navigate = useNavigate()

  const user: StoredUser = (() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })()

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="config-page">
      <div className="config-container">
        <header className="config-header">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/dashboard')}
            aria-label="Volver al panel principal"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Volver al panel</span>
          </button>
          <h1 className="config-title">Configuración de la cuenta</h1>
        </header>

        <section className="config-card">
          <div className="profile-header">
            <div className="profile-avatar" aria-hidden="true">
              <User size={32} />
            </div>
            <div className="profile-info">
              <h2 className="profile-name">
                {user.first_name || 'Usuario'} {user.last_name || ''}
              </h2>
              {user.username && <span className="profile-username">@{user.username}</span>}
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="detail-item">
              <span className="detail-label">Correo electrónico</span>
              <span className="detail-value">{user.email || 'No especificado'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Nombre de usuario</span>
              <span className="detail-value">@{user.username || 'usuario'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tipo de cuenta</span>
              <span className="detail-value detail-badge">
                <Shield size={14} aria-hidden="true" />
                {user.role === 'admin' ? 'Administrador' : 'Usuario estándar'}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Estado de la cuenta</span>
              <span className="detail-value detail-status">
                <CheckCircle size={14} aria-hidden="true" />
                Activa y verificada
              </span>
            </div>
          </div>
        </section>

        <section className="config-card">
          <h2 className="section-title">Preferencias y apariencia</h2>
          <div className="preference-row">
            <div className="preference-info">
              <span className="preference-label">Tema de la interfaz</span>
              <span className="preference-desc">
                Alterna entre modo oscuro y claro según tu comodidad visual.
              </span>
            </div>
            <button
              type="button"
              className="btn-toggle-theme"
              onClick={toggleTheme}
              aria-label="Alternar tema visual"
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span>Modo {theme === 'dark' ? 'oscuro' : 'claro'}</span>
            </button>
          </div>

          <div className="preference-row">
            <div className="preference-info">
              <span className="preference-label">Moneda base del total consolidado</span>
              <span className="preference-desc">
                Moneda estándar utilizada para consolidar el patrimonio total.
              </span>
            </div>
            <span className="base-currency-pill">USD ($)</span>
          </div>
        </section>

        {user.role === 'admin' && (
          <section className="config-card">
            <h2 className="section-title">Herramientas de Administración</h2>
            <div className="preference-row">
              <div className="preference-info">
                <span className="preference-label">Panel de Administración Global</span>
                <span className="preference-desc">
                  Supervisión de usuarios registrados, auditoría de transacciones y conciliación del sistema.
                </span>
              </div>
              <button
                type="button"
                className="btn-toggle-theme"
                onClick={() => navigate('/admin')}
                style={{ backgroundColor: '#ff7a30', color: '#ffffff', borderColor: '#ff7a30' }}
              >
                <Shield size={16} />
                <span>Abrir panel admin</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
