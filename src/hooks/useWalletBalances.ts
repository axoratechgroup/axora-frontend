import { useEffect, useState, useCallback, useMemo } from 'react'
import { getWalletApi } from '../api/wallet.api.ts'
import type { WalletResponse } from '../types/wallet.ts'
import { FALLBACK_RATES_TO_USD } from '../utils/currency.ts'

export function useWalletBalances() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [walletError, setWalletError] = useState('')
  const [walletLoading, setWalletLoading] = useState(true)

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

    return () => {
      isMounted = false
    }
  }, [])

  const totalInUsd = useMemo(() => {
    if (typeof wallet?.total_in_usd === 'number' && wallet.total_in_usd > 0) {
      return wallet.total_in_usd
    }

    if (!wallet || !wallet.balances || wallet.balances.length === 0) {
      return 0
    }

    const hasPositiveBalance = wallet.balances.some((b) => Number(b.amount) > 0)
    if (!hasPositiveBalance) {
      return 0
    }

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
    reloadWallet,
  }
}
