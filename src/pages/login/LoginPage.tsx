import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    try {
      // TODO: reemplazar con llamada real a la API
      await new Promise((res) => setTimeout(res, 1200))

      // Simula error para demostración — eliminar cuando conectes la API
      const fakeError = true
      if (fakeError) throw new Error('Correo o contraseña incorrectos.')

      setAuthenticated(true)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

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
            <input
              id="login-password"
              className={`form-input${error ? ' has-error' : ''}`}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
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
