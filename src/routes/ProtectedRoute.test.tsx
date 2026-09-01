import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext.tsx'
import ProtectedRoute from './ProtectedRoute.tsx'

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Página de inicio de sesión</p>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <p>Dashboard privado</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('redirecciona a login inmediatamente cuando no hay token en localStorage', () => {
    renderProtectedRoute()

    expect(screen.getByText('Página de inicio de sesión')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard privado')).not.toBeInTheDocument()
  })

  it('muestra estado de carga mientras valida la sesión con el backend', () => {
    localStorage.setItem('token', 'token-de-prueba')
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))

    renderProtectedRoute()

    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard privado')).not.toBeInTheDocument()
  })

  it('muestra el contenido privado cuando el backend valida el token exitosamente', async () => {
    localStorage.setItem('token', 'token-valido')
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ wallet_id: 'w1', balances: [] }), { status: 200 }),
    )

    renderProtectedRoute()

    expect(await screen.findByText('Dashboard privado')).toBeInTheDocument()
  })

  it('redirecciona a login y limpia sesión cuando el backend responde 401 (token expirado o inválido)', async () => {
    localStorage.setItem('token', 'token-invalido')
    localStorage.setItem('user', JSON.stringify({ name: 'Usuario' }))
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Token inválido o expirado' }), { status: 401 }),
    )

    renderProtectedRoute()

    expect(await screen.findByText('Página de inicio de sesión')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard privado')).not.toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
