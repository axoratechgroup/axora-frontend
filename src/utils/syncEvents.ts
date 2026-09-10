/**
 * Event-driven and cross-tab synchronization mechanism for AXORA.
 * Allows instant, real-time reflection of balances and transactions
 * across pages, components, and open browser tabs without requiring a manual page reload.
 */

const SYNC_EVENT_NAME = 'axora:wallet-sync'
const CHANNEL_NAME = 'axora_wallet_channel'

let broadcastChannel: BroadcastChannel | null = null

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
  }
} catch {
  // BroadcastChannel might be blocked in restricted iframe environments
  broadcastChannel = null
}

export function notifyWalletUpdate(): void {
  if (typeof window === 'undefined') return

  // 1. Dispatch custom event within current window/tab
  try {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { timestamp: Date.now() } }))
  } catch {
    // ignore
  }

  // 2. Broadcast to other open tabs in the same origin
  try {
    broadcastChannel?.postMessage({ type: 'SYNC', timestamp: Date.now() })
  } catch {
    // ignore
  }
}

export function subscribeWalletUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleWindowSync = () => {
    callback()
  }

  const handleChannelMessage = (event: MessageEvent) => {
    if (event.data?.type === 'SYNC') {
      callback()
    }
  }

  window.addEventListener(SYNC_EVENT_NAME, handleWindowSync)
  broadcastChannel?.addEventListener('message', handleChannelMessage)

  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, handleWindowSync)
    broadcastChannel?.removeEventListener('message', handleChannelMessage)
  }
}
