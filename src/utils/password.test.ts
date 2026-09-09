import { describe, expect, it } from 'vitest'
import { validatePassword } from './password.ts'

describe('validatePassword', () => {
  it('identifica correctamente todos los requisitos cumplidos', () => {
    const result = validatePassword('Password123!')
    expect(result.isValid).toBe(true)
    expect(result.hasMinLength).toBe(true)
    expect(result.hasUppercase).toBe(true)
    expect(result.hasLowercase).toBe(true)
    expect(result.hasNumber).toBe(true)
    expect(result.hasSpecial).toBe(true)
    expect(result.rules.every((r) => r.isMet)).toBe(true)
  })

  it('falla si tiene menos de 8 caracteres', () => {
    const result = validatePassword('Pass1!')
    expect(result.isValid).toBe(false)
    expect(result.hasMinLength).toBe(false)
    expect(result.rules.find((r) => r.id === 'min-length')?.isMet).toBe(false)
    expect(result.rules.find((r) => r.id === 'min-length')?.label).toBe('Mínimo 8 caracteres (6/8)')
  })

  it('falla si falta mayúscula', () => {
    const result = validatePassword('password123!')
    expect(result.isValid).toBe(false)
    expect(result.hasUppercase).toBe(false)
    expect(result.rules.find((r) => r.id === 'uppercase')?.isMet).toBe(false)
  })

  it('falla si falta minúscula', () => {
    const result = validatePassword('PASSWORD123!')
    expect(result.isValid).toBe(false)
    expect(result.hasLowercase).toBe(false)
    expect(result.rules.find((r) => r.id === 'lowercase')?.isMet).toBe(false)
  })

  it('falla si falta número', () => {
    const result = validatePassword('Password!!!')
    expect(result.isValid).toBe(false)
    expect(result.hasNumber).toBe(false)
    expect(result.rules.find((r) => r.id === 'number')?.isMet).toBe(false)
  })

  it('falla si falta carácter especial', () => {
    const result = validatePassword('Password123')
    expect(result.isValid).toBe(false)
    expect(result.hasSpecial).toBe(false)
    expect(result.rules.find((r) => r.id === 'special')?.isMet).toBe(false)
  })
})
