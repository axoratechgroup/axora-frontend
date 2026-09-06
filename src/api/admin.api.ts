import { fetchWithAuth } from './fetchWithAuth.ts'

const API_URL = import.meta.env.VITE_API_URL

export interface AdminUser {
  id: string
  first_name: string
  last_name: string
  username: string
  email: string
  created_at: string
}

export interface AdminTransaction {
  id: string
  type: string
  status: string
  username: string
  email: string
  from_currency: string | null
  from_amount: string | null
  to_currency: string
  to_amount: string
  applied_exchange_rate: string | null
  description: string | null
  created_at: string
}

export async function getAdminUsersApi(): Promise<AdminUser[]> {
  const response = await fetchWithAuth(`${API_URL}/admin/users`)
  const data = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'No se pudieron cargar los usuarios.')
  }

  return data as AdminUser[]
}

export async function getAdminTransactionsApi(): Promise<AdminTransaction[]> {
  const response = await fetchWithAuth(`${API_URL}/admin/transactions`)
  const data = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'No se pudieron cargar las transacciones.')
  }

  return data as AdminTransaction[]
}
