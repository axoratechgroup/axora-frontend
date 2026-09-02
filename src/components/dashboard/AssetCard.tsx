import ReactCountryFlag from 'react-country-flag'
import type { Balance } from '../../types/wallet.ts'
import { getCountryCode } from '../../utils/currency.ts'
import { formatAmount } from '../../utils/formatters.ts'

interface AssetCardProps {
  balance: Balance
  showBalance: boolean
}

export function AssetCard({ balance, showBalance }: AssetCardProps) {
  const countryCode = getCountryCode(balance.currency)

  return (
    <div className="asset-card">
      <div className="asset-icon">
        {countryCode ? (
          <ReactCountryFlag
            countryCode={countryCode}
            svg
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
            aria-label={balance.currency_name}
          />
        ) : (
          <span className="asset-fallback-code">{balance.currency.slice(0, 3)}</span>
        )}
      </div>
      <div className="asset-info">
        <span className="asset-name">{balance.currency_name}</span>
        <span className="asset-code">{balance.currency}</span>
      </div>
      <div className="asset-amount">
        {showBalance ? `${formatAmount(balance.amount)} ${balance.currency}` : '••••'}
      </div>
    </div>
  )
}
