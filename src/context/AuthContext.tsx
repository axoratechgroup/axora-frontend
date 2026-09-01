import { useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { AuthContext } from './authContext.ts'
import { AUTH_EXPIRED_EVENT } from '../api/fetchWithAuth.ts'

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setAuthenticated] = useState(() => !!localStorage.getItem('token'))

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthenticated(false)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setAuthenticated(!!e.newValue)
      }
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, setAuthenticated }),
    [isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

