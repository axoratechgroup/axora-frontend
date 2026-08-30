import { createContext } from 'react'

export type AuthContextValue = {
  isAuthenticated: boolean
  setAuthenticated: (isAuthenticated: boolean) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
