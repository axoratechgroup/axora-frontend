import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Sun, Moon } from 'lucide-react'
import { loginApi } from '../../api/auth.api.ts'
import { PasswordInput } from '../../components/common/PasswordInput.tsx'
import { AuthShowcase } from '../../components/common/AuthShowcase.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { useTheme } from '../../hooks/useTheme.ts'
import { getHomeRoute } from '../../utils/user.ts'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Real-time touch & inline validation
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [touchedPassword, setTouchedPassword] = useState(false)

  const emailError = touchedEmail && !email.trim() ? 'Ingresa tu correo o usuario.' : ''
  const passwordError = touchedPassword && !password.trim() ? 'Ingresa tu contraseña.' : ''

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setTouchedEmail(true)
      setTouchedPassword(true)
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    try {
      const data = await loginApi({ email, password })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setAuthenticated(true)
      toast.success('¡Bienvenido de nuevo!')

      const defaultDestination = getHomeRoute(data.user?.role)
      const from = (location.state as { from?: { pathname?: string } | string } | null)?.from
      let destination = typeof from === 'string' ? from : from?.pathname || defaultDestination
      if (data.user?.role === 'admin' && destination === '/dashboard') {
        destination = '/admin'
      }
      navigate(destination, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page auth-split-page">
      {/* Top bar */}
      <header className="auth-top-nav">
        <Link className="login-back" to="/">
          <span aria-hidden="true">←</span>
          Volver al inicio
        </Link>
        <button
          type="button"
          className="auth-theme-btn"
          onClick={toggleTheme}
          aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
      </header>

      {/* Main Split Container */}
      <div className="auth-split-container">
        {/* Left Column: Brand & Value Showcase */}
        <section className="auth-split-left">
          <AuthShowcase
            title="Mueve tu dinero por el mundo sin fronteras"
            subtitle="Gestiona, convierte y transfiere entre 6 monedas desde una sola cuenta con total transparencia, seguridad bancaria y cotización en tiempo real."
          />
        </section>

        {/* Right Column: Form Card */}
        <section className="auth-split-right">
          <div className="login-card" role="main">
            <div className="login-card-header">
              <span className="login-card-eyebrow">BIENVENIDO A AXORA</span>
              <h1 className="login-title">Iniciar sesión</h1>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {/* Email / Username */}
              <div className="form-field">
                <label className="form-label" htmlFor="login-email">
                  Correo o usuario
                </label>
                <input
                  id="login-email"
                  className={`form-input${error || emailError ? ' has-error' : ''}`}
                  type="text"
                  autoComplete="username email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  onBlur={() => setTouchedEmail(true)}
                  disabled={loading}
                />
                {emailError && (
                  <span className="form-field-error">
                    {emailError}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="form-field">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="login-password">
                    Contraseña
                  </label>
                  <Link to="/forgot-password" className="form-forgot-link">
                    ¿La olvidaste?
                  </Link>
                </div>
                <PasswordInput
                  id="login-password"
                  hasError={Boolean(error || passwordError)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  onBlur={() => setTouchedPassword(true)}
                  disabled={loading}
                />
                {passwordError && (
                  <span className="form-field-error">
                    {passwordError}
                  </span>
                )}
              </div>

              {/* Error banner */}
              {error && (
                <div className="login-error" role="alert">
                  <em className="login-error-icon" aria-hidden="true">✕</em>
                  <span>{error} Revisa el correo y la contraseña.</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit"
                className={`login-submit${loading ? ' is-loading' : ''}`}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            {/* Card Footer */}
            <footer className="login-footer">
              <p>
                ¿No tienes cuenta?{' '}
                <Link to="/registro" className="login-register-link">
                  Crear cuenta gratis
                </Link>
              </p>
              <p className="login-footer-note">
                Al registrarte, se crea tu billetera global automáticamente.
              </p>
            </footer>
          </div>
        </section>
      </div>
    </div>
  )
}
