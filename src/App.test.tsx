import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

vi.mock('./hooks/useAuth.ts', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    isAuthenticated: false,
    setAuthenticated: vi.fn(),
    validateSession: vi.fn(),
  }),
}))

describe('App Landing & CurrencySimulator', () => {
  it('renderiza el simulador y calcula pares cruzados como EUR -> MXN sin devolver 1:1', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    // El widget del simulador está presente
    expect(screen.getByLabelText('Simulador de cambio')).toBeInTheDocument()

    // Cambiar origen a EUR y destino a MXN
    const fromSelect = screen.getByLabelText('Moneda origen')
    const toSelect = screen.getByLabelText('Moneda destino')

    await user.selectOptions(fromSelect, 'EUR')
    await user.selectOptions(toSelect, 'MXN')

    const resultInput = screen.getByLabelText('Monto aproximado que recibe') as HTMLInputElement
    // Con 100 EUR a tasa ~21.17 MXN, debe ser > 2000, definitivamente no "100,00"
    expect(resultInput.value).not.toBe('100,00')
    const numericValue = parseFloat(resultInput.value.replace('.', '').replace(',', '.'))
    expect(numericValue).toBeGreaterThan(2000)
  })
})
