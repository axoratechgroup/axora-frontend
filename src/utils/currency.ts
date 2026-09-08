export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: 'US', // Dólar estadounidense 🇺🇸
  ARS: 'AR', // Peso argentino 🇦🇷
  COP: 'CO', // Peso colombiano 🇨🇴
  MXN: 'MX', // Peso mexicano 🇲🇽
  EUR: 'EU', // Euro 🇪🇺
  BRL: 'BR', // Real brasileño 🇧🇷
}

export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'Dólar estadounidense',
  ARS: 'Peso argentino',
  MXN: 'Peso mexicano',
  COP: 'Peso colombiano',
  BRL: 'Real brasileño',
  EUR: 'Euro',
}

export const FALLBACK_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  ARS: 0.00075,
  COP: 0.00025,
  MXN: 0.051,
  BRL: 0.17,
}

/**
 * Devuelve la tasa de conversión calculada de forma cruzada usando las tasas base a USD.
 * Si alguna moneda no está soportada, retorna 0.
 */
export function getFallbackExchangeRate(from: string, to: string): number {
  const normFrom = from?.trim().toUpperCase()
  const normTo = to?.trim().toUpperCase()
  if (normFrom === normTo) return 1
  const fromToUsd = FALLBACK_RATES_TO_USD[normFrom]
  const toToUsd = FALLBACK_RATES_TO_USD[normTo]
  if (!fromToUsd || !toToUsd) return 0
  return fromToUsd / toToUsd
}

/**
 * Devuelve el código de país ISO 3166-1 alpha-2 correspondiente a una moneda,
 * o undefined si no está soportada.
 */
export function getCountryCode(currency: string): string | undefined {
  if (!currency) return undefined
  return CURRENCY_TO_COUNTRY[currency.trim().toUpperCase()]
}

