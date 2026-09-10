import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../api/wallet.api.ts', () => ({
  getWalletTransactionsApi: vi.fn(),
}))

import { getWalletTransactionsApi } from '../api/wallet.api.ts'
import { useTransactions } from './useTransactions.ts'
import { notifyWalletUpdate } from '../utils/syncEvents.ts'

const getWalletTransactionsApiMock = vi.mocked(getWalletTransactionsApi)

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches transactions on mount', async () => {
    getWalletTransactionsApiMock.mockResolvedValueOnce([
      {
        id: 'tx-100',
        type: 'TOP_UP',
        status: 'COMPLETED',
        wallet_id: 'w-1',
        destination_wallet_id: null,
        direction: 'received',
        counterparty_username: null,
        from_currency: null,
        from_amount: null,
        to_currency: 'USD',
        to_amount: '100',
        applied_exchange_rate: null,
        description: null,
        created_at: '2026-01-01',
      },
    ])

    const { result } = renderHook(() => useTransactions())

    expect(result.current.transactionsLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.transactionsLoading).toBe(false)
    })

    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0].id).toBe('tx-100')
    expect(result.current.transactionsError).toBe('')
  })

  it('handles error on transactions failure', async () => {
    getWalletTransactionsApiMock.mockRejectedValueOnce(new Error('Tx error'))

    const { result } = renderHook(() => useTransactions())

    await waitFor(() => {
      expect(result.current.transactionsLoading).toBe(false)
    })

    expect(result.current.transactionsError).toBe('Tx error')
  })

  it('updates transactions in real-time when notifyWalletUpdate is fired', async () => {
    getWalletTransactionsApiMock.mockResolvedValueOnce([])
    const { result } = renderHook(() => useTransactions())

    await waitFor(() => {
      expect(result.current.transactionsLoading).toBe(false)
    })
    expect(result.current.transactions).toHaveLength(0)

    getWalletTransactionsApiMock.mockResolvedValueOnce([
      {
        id: 'tx-200',
        type: 'TRANSFER',
        status: 'COMPLETED',
        wallet_id: 'w-1',
        destination_wallet_id: null,
        direction: 'received',
        counterparty_username: 'carlos',
        from_currency: null,
        from_amount: null,
        to_currency: 'USD',
        to_amount: '50',
        applied_exchange_rate: null,
        description: 'Pago almuerzo',
        created_at: '2026-01-02',
      },
    ])

    await new Promise((r) => setTimeout(r, 1050))
    act(() => {
      notifyWalletUpdate()
    })

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1)
    })
    expect(result.current.transactions[0].id).toBe('tx-200')
  })
})
