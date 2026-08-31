import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../context/AuthContext.tsx'
import ProtectedRoute from './ProtectedRoute.tsx'

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Página de inicio de sesión</p>} />
          <Route path="/dashboard" element={<ProtectedRoute><p>Dashboard privado</p></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirecciona a login cuando no hay sesión', () => {
    renderProtectedRoute()

    expect(screen.getByText('Página de inicio de sesión')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard privado')).not.toBeInTheDocument()
  })

  it('muestra el contenido privado cuando existe un token', () => {
    localStorage.setItem('token', 'token-de-prueba')

    renderProtectedRoute()

    expect(screen.getByText('Dashboard privado')).toBeInTheDocument()
  })
})
