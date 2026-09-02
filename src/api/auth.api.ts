import type { AuthResponse, LoginCredentials, RegisterData } from '../types/auth.ts'

const API_URL = import.meta.env.VITE_API_URL

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Correo o contraseña incorrectos.')
  }

  return data
}

export async function registerApi(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar el registro.')
  }

  return data
}
