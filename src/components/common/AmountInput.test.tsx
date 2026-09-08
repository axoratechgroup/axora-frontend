import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AmountInput } from './AmountInput.tsx'

describe('AmountInput', () => {
  it('formats display value according to locale conventions and parses user input', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <AmountInput
        id="test-amount"
        value="1000.50"
        onChange={handleChange}
        ariaLabel="Monto de prueba"
      />
    )

    const input = screen.getByLabelText('Monto de prueba') as HTMLInputElement
    expect(input.value).toBe('1.000,50')

    await user.clear(input)
    await user.type(input, '250')
    expect(handleChange).toHaveBeenCalled()
  })

  it('shows error styling when hasError is true', () => {
    render(
      <AmountInput
        id="test-error"
        value=""
        onChange={vi.fn()}
        hasError={true}
        ariaLabel="Monto con error"
      />
    )

    const input = screen.getByLabelText('Monto con error')
    expect(input.className).toContain('has-error')
  })
})
