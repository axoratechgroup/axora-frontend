import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordApi } from '../../api/auth.api.ts'
import { PasswordInput } from '../../components/common/PasswordInput.tsx'
import { BrandLogo } from '../../components/common/BrandLogo.tsx'
import '../login/LoginPage.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('El link de recuperación no es válido.')
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await resetPasswordApi(token, newPassword)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand-wrapper">
        <BrandLogo size="lg" to="/" />
      </div>

      <div className="login-card" role="main">
        <h1 className="login-title">Nueva contraseña</h1>

        {!token && (
          <div className="login-error" role="alert">
            <em className="login-error-icon" aria-hidden="true">✕</em>
            Este link no es válido. Pedí uno nuevo desde "Olvidé mi contraseña".
          </div>
        )}

        {done ? (
          <p className="login-footer-note" style={{ fontSize: '.9rem', opacity: 1 }}>
            Contraseña actualizada. Te llevamos al login…
          </p>
        ) : (
          token && (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-field">
                <label className="form-label" htmlFor="reset-password">
                  Nueva contraseña
                </label>
                <PasswordInput
                  id="reset-password"
                  hasError={Boolean(error)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="reset-confirm-password">
                  Repetir contraseña
                </label>
                <PasswordInput
                  id="reset-confirm-password"
                  hasError={Boolean(error)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )
        )}
      </div>

      <footer className="login-footer">
        <p>
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </footer>
    </div>
  )
}