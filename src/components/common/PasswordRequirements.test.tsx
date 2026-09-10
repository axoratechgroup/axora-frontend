import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PasswordRequirements } from './PasswordRequirements.tsx'

describe('PasswordRequirements', () => {
  it('no muestra nada si la contraseña está vacía y showAlways es false', () => {
    const { container } = render(<PasswordRequirements password="" />)
    expect(container.firstChild).toBeNull()
  })

  it('muestra la lista si showAlways es true con contraseña vacía', () => {
    render(<PasswordRequirements password="" showAlways />)
    expect(screen.getByRole('list', { name: 'Requisitos de contraseña' })).toBeInTheDocument()
    expect(screen.getByText('Mínimo 8 caracteres (0/8)')).toBeInTheDocument()
  })

  it('actualiza el estado de las reglas en vivo', () => {
    const { rerender } = render(<PasswordRequirements password="abc" />)
    expect(screen.getByText('Mínimo 8 caracteres (3/8)')).toBeInTheDocument()

    // Minuscula cumplida, las demás no
    const lowerItem = screen.getByLabelText('Al menos una minúscula (a-z): cumplido')
    expect(lowerItem).toBeInTheDocument()
    expect(lowerItem).toHaveClass('is-met')

    const upperItem = screen.getByLabelText('Al menos una mayúscula (A-Z): pendiente')
    expect(upperItem).toBeInTheDocument()
    expect(upperItem).toHaveClass('is-unmet')

    // Ahora con mayúscula y número
    rerender(<PasswordRequirements password="Abc12345!" />)
    expect(screen.getByLabelText('Mínimo 8 caracteres (9/8): cumplido')).toHaveClass('is-met')
    expect(screen.getByLabelText('Al menos una mayúscula (A-Z): cumplido')).toHaveClass('is-met')
    expect(screen.getByLabelText('Al menos una minúscula (a-z): cumplido')).toHaveClass('is-met')
    expect(screen.getByLabelText('Al menos un número (0-9): cumplido')).toHaveClass('is-met')
    expect(screen.getByLabelText('Al menos un carácter especial (!@#$...): cumplido')).toHaveClass('is-met')
  })
})
