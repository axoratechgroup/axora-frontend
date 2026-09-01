import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_EXPIRED_EVENT, fetchWithAuth, handleUnauthorized } from './fetchWithAuth.ts'

describe('fetchWithAuth', () => {
  const originalFetch = globalThis.fetch
  const originalLocation = window.location

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/dashboard',
        search: '?tab=overview',
        assign: vi.fn(),
        replace: vi.fn(),
      },
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation,
    })
  })

  it('agrega el header Authorization: Bearer <token> si existe un token en localStorage', async () => {
    localStorage.setItem('token', 'token-valido-123')

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    globalThis.fetch = mockFetch

    const res = await fetchWithAuth('https://api.axora.test/wallet', {
      headers: { 'X-Custom-Header': 'test-value' },
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.axora.test/wallet')

    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBe('Bearer token-valido-123')
    expect(headers.get('X-Custom-Header')).toBe('test-value')
    expect(res.status).toBe(200)
  })

  it('limpia localStorage, emite evento auth:expired y redirige al recibir un 401', async () => {
    localStorage.setItem('token', 'token-expirado')
    localStorage.setItem('user', JSON.stringify({ name: 'Juan' }))

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Token expirado' }), { status: 401 }),
    )
    globalThis.fetch = mockFetch

    const listener = vi.fn()
    window.addEventListener(AUTH_EXPIRED_EVENT, listener)

    const res = await fetchWithAuth('https://api.axora.test/wallet')

    expect(res.status).toBe(401)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(window.location.assign).toHaveBeenCalledWith('/login')

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener)
  })

  it('retorna 401, limpia sesión y redirige si no hay token en localStorage', async () => {
    const listener = vi.fn()
    window.addEventListener(AUTH_EXPIRED_EVENT, listener)

    const res = await fetchWithAuth('https://api.axora.test/wallet')

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toContain('token no encontrado')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(window.location.assign).toHaveBeenCalledWith('/login')

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener)
  })

  it('no ejecuta redirección si ya se encuentra en la ruta /login (evita bucles)', () => {
    window.location.pathname = '/login'
    localStorage.setItem('token', 'test')

    handleUnauthorized()

    expect(localStorage.getItem('token')).toBeNull()
    expect(window.location.assign).not.toHaveBeenCalled()
  })

  it('deja pasar códigos no 401 (ej. 200, 400, 500) sin alterar sesión ni redirigir', async () => {
    localStorage.setItem('token', 'token-ok')
    localStorage.setItem('user', JSON.stringify({ name: 'Juan' }))

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 }),
    )
    globalThis.fetch = mockFetch

    const res = await fetchWithAuth('https://api.axora.test/wallet')

    expect(res.status).toBe(400)
    expect(localStorage.getItem('token')).toBe('token-ok')
    expect(localStorage.getItem('user')).not.toBeNull()
    expect(window.location.assign).not.toHaveBeenCalled()
  })
})
