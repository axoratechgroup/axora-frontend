import { describe, expect, it } from 'vitest'
import { formatAmount, formatExchangeRate } from './formatters.ts'

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

describe('formatExchangeRate', () => {
  it('formatea tasas de cambio con separador decimal y miles en español', () => {
    expect(formatExchangeRate(0.92)).toBe('0,92')
    expect(formatExchangeRate('18.4521')).toBe('18,4521')
    expect(formatExchangeRate(4150.5)).toBe('4.150,50')
  })

  it('devuelve guión para valores nulos o no numéricos', () => {
    expect(formatExchangeRate(null)).toBe('—')
    expect(formatExchangeRate(undefined)).toBe('—')
    expect(formatExchangeRate('invalid')).toBe('—')
  })
})
