import { useEffect, useState, useCallback, useRef } from 'react'
import { getWalletTransactionsApi } from '../api/wallet.api.ts'
import type { Transaction } from '../types/wallet.ts'
import { subscribeWalletUpdate } from '../utils/syncEvents.ts'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsError, setTransactionsError] = useState('')
  const [transactionsLoading, setTransactionsLoading] = useState(true)

  const inFlightRef = useRef<Promise<void> | null>(null)
  const lastFetchTimeRef = useRef<number>(0)

  const fetchTransactions = useCallback(async (isSilent = false) => {
    const now = Date.now()
    if (isSilent && now - lastFetchTimeRef.current < 1000) {
      return
    }
    if (inFlightRef.current) {
      return inFlightRef.current
    }

    if (!isSilent) {
      setTransactionsLoading(true)
    }
    setTransactionsError('')

    const p = (async () => {
      try {
        const txs = await getWalletTransactionsApi()
        lastFetchTimeRef.current = Date.now()
        setTransactions(txs)
      } catch (err: unknown) {
        if (!isSilent) {
          setTransactionsError(err instanceof Error ? err.message : 'No se pudieron cargar las transacciones.')
        }
      } finally {
        if (!isSilent) {
          setTransactionsLoading(false)
        }
        inFlightRef.current = null
      }
    })()

    inFlightRef.current = p
    return p
  }, [])

  const reloadTransactions = useCallback(() => fetchTransactions(false), [fetchTransactions])

  useEffect(() => {
    let isMounted = true

    fetchTransactions(false)

    const unsubscribe = subscribeWalletUpdate(() => {
      if (isMounted) {
        fetchTransactions(true)
      }
    })

    const intervalId = window.setInterval(() => {
      if (isMounted && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchTransactions(true)
      }
    }, 10000)

    const handleFocusOrVisible = () => {
      if (isMounted && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchTransactions(true)
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleFocusOrVisible)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocusOrVisible)
    }

    return () => {
      isMounted = false
      unsubscribe()
      window.clearInterval(intervalId)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleFocusOrVisible)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusOrVisible)
      }
    }
  }, [fetchTransactions])

  return {
    transactions,
    transactionsLoading,
    transactionsError,
    reloadTransactions,
  }
}
