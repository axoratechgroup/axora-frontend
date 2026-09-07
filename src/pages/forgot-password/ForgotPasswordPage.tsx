import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPasswordApi } from '../../api/auth.api.ts'
import { BrandLogo } from '../../components/common/BrandLogo.tsx'
import '../login/LoginPage.css'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Ingresá tu email.')
      return
    }

    setLoading(true)
    try {
      await forgotPasswordApi(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-nav-top">
        <Link className="login-back" to="/login">
          <span aria-hidden="true">←</span>
          Volver
        </Link>
      </div>

      <div className="login-brand-wrapper">
        <BrandLogo size="lg" to="/" />
      </div>

      <div className="login-card" role="main">
        <h1 className="login-title">Recuperar contraseña</h1>

        {sent ? (
          <p className="login-footer-note" style={{ fontSize: '.9rem', opacity: 1 }}>
            Si el email existe en nuestro sistema, vas a recibir un link para restablecer tu contraseña. Revisá tu bandeja de entrada (y spam).
          </p>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label className="form-label" htmlFor="forgot-email">
                Correo
              </label>
              <input
                id="forgot-email"
                className={`form-input${error ? ' has-error' : ''}`}
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="pitty@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="login-error" role="alert">
                <em className="login-error-icon" aria-hidden="true">✕</em>
                {error}
              </div>
            )}

            <button
              className={`login-submit${loading ? ' is-loading' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        )}
      </div>

      <footer className="login-footer">
        <p>
          ¿Te acordaste? <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </footer>
    </div>
  )
}