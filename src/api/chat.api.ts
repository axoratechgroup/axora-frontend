import { fetchWithAuth } from './fetchWithAuth.ts'
import type { ChatHistoryEntry, ChatResponse, ChatConfirmResponse, ProposedAction } from '../types/chat.ts'

const API_URL = import.meta.env.VITE_API_URL

export async function sendChatMessageApi(
  message: string,
  history: ChatHistoryEntry[],
): Promise<ChatResponse> {
  const response = await fetchWithAuth(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })
  const data = (await response.json().catch(() => ({}))) as ChatResponse & { error?: string }

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'No se pudo contactar al asistente.')
  }

  return data
}

export async function confirmChatActionApi(action: ProposedAction): Promise<ChatConfirmResponse> {
  const response = await fetchWithAuth(`${API_URL}/chat/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action),
  })
  const data = (await response.json().catch(() => ({}))) as ChatConfirmResponse & { error?: string }

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'No se pudo confirmar la operación.')
  }

  return data
}