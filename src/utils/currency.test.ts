import { describe, expect, it } from 'vitest'
import { getCountryCode, CURRENCY_TO_COUNTRY, getFallbackExchangeRate } from './currency.ts'

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

  it('calcula conversiones directas y cruzadas correctamente', () => {
    // Misma moneda = 1
    expect(getFallbackExchangeRate('USD', 'USD')).toBe(1)
    expect(getFallbackExchangeRate('EUR', 'EUR')).toBe(1)

    // Conversión directa a USD
    expect(getFallbackExchangeRate('EUR', 'USD')).toBe(1.08)
    expect(getFallbackExchangeRate('USD', 'EUR')).toBeCloseTo(1 / 1.08, 4)

    // Conversión cruzada EUR -> MXN (el bug del simulador que daba 1)
    const eurToMxn = getFallbackExchangeRate('EUR', 'MXN')
    expect(eurToMxn).toBeCloseTo(1.08 / 0.051, 4)
    expect(eurToMxn).toBeGreaterThan(20)

    // Moneda desconocida
    expect(getFallbackExchangeRate('EUR', 'XYZ')).toBe(0)
    expect(getFallbackExchangeRate('XYZ', 'USD')).toBe(0)
  })
})

