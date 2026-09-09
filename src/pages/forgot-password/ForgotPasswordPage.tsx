import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Search } from 'lucide-react'
import { checkEmailApi, forgotPasswordApi } from '../../api/auth.api.ts'
import { BrandLogo } from '../../components/common/BrandLogo.tsx'
import '../login/LoginPage.css'

export default function ForgotPasswordPage() {
  const [email, setEmail]                 = useState('')
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [verifiedName, setVerifiedName]   = useState('')
  const [sent, setSent]                   = useState(false)

  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (error) setError('')
    if (emailVerified !== null) {
      setEmailVerified(null)
      setVerifiedName('')
    }
  }

  const handleVerifyEmail = async () => {
    setError('')
    setEmailVerified(null)

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.')
      return
    }

    setCheckingEmail(true)
    try {
      const res = await checkEmailApi(email)
      setEmailVerified(true)
      setVerifiedName(res.first_name || '')
    } catch (err: unknown) {
      setEmailVerified(false)
      setError(err instanceof Error ? err.message : 'El correo no se encuentra registrado.')
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.')
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
            Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o correo no deseado (spam).
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
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={loading || checkingEmail}
              />
            </div>

            {emailVerified === true && (
              <div className="forgot-verified-badge" role="status">
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>Correo registrado en Axora{verifiedName ? ` (${verifiedName})` : ''}. Listo para enviar enlace.</span>
              </div>
            )}

            {error && (
              <div className="login-error" role="alert">
                <em className="login-error-icon" aria-hidden="true">✕</em>
                {error}
              </div>
            )}

            <button
              type="button"
              className="forgot-verify-btn"
              onClick={handleVerifyEmail}
              disabled={checkingEmail || loading || !email.trim()}
            >
              <Search size={15} aria-hidden="true" />
              {checkingEmail ? 'Consultando en base de datos…' : 'Verificar si está en BD'}
            </button>

            <button
              className={`login-submit${loading ? ' is-loading' : ''}`}
              type="submit"
              disabled={loading || checkingEmail}
            >
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        )}
      </div>

      <footer className="login-footer">
        <p>
          ¿Recordaste tu contraseña? <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </footer>
    </div>
  )
}