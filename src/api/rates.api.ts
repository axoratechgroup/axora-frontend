import type { RateHistoryRange, RateHistoryResponse } from '../types/rates.ts'

const API_URL = import.meta.env.VITE_API_URL

export async function getRateHistoryApi(
  base: string,
  quote: string,
  range: RateHistoryRange,
): Promise<RateHistoryResponse> {
  const query = new URLSearchParams({ base, quote, range })
  const response = await fetch(`${API_URL}/rates/history?${query}`)
  const data = (await response.json().catch(() => ({}))) as Partial<RateHistoryResponse> & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo cargar el histórico de divisas.')
  }

  if (
    typeof data.base !== 'string' ||
    typeof data.quote !== 'string' ||
    typeof data.source !== 'string' ||
    !Array.isArray(data.points)
  ) {
    throw new Error('La respuesta del histórico de divisas no tiene un formato válido.')
  }

  return {
    base: data.base,
    quote: data.quote,
    range,
    source: data.source,
    points: data.points.filter(
      (point): point is { date: string; rate: number } =>
        typeof point?.date === 'string' && typeof point?.rate === 'number' && Number.isFinite(point.rate),
    ),
  }
}
