import { describe, expect, it } from 'vitest'
import { formatAmount } from './formatters.ts'

describe('formatAmount', () => {
  it('formatea correctamente valores en cero o con muchos decimales', () => {
    expect(formatAmount('0.00000000')).toBe('0,00')
    expect(formatAmount(0)).toBe('0,00')
    expect(formatAmount('0')).toBe('0,00')
  })

  it('formatea números flotantes y enteros a dos decimales con coma', () => {
    expect(formatAmount(1504)).toBe('1.504,00')
    expect(formatAmount('1504.5')).toBe('1.504,50')
    expect(formatAmount('123.456')).toBe('123,46')
  })

  it('maneja valores inválidos, nulos o vacíos devolviendo 0,00', () => {
    expect(formatAmount(null)).toBe('0,00')
    expect(formatAmount(undefined)).toBe('0,00')
    expect(formatAmount('')).toBe('0,00')
    expect(formatAmount('abc')).toBe('0,00')
  })
})
