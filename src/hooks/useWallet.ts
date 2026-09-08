import { useWalletBalances } from './useWalletBalances.ts'
import { useTransactions } from './useTransactions.ts'

export function useWallet() {
  const balances = useWalletBalances()
  const txs = useTransactions()

  return {
    ...balances,
    ...txs,
  }
}
