import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CurrencyHistoryChart } from './CurrencyHistoryChart.tsx'

vi.mock('react-apexcharts', () => ({
  default: ({ series }: { series: Array<{ data: unknown[] }> }) => (
    <div data-testid="currency-history-chart">{series[0].data.length} points</div>
  ),
}))

describe('CurrencyHistoryChart', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the chart with history points from the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        base: 'USD',
        quote: 'MXN',
        range: '30d',
        source: 'frankfurter.dev',
        points: [
          { date: '2026-08-01', rate: 18.4 },
          { date: '2026-08-02', rate: 18.5 },
        ],
      }),
    }))

    render(<CurrencyHistoryChart />)

    expect(screen.getByText('Cargando histórico…')).toBeInTheDocument()
    expect(await screen.findByTestId('currency-history-chart')).toHaveTextContent('2 points')
  })

  it('shows an error when the API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Proveedor no disponible' }),
    }))

    render(<CurrencyHistoryChart />)

    expect(await screen.findByText('Proveedor no disponible')).toBeInTheDocument()
  })

  it('requests a new range when the user selects it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        base: 'USD',
        quote: 'MXN',
        range: '30d',
        source: 'frankfurter.dev',
        points: [{ date: '2026-08-01', rate: 18.4 }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<CurrencyHistoryChart />)
    await screen.findByTestId('currency-history-chart')
    await user.click(screen.getByRole('button', { name: '7d' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('range=7d'))
    })
  })
})
