export type RateHistoryRange = '7d' | '30d' | '90d'

export interface RateHistoryPoint {
  date: string
  rate: number
}

export interface RateHistoryResponse {
  base: string
  quote: string
  range: RateHistoryRange
  points: RateHistoryPoint[]
  source: string
}
