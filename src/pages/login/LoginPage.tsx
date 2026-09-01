import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.ts'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticated } = useAuth()

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Correo o contraseña incorrectos.')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setAuthenticated(true)

      const from = (location.state as { from?: { pathname?: string } | string } | null)?.from
      const destination = typeof from === 'string' ? from : from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)


  return (
    <div className="login-page">
      {/* DASHBOARD */}
      <Link className="login-back" to="/">
        <span aria-hidden="true">←</span>
        Volver
      </Link>

      {/* Brand mark */}
      <div className="login-brand" aria-label="Axora">
        <span className="login-brand-icon" aria-hidden="true">◈</span>
        <p className="login-brand-name">AXORA</p>
      </div>

      {/* Card */}
      <div className="login-card" role="main">
        <h1 className="login-title">Iniciar sesión</h1>

        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="form-field">
            <label className="form-label" htmlFor="login-email">
              Correo o usuario
            </label>
            <input
              id="login-email"
              className={`form-input${error ? ' has-error' : ''}`}
              type="email"
              autoComplete="email"
              placeholder="pitty@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="form-label" htmlFor="login-password">
              Contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                className={`form-input${error ? ' has-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="login-error" role="alert">
              <em className="login-error-icon" aria-hidden="true">✕</em>
              {error} Revisa el correo y la contraseña.
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
      </div>

      {/* Footer links */}
      <footer className="login-footer">
        <p>
          ¿No tienes cuenta?{' '}
          <Link to="/registro">crear cuenta</Link>
        </p>
        <p className="login-footer-note">
          Al registrarte se crea tu billetera automáticamente.
        </p>
      </footer>
    </div>
  )
}
