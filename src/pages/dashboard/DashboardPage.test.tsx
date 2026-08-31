import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.tsx'
import DashboardPage from './DashboardPage.tsx'

function renderDashboard() {
  localStorage.setItem('token', 'token-prueba')
  localStorage.setItem('user', JSON.stringify({ first_name: 'Ana', last_name: 'López', username: 'analopez', email: 'ana@axora.test' }))

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<p>Inicio de sesión</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('oculta y muestra el saldo al pulsar el botón correspondiente', async () => {
    const user = userEvent.setup()
    renderDashboard()

    expect(screen.getByText('$1,504')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ocultar saldo' }))
    expect(screen.getByText('••••••')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mostrar saldo' }))
    expect(screen.getByText('$1,504')).toBeInTheDocument()
  })

  it('elimina la sesión y navega al login al cerrar sesión', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByText('Inicio de sesión')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
