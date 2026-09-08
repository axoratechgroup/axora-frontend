import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OperationConfirmModal } from './OperationConfirmModal.tsx'

describe('OperationConfirmModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <OperationConfirmModal
        isOpen={false}
        title="Confirmar modal"
        items={[]}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText('Confirmar modal')).not.toBeInTheDocument()
  })

  it('renders title, items, and triggers callbacks', async () => {
    const user = userEvent.setup()
    const handleConfirm = vi.fn()
    const handleClose = vi.fn()

    render(
      <OperationConfirmModal
        isOpen={true}
        title="Confirmar operación"
        subtitle="Verifica antes de continuar"
        items={[
          { label: 'Destinatario', value: '@juan' },
          { label: 'Total', value: '100 USD', isHighlight: true },
        ]}
        confirmText="Aceptar"
        cancelText="Volver"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    )

    expect(screen.getByText('Confirmar operación')).toBeInTheDocument();
    expect(screen.getByText('Verifica antes de continuar')).toBeInTheDocument();
    expect(screen.getByText('@juan')).toBeInTheDocument();
    expect(screen.getByText('100 USD')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Aceptar' }))
    expect(handleConfirm).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
