export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: 'US', // Dólar estadounidense 🇺🇸
  ARS: 'AR', // Peso argentino 🇦🇷
  COP: 'CO', // Peso colombiano 🇨🇴
  MXN: 'MX', // Peso mexicano 🇲🇽
  EUR: 'EU', // Euro 🇪🇺
  BRL: 'BR', // Real brasileño 🇧🇷
}

/**
 * Devuelve el código de país ISO 3166-1 alpha-2 correspondiente a una moneda,
 * o undefined si no está soportada.
 */
export function getCountryCode(currency: string): string | undefined {
  if (!currency) return undefined
  return CURRENCY_TO_COUNTRY[currency.trim().toUpperCase()]
}
