import { useEffect, useMemo, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import type { ApexAxisChartSeries, ApexOptions } from 'apexcharts'
import { getRateHistoryApi } from '../../api/rates.api.ts'
import type { RateHistoryRange, RateHistoryResponse } from '../../types/rates.ts'
import './CurrencyHistoryChart.css'

const BASE_CURRENCY = 'USD'
const QUOTE_CURRENCIES = ['MXN', 'EUR', 'ARS', 'COP', 'BRL']
const RANGES: RateHistoryRange[] = ['7d', '30d', '90d']

function formatRate(rate: number): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate)
}

export function CurrencyHistoryChart() {
  const [quote, setQuote] = useState('MXN')
  const [range, setRange] = useState<RateHistoryRange>('30d')
  const [history, setHistory] = useState<RateHistoryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    async function loadHistory() {
      setLoading(true)
      setError(null)

      try {
        const response = await getRateHistoryApi(BASE_CURRENCY, quote, range)
        if (isCurrent) {
          setHistory(response)
        }
      } catch (requestError) {
        if (isCurrent) {
          setHistory(null)
          setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el histórico de divisas.')
        }
      } finally {
        if (isCurrent) {
          setLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      isCurrent = false
    }
  }, [quote, range])

  const series = useMemo<ApexAxisChartSeries>(
    () => [
      {
        name: `1 ${BASE_CURRENCY} en ${quote}`,
        data: (history?.points ?? []).map((point) => ({
          x: new Date(`${point.date}T00:00:00Z`).getTime(),
          y: point.rate,
        })),
      },
    ],
    [history, quote],
  )

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: 'area',
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent',
      },
      colors: ['#f4a261'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: { opacityFrom: 0.45, opacityTo: 0.04 },
      },
      grid: { borderColor: 'rgba(255, 255, 255, 0.13)', strokeDashArray: 4 },
      xaxis: {
        type: 'datetime',
        labels: { style: { colors: 'rgba(255, 255, 255, 0.62)' } },
        axisBorder: { color: 'rgba(255, 255, 255, 0.2)' },
        axisTicks: { color: 'rgba(255, 255, 255, 0.2)' },
      },
      yaxis: {
        labels: {
          style: { colors: 'rgba(255, 255, 255, 0.62)' },
          formatter: (value) => formatRate(value),
        },
      },
      tooltip: {
        theme: 'dark',
        x: { format: 'dd MMM yyyy' },
        y: { formatter: (value) => `${formatRate(value)} ${quote}` },
      },
    }),
    [quote],
  )

  return (
    <div className="currency-history">
      <div className="currency-history__header">
        <div>
          <h2 className="section-title">histórico de divisa</h2>
          <p className="currency-history__description">Valor de 1 {BASE_CURRENCY} en {quote}</p>
        </div>

        <label className="currency-history__currency-label">
          <span className="sr-only">Moneda a consultar</span>
          <select
            className="currency-history__currency-select"
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
            disabled={loading}
          >
            {QUOTE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="currency-history__ranges" aria-label="Rango del histórico">
        {RANGES.map((option) => (
          <button
            key={option}
            type="button"
            className={option === range ? 'currency-history__range is-active' : 'currency-history__range'}
            aria-pressed={option === range}
            onClick={() => setRange(option)}
            disabled={loading}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="currency-history__content" aria-live="polite">
        {loading && <p className="currency-history__message">Cargando histórico…</p>}
        {error && !loading && <p className="currency-history__message is-error">{error}</p>}
        {!loading && !error && history?.points.length === 0 && (
          <p className="currency-history__message">Todavía no hay datos disponibles para este período.</p>
        )}
        {!loading && !error && (history?.points.length ?? 0) > 0 && (
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={220}
            aria-label={`Histórico de la tasa de ${BASE_CURRENCY} a ${quote}`}
          />
        )}
      </div>
    </div>
  )
}
