import { beforeEach, describe, expect, it } from 'vitest'
import { getHomeRoute, getStoredUser } from './user.ts'

describe('user utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getStoredUser', () => {
    it('retorna null si localStorage no tiene usuario guardado', () => {
      expect(getStoredUser()).toBeNull()
    })

    it('retorna null si el contenido de localStorage es JSON inválido', () => {
      localStorage.setItem('user', '{invalid-json')
      expect(getStoredUser()).toBeNull()
    })

    it('retorna el objeto de usuario parseado correctamente', () => {
      const mockUser = {
        id: 'usr-1',
        first_name: 'Admin',
        last_name: 'Test',
        username: 'admintest',
        email: 'admintest@axora.com',
        role: 'admin' as const,
      }
      localStorage.setItem('user', JSON.stringify(mockUser))

      const user = getStoredUser()
      expect(user).toEqual(mockUser)
    })
  })

  describe('getHomeRoute', () => {
    it('retorna /admin para el rol admin', () => {
      expect(getHomeRoute('admin')).toBe('/admin')
    })

    it('retorna /dashboard para el rol user', () => {
      expect(getHomeRoute('user')).toBe('/dashboard')
    })

    it('retorna /dashboard si el rol es undefined o vacío', () => {
      expect(getHomeRoute(undefined)).toBe('/dashboard')
      expect(getHomeRoute('')).toBe('/dashboard')
    })
  })
})
