import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { Send, X, MessageCircle } from 'lucide-react'
import { sendChatMessageApi, confirmChatActionApi } from '../../api/chat.api.ts'
import type { ChatMessage, ChatHistoryEntry } from '../../types/chat.ts'
import './ChatWidget.css'

interface ChatWidgetProps {
  onActionConfirmed?: () => void
}

let messageIdCounter = 0
function nextId() {
  messageIdCounter += 1
  return `msg-${messageIdCounter}`
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  )
}

export function ChatWidget({ onActionConfirmed }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      role: 'assistant',
      text: 'Hola, soy el asistente de Axora. Puedo ayudarte a transferir dinero, cargar saldo o cambiar entre monedas. ¿En qué te ayudo?',
    },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])


  useEffect(() => {
    if (isOpen && !isSending) {
      inputRef.current?.focus()
    }
  }, [isOpen, isSending])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const history: ChatHistoryEntry[] = messages.map((m) => ({ role: m.role, text: m.text }))

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: trimmed }])
    setInput('')
    setError('')
    setIsSending(true)

    try {
      const data = await sendChatMessageApi(trimmed, history)
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          text: data.reply,
          proposedAction: data.proposedAction,
          actionStatus: data.proposedAction ? 'pending' : undefined,
        },
      ])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo contactar al asistente.')
    } finally {
      setIsSending(false)
    }
  }

  const handleConfirm = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message?.proposedAction) return

    setConfirmingId(messageId)
    setError('')

    try {
      const data = await confirmChatActionApi(message.proposedAction)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, actionStatus: 'confirmed' } : m)),
      )
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: data.reply }])
      onActionConfirmed?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar la operación.')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleCancel = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, actionStatus: 'cancelled' } : m)),
    )
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'assistant', text: 'Listo, no hice ningún cambio.' },
    ])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button
        className="chat-ia-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
        {isOpen ? 'CERRAR' : 'CHAT IA'}
      </button>

      {isOpen && (
        <div className="chat-widget" role="dialog" aria-label="Asistente virtual de Axora">
          <div className="chat-widget-header">
            <span>Asistente Axora</span>
            <button className="chat-widget-close" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="chat-widget-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
                <p>{renderFormattedText(message.text)}</p>

                {message.proposedAction && message.actionStatus === 'pending' && (
                  <div className="chat-action-buttons">
                    <button
                      className="chat-btn chat-btn-confirm"
                      onClick={() => handleConfirm(message.id)}
                      disabled={confirmingId === message.id}
                    >
                      {confirmingId === message.id ? 'Confirmando…' : 'Confirmar'}
                    </button>
                    <button
                      className="chat-btn chat-btn-cancel"
                      onClick={() => handleCancel(message.id)}
                      disabled={confirmingId === message.id}
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {message.actionStatus === 'confirmed' && (
                  <span className="chat-action-status">✅ Confirmado</span>
                )}
                {message.actionStatus === 'cancelled' && (
                  <span className="chat-action-status">❌ Cancelado</span>
                )}
              </div>
            ))}

            {isSending && (
              <div className="chat-bubble chat-bubble-assistant chat-bubble-typing" aria-label="El asistente está escribiendo">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && <p className="chat-widget-error">{error}</p>}

          <div className="chat-widget-input-row">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu mensaje…"
              disabled={isSending}
              className="chat-widget-input"
            />
            <button
              className="chat-widget-send"
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              aria-label="Enviar mensaje"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}