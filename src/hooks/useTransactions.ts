import { useEffect, useState, useCallback } from 'react'
import { getWalletTransactionsApi } from '../api/wallet.api.ts'
import type { Transaction } from '../types/wallet.ts'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsError, setTransactionsError] = useState('')
  const [transactionsLoading, setTransactionsLoading] = useState(true)

  const reloadTransactions = useCallback(async () => {
    setTransactionsLoading(true)
    setTransactionsError('')
    try {
      const txs = await getWalletTransactionsApi()
      setTransactions(txs)
    } catch (err: unknown) {
      setTransactionsError(err instanceof Error ? err.message : 'No se pudieron cargar las transacciones.')
    } finally {
      setTransactionsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    getWalletTransactionsApi()
      .then((txs) => {
        if (!isMounted) return
        setTransactions(txs)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setTransactionsError(err instanceof Error ? err.message : 'No se pudieron cargar las transacciones.')
      })
      .finally(() => {
        if (!isMounted) return
        setTransactionsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return {
    transactions,
    transactionsLoading,
    transactionsError,
    reloadTransactions,
  }
}
