import { useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { AuthContext } from './authContext.ts'

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setAuthenticated] = useState(false)

  const value = useMemo(
    () => ({ isAuthenticated, setAuthenticated }),
    [isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
