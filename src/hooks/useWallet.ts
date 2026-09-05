import { useEffect, useState, useCallback, useMemo } from 'react'
import { getWalletApi, getWalletTransactionsApi } from '../api/wallet.api.ts'
import type { WalletResponse, Transaction } from '../types/wallet.ts'

export function useWallet() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [walletError, setWalletError] = useState('')
  const [walletLoading, setWalletLoading] = useState(true)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsError, setTransactionsError] = useState('')
  const [transactionsLoading, setTransactionsLoading] = useState(true)

  const reloadWallet = useCallback(async () => {
    setWalletLoading(true)
    setWalletError('')
    try {
      const data = await getWalletApi()
      setWallet(data)
    } catch (err: unknown) {
      setWalletError(err instanceof Error ? err.message : 'No se pudo cargar la wallet.')
    } finally {
      setWalletLoading(false)
    }
  }, [])

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

    getWalletApi()
      .then((data) => {
        if (!isMounted) return
        setWallet(data)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setWalletError(err instanceof Error ? err.message : 'No se pudo cargar la wallet.')
      })
      .finally(() => {
        if (!isMounted) return
        setWalletLoading(false)
      })

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

  const totalInUsd = useMemo(() => {
    return wallet?.total_in_usd ?? 0
  }, [wallet])

  const totalBalance = totalInUsd

  return {
    wallet,
    totalBalance,
    totalInUsd,
    walletLoading,
    walletError,
    transactions,
    transactionsLoading,
    transactionsError,
    reloadWallet,
    reloadTransactions,
  }
}
