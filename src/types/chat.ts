export interface ChatHistoryEntry {
  role: 'user' | 'assistant'
  text: string
}

export interface ProposedAction {
  type: 'transfer' | 'topup' | 'exchange'
  params: Record<string, unknown>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  proposedAction?: ProposedAction
  actionStatus?: 'pending' | 'confirmed' | 'cancelled'
}

export interface ChatResponse {
  reply: string
  proposedAction?: ProposedAction
}

export interface ChatConfirmResponse {
  reply: string
  transaction?: unknown
}