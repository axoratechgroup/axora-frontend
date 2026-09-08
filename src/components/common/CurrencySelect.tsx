import ReactCountryFlag from 'react-country-flag'
import { CURRENCY_NAMES, CURRENCY_TO_COUNTRY, getCountryCode } from '../../utils/currency.ts'
import './CurrencySelect.css'

export interface CurrencySelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  availableCurrencies?: string[]
  className?: string
  ariaLabel?: string
}

export function CurrencySelect({
  id,
  value,
  onChange,
  disabled = false,
  availableCurrencies = Object.keys(CURRENCY_TO_COUNTRY),
  className = '',
  ariaLabel,
}: CurrencySelectProps) {
  const countryCode = getCountryCode(value)
  const currencyName = CURRENCY_NAMES[value] ?? value

  return (
    <div className={`currency-select-row ${className}`.trim()}>
      {countryCode && (
        <ReactCountryFlag
          countryCode={countryCode}
          svg
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            flexShrink: 0,
          }}
          aria-label={currencyName}
        />
      )}
      <select
        id={id}
        className="form-input currency-select-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {availableCurrencies.map((code) => (
          <option key={code} value={code}>
            {code} — {CURRENCY_NAMES[code] ?? code}
          </option>
        ))}
      </select>
    </div>
  )
}
