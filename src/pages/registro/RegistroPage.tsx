import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import './RegistroPage.css'

export default function RegistroPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()

  const [firstName, setFirstName]                       = useState('')
  const [lastName, setLastName]                         = useState('')
  const [username, setUsername]                         = useState('')
  const [email, setEmail]                               = useState('')
  const [password, setPassword]                         = useState('')
  const [showPassword, setShowPassword]                 = useState(false)
  const [confirmPassword, setConfirmPassword]           = useState('')
  const [showConfirmPassword, setShowConfirmPassword]   = useState(false)
  const [error, setError]                               = useState('')
  const [loading, setLoading]                           = useState(false)

  const passwordTooShort = password.length > 0 && password.length < 8
  const passwordsDoNotMatch = confirmPassword.length > 0 && password !== confirmPassword

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
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear la cuenta.')
      }

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
    <div className="registro-page">
      {/* Volver */}
      <Link className="registro-back" to="/login">
        <span aria-hidden="true">←</span>
        Volver
      </Link>

      {/* Brand mark */}
      <div className="registro-brand" aria-label="Axora">
        <span className="registro-brand-icon" aria-hidden="true">◈</span>
        <p className="registro-brand-name">AXORA</p>
      </div>

      {/* Card */}
      <div className="registro-card" role="main">
        <h1 className="registro-title">Crear cuenta</h1>

        <form className="registro-form" onSubmit={handleSubmit} noValidate>
          
          {/* Nombre */}
          <div className="form-field">
            <label className="form-label" htmlFor="registro-firstname">
              Nombre
            </label>
            <input
              id="registro-firstname"
              className={`form-input${error ? ' has-error' : ''}`}
              type="text"
              autoComplete="given-name"
              placeholder="Tu nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Apellido */}
          <div className="form-field">
            <label className="form-label" htmlFor="registro-lastname">
              Apellido
            </label>
            <input
              id="registro-lastname"
              className={`form-input${error ? ' has-error' : ''}`}
              type="text"
              autoComplete="family-name"
              placeholder="Tu apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Usuario */}
          <div className="form-field">
            <label className="form-label" htmlFor="registro-username">
              Usuario
            </label>
            <input
              id="registro-username"
              className={`form-input${error ? ' has-error' : ''}`}
              type="text"
              autoComplete="username"
              placeholder="nombredeusuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="form-field">
            <label className="form-label" htmlFor="registro-email">
              Correo
            </label>
            <input
              id="registro-email"
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
            <label className="form-label" htmlFor="registro-password">
              Contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                id="registro-password"
                className={`form-input${error || passwordTooShort ? ' has-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {passwordTooShort && (
              <span className="form-hint">
                Mínimo 8 caracteres ({password.length}/8)
              </span>
            )}
          </div>

          {/* Confirmar Password */}
          <div className="form-field">
            <label className="form-label" htmlFor="registro-confirm-password">
              Confirmar contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                id="registro-confirm-password"
                className={`form-input${error || passwordsDoNotMatch ? ' has-error' : ''}`}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {passwordsDoNotMatch && (
              <span className="form-hint">
                Las contraseñas no coinciden.
              </span>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="registro-error" role="alert">
              <em className="registro-error-icon" aria-hidden="true">✕</em>
              {error}
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
      </div>

      {/* Footer links */}
      <footer className="registro-footer">
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">iniciar sesión</Link>
        </p>
        <p className="registro-footer-note">
          Al registrarte se crea tu billetera automáticamente.
        </p>
      </footer>
    </div>
  )
}
