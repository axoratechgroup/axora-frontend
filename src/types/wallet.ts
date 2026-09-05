export interface Balance {
  currency: string
  currency_name: string
  symbol: string
  amount: string
  updated_at: string
}

export interface WalletResponse {
  wallet_id: string
  created_at: string
  balances: Balance[]
}

export interface Transaction {
  id: string
  type: string
  status: string
  wallet_id: string
  destination_wallet_id: string | null
  direction: 'sent' | 'received'
  counterparty_username: string | null
  from_currency: string | null
  from_amount: string | null
  to_currency: string
  to_amount: string
  applied_exchange_rate: string | null
  description: string | null
  created_at: string
}

export interface TransactionsResponse {
  transactions: Transaction[]
}
