import { useEffect, useState, useCallback, useMemo } from 'react'
import { getWalletApi, getWalletTransactionsApi } from '../api/wallet.api.ts'
import type { WalletResponse, Transaction } from '../types/wallet.ts'

const FALLBACK_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  ARS: 0.00075,
  COP: 0.00025,
  MXN: 0.051,
  BRL: 0.17,
}

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
    // 1. Si el backend ya devolvió total_in_usd (> 0), lo usamos de forma oficial
    if (typeof wallet?.total_in_usd === 'number' && wallet.total_in_usd > 0) {
      return wallet.total_in_usd
    }

    if (!wallet || !wallet.balances || wallet.balances.length === 0) {
      return 0
    }

    // 2. Si todos los balances son 0 o negativos, el total es efectivamente 0
    const hasPositiveBalance = wallet.balances.some((b) => Number(b.amount) > 0)
    if (!hasPositiveBalance) {
      return 0
    }

    // 3. Resiliencia: si el backend no incluye total_in_usd (versión previa no redesplegada)
    // o hubo fallo temporal en la consulta de cotizaciones, calculamos con tasas de referencia:
    const calculated = wallet.balances.reduce((acc, b) => {
      const amount = Number(b.amount) || 0
      if (amount <= 0) return acc
      const rate = FALLBACK_RATES_TO_USD[b.currency] ?? (b.currency === 'USD' ? 1 : 0)
      return acc + amount * rate
    }, 0)

    return Math.round(calculated * 100) / 100
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
