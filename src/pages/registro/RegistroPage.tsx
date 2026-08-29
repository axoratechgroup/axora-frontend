import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'
import './RegistroPage.css'

export default function RegistroPage() {
  const navigate = useNavigate()
  const { setAuthenticated } = useAuth()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    try {
      // TODO: reemplazar con llamada real a la API
      await new Promise((res) => setTimeout(res, 1200))

      // Redirige al dashboard tras crear la cuenta
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
            <label className="form-label" htmlFor="registro-name">
              Nombre
            </label>
            <input
              id="registro-name"
              className={`form-input${error ? ' has-error' : ''}`}
              type="text"
              autoComplete="name"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              className={`form-input${error ? ' has-error' : ''}`}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
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
