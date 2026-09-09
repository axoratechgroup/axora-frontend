import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog.tsx'

describe('ConfirmDialog', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="¿Estás seguro?"
        message="Mensaje de confirmación"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renderiza título, mensaje y botones cuando isOpen es true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="¿Seguro que quieres cerrar sesión?"
        message="Tendrás que ingresar tus credenciales nuevamente."
        confirmText="Cerrar sesión"
        cancelText="Permanecer conectado"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('¿Seguro que quieres cerrar sesión?')).toBeInTheDocument()
    expect(screen.getByText('Tendrás que ingresar tus credenciales nuevamente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Permanecer conectado' })).toBeInTheDocument()
  })

  it('llama a onConfirm cuando se presiona el botón de confirmación', async () => {
    const user = userEvent.setup()
    const handleConfirm = vi.fn()
    render(
      <ConfirmDialog
        isOpen={true}
        title="¿Confirmar acción?"
        message="Detalle de la acción"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it('llama a onCancel cuando se presiona el botón de cancelación', async () => {
    const user = userEvent.setup()
    const handleCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen={true}
        title="¿Confirmar acción?"
        message="Detalle de la acción"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it('llama a onCancel al presionar la tecla Escape', async () => {
    const user = userEvent.setup()
    const handleCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen={true}
        title="¿Confirmar acción?"
        message="Detalle de la acción"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />,
    )

    await user.keyboard('{Escape}')
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it('deshabilita los botones y muestra estado de carga cuando loading es true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="¿Confirmar acción?"
        message="Detalle de la acción"
        loading={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
