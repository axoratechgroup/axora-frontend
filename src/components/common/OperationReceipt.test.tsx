import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OperationReceipt } from './OperationReceipt.tsx'

describe('OperationReceipt', () => {
  it('renders operation receipt with reference id and executes actions', async () => {
    const user = userEvent.setup()
    const handlePrimary = vi.fn()
    const handleSecondary = vi.fn()

    render(
      <OperationReceipt
        title="¡Operación completada!"
        subtitle="Tu transacción se procesó con éxito."
        referenceId="tx-receipt-999"
        items={[
          { label: 'Entregado', value: '50 USD' },
          { label: 'Recibido', value: '52.500 ARS', isHighlight: true },
        ]}
        onPrimaryAction={handlePrimary}
        primaryActionText="Ir al inicio"
        onSecondaryAction={handleSecondary}
        secondaryActionText="Otra operación"
      />
    )

    expect(screen.getByText('¡Operación completada!')).toBeInTheDocument()
    expect(screen.getByText('Tu transacción se procesó con éxito.')).toBeInTheDocument()
    expect(screen.getByText('tx-receipt-999')).toBeInTheDocument()
    expect(screen.getByText('50 USD')).toBeInTheDocument()
    expect(screen.getByText('52.500 ARS')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ir al inicio' }))
    expect(handlePrimary).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Otra operación' }))
    expect(handleSecondary).toHaveBeenCalledTimes(1)
  })
})
