import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CurrencySelect } from './CurrencySelect.tsx'

describe('CurrencySelect', () => {
  it('renders with initial currency and triggers onChange', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <CurrencySelect
        id="test-currency"
        value="USD"
        onChange={handleChange}
        ariaLabel="Moneda seleccionada"
      />
    )

    const select = screen.getByLabelText('Moneda seleccionada') as HTMLSelectElement
    expect(select.value).toBe('USD')

    await user.selectOptions(select, 'EUR')
    expect(handleChange).toHaveBeenCalledWith('EUR')
  })

  it('respects disabled state', () => {
    render(
      <CurrencySelect
        id="test-currency-disabled"
        value="USD"
        onChange={vi.fn()}
        disabled={true}
        ariaLabel="Moneda deshabilitada"
      />
    )

    const select = screen.getByLabelText('Moneda deshabilitada') as HTMLSelectElement
    expect(select).toBeDisabled()
  })
})
