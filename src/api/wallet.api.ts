import { fetchWithAuth } from './fetchWithAuth.ts'
import type { WalletResponse, TransactionsResponse, Transaction } from '../types/wallet.ts'

const API_URL = import.meta.env.VITE_API_URL

export async function getWalletApi(): Promise<WalletResponse> {
  const response = await fetchWithAuth(`${API_URL}/wallet`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo cargar la wallet.')
  }

  return data
}

export async function getWalletTransactionsApi(): Promise<Transaction[]> {
  const response = await fetchWithAuth(`${API_URL}/wallet/transactions`)
  const data = (await response.json().catch(() => ({}))) as TransactionsResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'No se pudieron cargar las transacciones.')
  }

  return data.transactions || []
}

export async function topupApi(currency: string, amount: number): Promise<Transaction> {
  const response = await fetchWithAuth(`${API_URL}/wallet/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency, amount }),
  })
  const data = (await response.json().catch(() => ({}))) as { transaction?: Transaction; error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo procesar la carga.')
  }

  return data.transaction as Transaction
}

export async function transferApi(
  recipientEmail: string,
  currency: string,
  amount: number,
): Promise<Transaction> {
  const response = await fetchWithAuth(`${API_URL}/wallet/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_email: recipientEmail, currency, amount }),
  })
  const data = (await response.json().catch(() => ({}))) as { transaction?: Transaction; error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo procesar la transferencia.')
  }

  return data.transaction as Transaction
}