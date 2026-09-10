import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { getWalletApi } from '../api/wallet.api.ts'
import type { WalletResponse } from '../types/wallet.ts'
import { FALLBACK_RATES_TO_USD } from '../utils/currency.ts'
import { subscribeWalletUpdate } from '../utils/syncEvents.ts'

export function useWalletBalances() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [walletError, setWalletError] = useState('')
  const [walletLoading, setWalletLoading] = useState(true)

  const inFlightRef = useRef<Promise<void> | null>(null)
  const lastFetchTimeRef = useRef<number>(0)

  const fetchWallet = useCallback(async (isSilent = false) => {
    const now = Date.now()
    if (isSilent && now - lastFetchTimeRef.current < 1000) {
      return
    }
    if (inFlightRef.current) {
      return inFlightRef.current
    }

    if (!isSilent) {
      setWalletLoading(true)
    }
    setWalletError('')

    const p = (async () => {
      try {
        const data = await getWalletApi()
        lastFetchTimeRef.current = Date.now()
        setWallet(data)
      } catch (err: unknown) {
        if (!isSilent) {
          setWalletError(err instanceof Error ? err.message : 'No se pudo cargar la wallet.')
        }
      } finally {
        if (!isSilent) {
          setWalletLoading(false)
        }
        inFlightRef.current = null
      }
    })()

    inFlightRef.current = p
    return p
  }, [])

  const reloadWallet = useCallback(() => fetchWallet(false), [fetchWallet])

  useEffect(() => {
    let isMounted = true

    // Carga inicial
    fetchWallet(false)

    // Sincronización reactiva por eventos y entre pestañas
    const unsubscribe = subscribeWalletUpdate(() => {
      if (isMounted) {
        fetchWallet(true)
      }
    })

    // Actualización periódica en primer plano (polling cada 10s)
    const intervalId = window.setInterval(() => {
      if (isMounted && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchWallet(true)
      }
    }, 10000)

    const handleFocusOrVisible = () => {
      if (isMounted && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchWallet(true)
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
  }, [fetchWallet])

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
