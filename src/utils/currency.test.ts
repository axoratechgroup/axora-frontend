import { describe, expect, it } from 'vitest'
import { getCountryCode, CURRENCY_TO_COUNTRY } from './currency.ts'

describe('currency utils', () => {
  it('retorna el código de país correcto para monedas soportadas', () => {
    expect(getCountryCode('USD')).toBe('US')
    expect(getCountryCode('ARS')).toBe('AR')
    expect(getCountryCode('COP')).toBe('CO')
    expect(getCountryCode('MXN')).toBe('MX')
    expect(getCountryCode('EUR')).toBe('EU')
    expect(getCountryCode('BRL')).toBe('BR')
  })

  it('es insensible a mayúsculas y minúsculas', () => {
    expect(getCountryCode('usd')).toBe('US')
    expect(getCountryCode('ars')).toBe('AR')
  })

  it('devuelve undefined para monedas no soportadas o cadenas vacías', () => {
    expect(getCountryCode('XYZ')).toBeUndefined()
    expect(getCountryCode('')).toBeUndefined()
  })

  it('tiene definidas las 6 monedas base de AXORA', () => {
    expect(Object.keys(CURRENCY_TO_COUNTRY)).toEqual(['USD', 'ARS', 'COP', 'MXN', 'EUR', 'BRL'])
  })
})
