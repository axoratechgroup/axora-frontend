/**
 * Formatea un valor numérico o string a 2 decimales usando coma como separador decimal.
 * Ejemplo: "0.00000000" -> "0,00", 1504 -> "1504,00", "25.5" -> "25,50"
 */
export function formatAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '0,00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0,00'
  return num.toFixed(2).replace('.', ',')
}
