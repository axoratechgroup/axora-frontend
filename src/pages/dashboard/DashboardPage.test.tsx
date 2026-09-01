import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.tsx'
import DashboardPage from './DashboardPage.tsx'

const mockWalletData = {
  wallet_id: 'wallet-123',
  created_at: '2026-01-01',
  balances: [
    {
      currency: 'USD',
      currency_name: 'Dólar estadounidense',
      symbol: '$',
      amount: '1504.00',
      updated_at: '2026-01-01',
    },
  ],
  transactions: [],
}

function renderDashboard() {
  localStorage.setItem('token', 'token-prueba')
  localStorage.setItem(
    'user',
    JSON.stringify({
      first_name: 'Ana',
      last_name: 'López',
      username: 'analopez',
      email: 'ana@axora.test',
    }),
  )

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
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockWalletData), { status: 200 }),
    )
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('oculta y muestra el saldo al pulsar el botón correspondiente', async () => {
    const user = userEvent.setup()
    renderDashboard()

    expect(await screen.findByText('1504.00 USD')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ocultar saldo' }))
    expect(screen.getByText('••••••')).toBeInTheDocument()
    expect(screen.getByText('••••')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mostrar saldo' }))
    expect(screen.getByText('1504.00 USD')).toBeInTheDocument()
  })

  it('elimina la sesión y navega al login al cerrar sesión', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByText('Inicio de sesión')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('desloguea y limpia credenciales si la API responde 401 (token expirado)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Token expirado o inválido' }), { status: 401 }),
    )

    renderDashboard()

    expect(await screen.findByText(/Token expirado o inválido/i)).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
