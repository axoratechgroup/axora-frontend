import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../api/wallet.api.ts', () => ({
  getWalletApi: vi.fn(),
}))

import { getWalletApi } from '../api/wallet.api.ts'
import { useWalletBalances } from './useWalletBalances.ts'

const getWalletApiMock = vi.mocked(getWalletApi)

describe('useWalletBalances', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches wallet balances and calculates total USD', async () => {
    getWalletApiMock.mockResolvedValueOnce({
      wallet_id: 'w-test-1',
      created_at: '2026-01-01',
      total_in_usd: 1500.5,
      balances: [
        { currency: 'USD', currency_name: 'Dólar', symbol: '$', amount: '1000.00', updated_at: '' },
      ],
    })

    const { result } = renderHook(() => useWalletBalances())

    expect(result.current.walletLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.walletLoading).toBe(false)
    })

    expect(result.current.wallet?.wallet_id).toBe('w-test-1')
    expect(result.current.totalInUsd).toBe(1500.5)
    expect(result.current.walletError).toBe('')
  })

  it('handles error on wallet load failure', async () => {
    getWalletApiMock.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useWalletBalances())

    await waitFor(() => {
      expect(result.current.walletLoading).toBe(false)
    })

    expect(result.current.walletError).toBe('Network error')
  })
})
