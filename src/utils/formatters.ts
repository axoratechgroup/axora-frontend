/**
 * Formatea un valor numérico o string a 2 decimales usando coma como separador decimal.
 * Ejemplo: "0.00000000" -> "0,00", 1504 -> "1504,00", "25.5" -> "25,50"
 */
export function formatAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '0,00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0,00'
  const [integerPart, decimalPart] = num.toFixed(2).split('.')
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${withThousands},${decimalPart}`
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  TOP_UP: 'Recarga',
  TRANSFER: 'Transferencia',
  SWAP: 'Cambio de moneda',
}

/**
 * Traduce el tipo interno de una transacción a un texto legible.
 * Si el tipo no está mapeado, devuelve el valor original tal cual.
 */
export function formatTransactionType(type: string): string {
  return TRANSACTION_TYPE_LABELS[type] ?? type
}

/**
 * Limpia el valor de un input de monto mientras se escribe: solo permite
 * dígitos y un único separador decimal (punto). Bloquea letras, signos y
 * separadores repetidos (ej. "1.2.3" o "1e5").
 */
export function sanitizeAmountInput(value: string): string {
  const digitsAndDot = value.replace(/[^0-9.]/g, '')
  const [integerPart, ...rest] = digitsAndDot.split('.')
  if (rest.length === 0) return integerPart
  return `${integerPart}.${rest.join('')}`
}

/**
 * Formatea un valor "crudo" (dígitos y un único punto decimal, tal como
 * lo guarda el estado del formulario) a la notación que ve el usuario:
 * puntos de miles y coma decimal. Ej: "1500000.5" -> "1.500.000,5"
 */
export function formatAmountInputDisplay(rawAmount: string): string {
  if (!rawAmount) return ''
  const [integerPart, decimalPart] = rawAmount.split('.')
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimalPart === undefined ? withThousands : `${withThousands},${decimalPart}`
}

/**
 * Inversa de formatAmountInputDisplay: toma lo que el usuario ve/escribe
 * (con puntos de miles y coma decimal) y lo vuelve a la forma "cruda"
 * (solo dígitos y un único punto decimal), lista para Number().
 */
export function parseAmountInputDisplay(displayValue: string): string {
  const withoutThousands = displayValue.replace(/\./g, '')
  const withDotDecimal = withoutThousands.replace(',', '.')
  return sanitizeAmountInput(withDotDecimal)
}
