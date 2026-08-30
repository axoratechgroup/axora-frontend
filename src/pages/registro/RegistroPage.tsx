import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import './RegistroPage.css'

export default function RegistroPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()

 const [firstName, setFirstName] = useState('')
const [lastName, setLastName]   = useState('')
const [username, setUsername]   = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
const passwordTooShort = password.length > 0 && password.length < 8
  const handleSubmit = async (e: SyntheticEvent) => {
  e.preventDefault()
  setError('')

  if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
    setError('Por favor completa todos los campos.')
    return
  }
  if (password.length < 8) {
    setError('La contraseña debe tener al menos 8 caracteres.')
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
  <input
    id="registro-password"
    className={`form-input${error || passwordTooShort ? ' has-error' : ''}`}
    type="password"
    autoComplete="new-password"
    placeholder="••••••••"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    disabled={loading}
  />
  {passwordTooShort && (
    <span className="form-hint">
      Mínimo 8 caracteres ({password.length}/8)
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
