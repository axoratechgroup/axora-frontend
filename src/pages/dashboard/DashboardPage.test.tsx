import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.tsx'
import DashboardPage from './DashboardPage.tsx'

vi.mock('../../components/dashboard/CurrencyHistoryChart.tsx', () => ({
  CurrencyHistoryChart: () => <div data-testid="currency-history-chart" />,
}))

const mockWalletData = {
  wallet_id: 'wallet-123',
  created_at: '2026-01-01',
  total_in_usd: 1504,
  balances: [
    {
      currency: 'USD',
      currency_name: 'Dólar estadounidense',
      symbol: '$',
      amount: '1504.00',
      updated_at: '2026-01-01',
    },
    {
      currency: 'ARS',
      currency_name: 'Peso argentino',
      symbol: '$',
      amount: '200000.00',
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

    const balanceEl = await screen.findByTestId('account-balance')
    expect(balanceEl).toHaveTextContent('1.504,00')
    await user.click(screen.getByRole('button', { name: 'Ocultar saldo' }))
    expect(screen.getByTestId('account-balance')).toHaveTextContent('••••••')
    expect(screen.getAllByText('••••').length).toBeGreaterThanOrEqual(1)
    await user.click(screen.getByRole('button', { name: 'Mostrar saldo' }))
    expect(screen.getByTestId('account-balance')).toHaveTextContent('1.504,00')
  })

  it('elimina la sesión y navega al login al cerrar sesión', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
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

  it('permite alternar entre la vista de Total USD y monedas individuales', async () => {
    const user = userEvent.setup()
    renderDashboard()

    // Vista inicial en Total USD
    const balanceEl = await screen.findByTestId('account-balance')
    expect(balanceEl).toHaveTextContent('1.504,00')
    expect(balanceEl).toHaveTextContent('USD')
    expect(screen.getByText('Total (USD)')).toBeInTheDocument()
    expect(
      screen.getByText(/Patrimonio total consolidado en USD/i),
    ).toBeInTheDocument()

    // Seleccionar moneda ARS en las píldoras
    const arsPill = screen.getByRole('tab', { name: /ARS/i })
    await user.click(arsPill)

    // Ahora muestra el saldo en ARS
    expect(screen.getByTestId('account-balance')).toHaveTextContent('200.000,00')
    expect(screen.getByTestId('account-balance')).toHaveTextContent('ARS')
    expect(screen.getByTestId('account-balance-hint')).toHaveTextContent('Peso argentino')
    expect(screen.getByRole('button', { name: 'Ver total USD' })).toBeInTheDocument()

    // Volver a Total USD mediante el botón de retorno
    await user.click(screen.getByRole('button', { name: 'Ver total USD' }))
    expect(screen.getByTestId('account-balance')).toHaveTextContent('1.504,00')
    expect(screen.getByTestId('account-balance')).toHaveTextContent('USD')
    expect(
      screen.getByText(/Patrimonio total consolidado en USD/i),
    ).toBeInTheDocument()
  })

  it('calcula la estimación en USD si el backend no expone total_in_usd pero hay saldo en otras monedas', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          wallet_id: 'wallet-no-total',
          created_at: '2026-01-01',
          // total_in_usd ausente (como en backend previo al redespliegue)
          balances: [
            {
              currency: 'USD',
              currency_name: 'Dólar estadounidense',
              symbol: '$',
              amount: '0.00',
              updated_at: '2026-01-01',
            },
            {
              currency: 'ARS',
              currency_name: 'Peso argentino',
              symbol: '$',
              amount: '200000.00',
              updated_at: '2026-01-01',
            },
          ],
          transactions: [],
        }),
        { status: 200 },
      ),
    )

    renderDashboard()

    // 200.000 ARS * 0.00075 = 150 USD
    const balanceEl = await screen.findByTestId('account-balance')
    expect(balanceEl).toHaveTextContent('150,00')
    expect(balanceEl).toHaveTextContent('USD')
  })
})
