import { useState, useEffect, useCallback, useRef } from 'react'
import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { checkEmailApi, forgotPasswordApi } from '../../api/auth.api.ts'
import { BrandLogo } from '../../components/common/BrandLogo.tsx'
import '../login/LoginPage.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail]                       = useState('')
  const [error, setError]                       = useState('')
  const [loading, setLoading]                   = useState(false)
  const [checkingEmail, setCheckingEmail]       = useState(false)
  const [emailVerified, setEmailVerified]       = useState<boolean | null>(null)
  const [lastCheckedEmail, setLastCheckedEmail] = useState('')
  const [sent, setSent]                         = useState(false)

  const emailRef = useRef(email)
  useEffect(() => {
    emailRef.current = email
  }, [email])
  const checkingEmailRef = useRef(false)

  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (error) setError('')
    if (emailVerified !== null) {
      setEmailVerified(null)
    }
  }

  const verifyEmail = useCallback(async (targetEmail: string): Promise<boolean> => {
    const trimmed = targetEmail.trim().toLowerCase()
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      return false
    }

    if (checkingEmailRef.current) {
      return false
    }

    checkingEmailRef.current = true
    setCheckingEmail(true)
    try {
      const res = await checkEmailApi(trimmed)
      if (emailRef.current.trim().toLowerCase() === trimmed) {
        setEmailVerified(true)
        setError('')
        setLastCheckedEmail(trimmed)
        const greeting = res.first_name ? ` ¡Hola ${res.first_name}!` : ''
        toast.success(`Correo verificado.${greeting} Listo para enviar el enlace.`, {
          autoClose: 3000,
        })
      }
      return true
    } catch (err: unknown) {
      if (emailRef.current.trim().toLowerCase() === trimmed) {
        setEmailVerified(false)
        setLastCheckedEmail(trimmed)
        const msg = err instanceof Error ? err.message : 'Este correo no se encuentra registrado en Axora.'
        setError(msg)
        toast.error(msg, { autoClose: 4000 })
      }
      return false
    } finally {
      checkingEmailRef.current = false
      setCheckingEmail(false)
    }
  }, [])

  useEffect(() => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setEmailVerified(null)
      return
    }

    if (trimmed === lastCheckedEmail) return

    const timer = setTimeout(() => {
      void verifyEmail(trimmed)
    }, 600)

    return () => clearTimeout(timer)
  }, [email, lastCheckedEmail, verifyEmail])

  const handleBlur = () => {
    const trimmed = email.trim().toLowerCase()
    if (trimmed && EMAIL_REGEX.test(trimmed) && trimmed !== lastCheckedEmail && !checkingEmail) {
      void verifyEmail(trimmed)
    }
  }

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Ingresa tu correo electrónico.')
      return
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      const msg = 'El correo electrónico no tiene un formato válido.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (emailVerified === false && lastCheckedEmail === trimmed) {
      const msg = 'Este correo no se encuentra registrado en Axora.'
      setError(msg)
      toast.error(msg)
      return
    }

    let isOk = emailVerified === true && lastCheckedEmail === trimmed
    if (!isOk) {
      isOk = await verifyEmail(trimmed)
      if (!isOk) return
    }

    setLoading(true)
    try {
      await forgotPasswordApi(trimmed)
      setSent(true)
      toast.success('Enlace de recuperación enviado exitosamente.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.'
      setError(msg)
      toast.error(msg)
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
              <div className="email-input-wrapper">
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
                  onBlur={handleBlur}
                  disabled={loading}
                />
                {checkingEmail && (
                  <span className="email-status-icon is-loading" aria-label="Verificando correo">
                    <Loader2 size={18} />
                  </span>
                )}
                {!checkingEmail && emailVerified === true && (
                  <span className="email-status-icon is-valid" aria-label="Correo verificado">
                    <CheckCircle2 size={18} />
                  </span>
                )}
                {!checkingEmail && emailVerified === false && (
                  <span className="email-status-icon is-invalid" aria-label="Correo no registrado">
                    <XCircle size={18} />
                  </span>
                )}
              </div>
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