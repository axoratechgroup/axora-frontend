import type { ChangeEvent } from 'react'
import {
  formatAmountInputDisplay,
  parseAmountInputDisplay,
} from '../../utils/formatters.ts'
import './AmountInput.css'

export interface AmountInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  hasError?: boolean
  className?: string
  ariaLabel?: string
  autoFocus?: boolean
}

export function AmountInput({
  id = 'amount',
  value,
  onChange,
  disabled = false,
  placeholder = '0,00',
  hasError = false,
  className = '',
  ariaLabel,
  autoFocus = false,
}: AmountInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseAmountInputDisplay(e.target.value)
    onChange(rawValue)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={`form-input amount-input ${hasError ? 'has-error' : ''} ${className}`.trim()}
      placeholder={placeholder}
      value={formatAmountInputDisplay(value)}
      onChange={handleChange}
      disabled={disabled}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
    />
  )
}
