import { useState, useEffect, useRef } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { registerApi, checkAvailabilityApi } from '../../api/auth.api.ts'
import { PasswordInput } from '../../components/common/PasswordInput.tsx'
import { PasswordRequirements } from '../../components/common/PasswordRequirements.tsx'
import { AuthShowcase } from '../../components/common/AuthShowcase.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { useTheme } from '../../hooks/useTheme.ts'
import { validatePassword } from '../../utils/password.ts'
import './RegistroPage.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function RegistroPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [firstName, setFirstName]             = useState('')
  const [lastName, setLastName]               = useState('')
  const [username, setUsername]               = useState('')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)

  // Real-time availability check states
  const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>('idle')
  const [usernameMsg, setUsernameMsg]       = useState('')
  const [emailStatus, setEmailStatus]       = useState<AvailabilityStatus>('idle')
  const [emailMsg, setEmailMsg]             = useState('')

  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const passwordValidation = validatePassword(password)
  const passwordIsInvalid = password.length > 0 && !passwordValidation.isValid
  const passwordsDoNotMatch = confirmPassword.length > 0 && password !== confirmPassword

  // Debounced check for username
  useEffect(() => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current)

    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      setUsernameStatus('idle')
      setUsernameMsg('')
      return
    }

    if (trimmed.length < 3) {
      setUsernameStatus('invalid')
      setUsernameMsg('Mínimo 3 caracteres.')
      return
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      setUsernameStatus('invalid')
      setUsernameMsg('Solo letras, números, puntos y guiones.')
      return
    }

    setUsernameStatus('checking')
    setUsernameMsg('Verificando disponibilidad…')

    usernameTimerRef.current = setTimeout(async () => {
      try {
        const result = await checkAvailabilityApi({ username: trimmed })
        if (result.username) {
          if (result.username.available) {
            setUsernameStatus('available')
            setUsernameMsg('Usuario disponible')
          } else {
            setUsernameStatus('taken')
            setUsernameMsg('Este nombre de usuario ya está registrado.')
          }
        }
      } catch {
        setUsernameStatus('idle')
        setUsernameMsg('')
      }
    }, 350)

    return () => {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current)
    }
  }, [username])

  // Debounced check for email
  useEffect(() => {
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current)

    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setEmailStatus('idle')
      setEmailMsg('')
      return
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailStatus('invalid')
      setEmailMsg('Ingresa un formato de correo válido.')
      return
    }

    setEmailStatus('checking')
    setEmailMsg('Verificando correo…')

    emailTimerRef.current = setTimeout(async () => {
      try {
        const result = await checkAvailabilityApi({ email: trimmed })
        if (result.email) {
          if (result.email.available) {
            setEmailStatus('available')
            setEmailMsg('Correo disponible')
          } else {
            setEmailStatus('taken')
            setEmailMsg('Este correo ya está registrado en el sistema.')
          }
        }
      } catch {
        setEmailStatus('idle')
        setEmailMsg('')
      }
    }, 350)

    return () => {
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current)
    }
  }, [email])

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError('Por favor completa todos los campos.')
      return
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!passwordValidation.isValid) {
      if (!passwordValidation.hasMinLength) {
        setError('La contraseña debe tener al menos 8 caracteres.')
      } else {
        setError('La contraseña no cumple con todos los requisitos de seguridad.')
      }
      return
    }
    if (usernameStatus === 'taken') {
      setError('El nombre de usuario ya está en uso. Por favor elige otro.')
      return
    }
    if (emailStatus === 'taken') {
      setError('El correo electrónico ya está registrado. Inicia sesión en su lugar.')
      return
    }

    setLoading(true)
    try {
      const data = await registerApi({
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        password,
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setAuthenticated(true)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="registro-page auth-split-page">
      {/* Top Bar */}
      <header className="auth-top-nav">
        <button type="button" className="registro-back login-back" onClick={() => navigate(-1)}>
          <span aria-hidden="true">←</span>
          Volver
        </button>
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
        {/* Left Column: Brand Showcase */}
        <section className="auth-split-left">
          <AuthShowcase
            title="Únete a la nueva era de transferencias globales"
            subtitle="Crea tu cuenta en menos de dos minutos y empieza a operar con 6 monedas internacionales de forma inmediata, sin costos ocultos."
          />
        </section>

        {/* Right Column: Form Card */}
        <section className="auth-split-right">
          <div className="registro-card" role="main">
            <div className="registro-card-header">
              <span className="registro-card-eyebrow">REGISTRO GRATUITO</span>
              <h1 className="registro-title">Crear cuenta</h1>
            </div>

            <form className="registro-form" onSubmit={handleSubmit} noValidate>
              {/* Nombres y Apellidos */}
              <div className="form-row-2">
                <div className="form-field">
                  <label className="form-label" htmlFor="registro-firstname">
                    Nombre
                  </label>
                  <input
                    id="registro-firstname"
                    className={`form-input${error && !firstName.trim() ? ' has-error' : ''}`}
                    type="text"
                    autoComplete="given-name"
                    placeholder="Tu nombre"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value)
                      if (error) setError('')
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="registro-lastname">
                    Apellido
                  </label>
                  <input
                    id="registro-lastname"
                    className={`form-input${error && !lastName.trim() ? ' has-error' : ''}`}
                    type="text"
                    autoComplete="family-name"
                    placeholder="Tu apellido"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value)
                      if (error) setError('')
                    }}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Usuario */}
              <div className="form-field">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="registro-username">
                    Usuario
                  </label>
                  {usernameStatus === 'checking' && (
                    <span className="field-status checking">
                      <Loader2 size={12} className="spin" aria-hidden="true" /> Verificando…
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="field-status available">
                      <CheckCircle2 size={12} aria-hidden="true" /> {usernameMsg}
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="field-status taken">
                      <AlertCircle size={12} aria-hidden="true" /> {usernameMsg}
                    </span>
                  )}
                  {usernameStatus === 'invalid' && (
                    <span className="field-status invalid">
                      {usernameMsg}
                    </span>
                  )}
                </div>
                <input
                  id="registro-username"
                  className={`form-input${
                    error && !username.trim()
                      ? ' has-error'
                      : usernameStatus === 'taken'
                      ? ' has-error'
                      : usernameStatus === 'available'
                      ? ' is-success'
                      : ''
                  }`}
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="nombredeusuario"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (error) setError('')
                  }}
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="form-field">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="registro-email">
                    Correo
                  </label>
                  {emailStatus === 'checking' && (
                    <span className="field-status checking">
                      <Loader2 size={12} className="spin" aria-hidden="true" /> Verificando…
                    </span>
                  )}
                  {emailStatus === 'available' && (
                    <span className="field-status available">
                      <CheckCircle2 size={12} aria-hidden="true" /> {emailMsg}
                    </span>
                  )}
                  {emailStatus === 'taken' && (
                    <span className="field-status taken">
                      <AlertCircle size={12} aria-hidden="true" /> {emailMsg}
                    </span>
                  )}
                  {emailStatus === 'invalid' && email.length > 0 && (
                    <span className="field-status invalid">
                      {emailMsg}
                    </span>
                  )}
                </div>
                <input
                  id="registro-email"
                  className={`form-input${
                    error && !email.trim()
                      ? ' has-error'
                      : emailStatus === 'taken'
                      ? ' has-error'
                      : emailStatus === 'available'
                      ? ' is-success'
                      : ''
                  }`}
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="form-field">
                <label className="form-label" htmlFor="registro-password">
                  Contraseña
                </label>
                <PasswordInput
                  id="registro-password"
                  hasError={Boolean(error || passwordIsInvalid)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  disabled={loading}
                />
                <PasswordRequirements password={password} />
              </div>

              {/* Confirmar Password */}
              <div className="form-field">
                <label className="form-label" htmlFor="registro-confirm-password">
                  Confirmar contraseña
                </label>
                <PasswordInput
                  id="registro-confirm-password"
                  hasError={Boolean(error || passwordsDoNotMatch)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError('')
                  }}
                  disabled={loading}
                />
                {passwordsDoNotMatch && (
                  <span className="form-hint" style={{ color: '#ef4444' }}>
                    Las contraseñas no coinciden.
                  </span>
                )}
              </div>

              {/* Error banner */}
              {error && (
                <div className="registro-error" role="alert">
                  <em className="registro-error-icon" aria-hidden="true">✕</em>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="registro-submit"
                className={`registro-submit${loading ? ' is-loading' : ''}`}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creando…' : 'Crear cuenta'}
              </button>
            </form>

            {/* Footer */}
            <footer className="registro-footer">
              <p>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="registro-login-link">
                  Iniciar sesión
                </Link>
              </p>
              <p className="registro-footer-note">
                Al registrarte, se crea tu billetera automáticamente.
              </p>
            </footer>
          </div>
        </section>
      </div>
    </div>
  )
}
