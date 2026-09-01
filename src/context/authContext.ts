import { createContext } from 'react'

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  status: AuthStatus
  isAuthenticated: boolean
  setAuthenticated: (isAuthenticated: boolean) => void
  validateSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
