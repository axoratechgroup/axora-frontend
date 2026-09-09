import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.tsx'
import { ThemeProvider } from '../../context/ThemeContext.tsx'
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
    <ThemeProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<p>Inicio de sesión</p>} />
            <Route path="/configuracion" element={<p>Página de Configuración Mock</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
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

  it('muestra el nombre del usuario y su badge de @username en el saludo', async () => {
    renderDashboard()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('@analopez')).toBeInTheDocument()
  })

  it('oculta y muestra el saldo al pulsar el botón correspondiente', async () => {
    const user = userEvent.setup()
    renderDashboard()

    const balanceEl = await screen.findByTestId('account-balance')
    expect(balanceEl).toHaveTextContent('1.504,00')
    await user.click(screen.getByRole('button', { name: 'Ocultar saldo' }))
    expect(screen.getByTestId('account-balance')).toHaveTextContent('••••••')
    await user.click(screen.getByRole('button', { name: 'Mostrar saldo' }))
    expect(screen.getByTestId('account-balance')).toHaveTextContent('1.504,00')
  })

  it('elimina la sesión y navega al login al cerrar sesión tras confirmar', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    // Verifica que se abra el ConfirmDialog in-app
    expect(screen.getByText(/Tendrás que volver a ingresar tus credenciales/i)).toBeInTheDocument()
    await user.click(screen.getByTestId('confirm-dialog-confirm'))

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

  it('muestra la nota de una transferencia en la actividad', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(mockWalletData), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            transactions: [{
              id: 'tx-transfer-1',
              type: 'TRANSFER',
              status: 'COMPLETED',
              direction: 'sent',
              counterparty_username: 'camilo',
              from_currency: 'USD',
              from_amount: '50',
              to_currency: 'USD',
              to_amount: '50',
              applied_exchange_rate: null,
              description: 'Cena del viaje',
              created_at: '2026-09-04T14:00:00Z',
            }],
          }),
          { status: 200 },
        ),
      )

    renderDashboard()

    expect(await screen.findByText('Cena del viaje')).toBeInTheDocument()
  })

  it('muestra la tasa de cambio y el estado traducido en transacciones SWAP de la actividad', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(mockWalletData), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            transactions: [{
              id: 'tx-swap-1',
              type: 'SWAP',
              status: 'COMPLETED',
              direction: 'sent',
              counterparty_username: null,
              from_currency: 'USD',
              from_amount: '100',
              to_currency: 'EUR',
              to_amount: '92',
              applied_exchange_rate: '0.9200',
              description: null,
              created_at: '2026-09-04T15:00:00Z',
            }],
          }),
          { status: 200 },
        ),
      )

    renderDashboard()

    expect(await screen.findByText(/USD → EUR • Tasa: 0,92/)).toBeInTheDocument()
    expect(screen.getByText('Completada')).toBeInTheDocument()
  })

  it('navega a configuracion al presionar el boton de configuracion de la cabecera', async () => {
    const user = userEvent.setup()
    renderDashboard()

    const configBtn = screen.getByRole('link', { name: 'Configuración de la cuenta' })
    expect(configBtn).toBeInTheDocument()
    await user.click(configBtn)
    expect(await screen.findByText('Página de Configuración Mock')).toBeInTheDocument()
  })

  it('aplica el modo claro en documentElement cuando el tema guardado es light', async () => {
    localStorage.setItem('theme', 'light')
    renderDashboard()

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('distingue transferencias enviadas y recibidas con texto explícito de dirección y signos', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(mockWalletData), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            transactions: [
              {
                id: 'tx-sent',
                type: 'TRANSFER',
                status: 'COMPLETED',
                direction: 'sent',
                counterparty_username: 'carlos',
                from_currency: 'USD',
                from_amount: '30',
                to_currency: 'USD',
                to_amount: '30',
                applied_exchange_rate: null,
                description: null,
                created_at: '2026-09-04T12:00:00Z',
              },
              {
                id: 'tx-received',
                type: 'TRANSFER',
                status: 'COMPLETED',
                direction: 'received',
                counterparty_username: 'maria',
                from_currency: 'USD',
                from_amount: '45',
                to_currency: 'USD',
                to_amount: '45',
                applied_exchange_rate: null,
                description: null,
                created_at: '2026-09-04T13:00:00Z',
              },
            ],
          }),
          { status: 200 },
        ),
      )

    renderDashboard()

    expect(await screen.findByText('Enviado a @carlos')).toBeInTheDocument()
    expect(screen.getByText('Recibido de @maria')).toBeInTheDocument()
    expect(screen.getByText(/- 30,00 USD/)).toBeInTheDocument()
    expect(screen.getByText(/\+ 45,00 USD/)).toBeInTheDocument()
  })

  it('redirige inmediatamente a /admin si el usuario autenticado tiene rol admin', () => {
    localStorage.setItem('token', 'token-prueba')
    localStorage.setItem(
      'user',
      JSON.stringify({
        first_name: 'Admin',
        last_name: 'Test',
        username: 'admintest',
        email: 'admintest@axora.com',
        role: 'admin',
      }),
    )

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<p>Admin Page Mock</p>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(screen.getByText('Admin Page Mock')).toBeInTheDocument()
    expect(screen.queryByText('Hola,')).not.toBeInTheDocument()
  })

  it('muestra botón de limpiar filtros y resetea los filtros al hacer clic', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            wallet_id: 'w-1',
            total_in_usd: 100,
            balances: [{ currency: 'USD', amount: '100' }],
            transactions: [
              {
                id: 'tx-1',
                type: 'TOP_UP',
                status: 'COMPLETED',
                direction: 'received',
                from_currency: null,
                from_amount: null,
                to_currency: 'USD',
                to_amount: '100',
                applied_exchange_rate: null,
                description: 'Recarga inicial',
                created_at: '2026-09-01T10:00:00Z',
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    )

    renderDashboard()

    // Initially no clear filters button
    expect(screen.queryByRole('button', { name: /Limpiar filtros/i })).not.toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Buscar por usuario o descripción/i)
    await user.type(searchInput, 'Recarga')

    // Button should now be visible
    const clearBtn = await screen.findByRole('button', { name: /Limpiar filtros/i })
    expect(clearBtn).toBeInTheDocument()

    // Clicking clear button
    await user.click(clearBtn)

    expect(searchInput).toHaveValue('')
    expect(screen.queryByRole('button', { name: /Limpiar filtros/i })).not.toBeInTheDocument()
  })

  it('establece max con la fecha de hoy en los selectores de fecha para evitar fechas futuras', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            wallet_id: 'w-1',
            total_in_usd: 100,
            balances: [{ currency: 'USD', amount: '100' }],
            transactions: [],
          }),
          { status: 200 },
        ),
      ),
    )

    renderDashboard()

    const todayStr = new Date().toISOString().split('T')[0]
    const dateFrom = screen.getByLabelText('Desde')
    const dateTo = screen.getByLabelText('Hasta')

    expect(dateFrom).toHaveAttribute('max', todayStr)
    expect(dateTo).toHaveAttribute('max', todayStr)
  })
})

