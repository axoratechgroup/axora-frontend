export interface User {
  id?: string
  first_name: string
  last_name: string
  username: string
  email: string
}

export type StoredUser = User

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  first_name: string
  last_name: string
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
  error?: string
}
