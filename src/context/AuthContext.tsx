import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { AuthContext, type AuthStatus } from './authContext.ts'
import { AUTH_EXPIRED_EVENT, fetchWithAuth } from '../api/fetchWithAuth.ts'

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(() => {
    return localStorage.getItem('token') ? 'checking' : 'unauthenticated'
  })

  const validateSession = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setStatus('unauthenticated')
      return
    }

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/wallet`)
      setStatus(response.ok ? 'authenticated' : 'unauthenticated')
    } catch {
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    if (localStorage.getItem('token')) {
      fetchWithAuth(`${import.meta.env.VITE_API_URL}/wallet`)
        .then((response) => {
          if (!isMounted) return
          setStatus(response.ok ? 'authenticated' : 'unauthenticated')
        })
        .catch(() => {
          if (!isMounted) return
          setStatus('unauthenticated')
        })
    }

    const handleAuthExpired = () => {
      setStatus('unauthenticated')
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          setStatus('checking')
          fetchWithAuth(`${import.meta.env.VITE_API_URL}/wallet`)
            .then((response) => {
              if (!isMounted) return
              setStatus(response.ok ? 'authenticated' : 'unauthenticated')
            })
            .catch(() => {
              if (!isMounted) return
              setStatus('unauthenticated')
            })
        } else {
          setStatus('unauthenticated')
        }
      }
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      isMounted = false
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const setAuthenticated = useCallback((authenticated: boolean) => {
    setStatus(authenticated ? 'authenticated' : 'unauthenticated')
  }, [])

  const value = useMemo(
    () => ({
      status,
      isAuthenticated: status === 'authenticated',
      setAuthenticated,
      validateSession,
    }),
    [status, setAuthenticated, validateSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
