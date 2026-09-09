import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge } from './StatusBadge.tsx'

describe('StatusBadge', () => {
  it('renders completed status correctly with accessible role and label', () => {
    render(<StatusBadge status="COMPLETED" />)
    const badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Completada')
    expect(badge).toHaveAttribute('aria-label', 'Estado: Completada')
  })

  it('renders pending status correctly', () => {
    render(<StatusBadge status="PENDING" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders failed status correctly', () => {
    render(<StatusBadge status="FAILED" />)
    expect(screen.getByText('Fallida')).toBeInTheDocument()
  })

  it('renders cancelled status correctly', () => {
    render(<StatusBadge status="CANCELLED" />)
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })
})
