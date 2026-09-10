import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PageLoader } from './PageLoader.tsx'

describe('PageLoader', () => {
  it('renders default loading message and role="status"', () => {
    render(
      <MemoryRouter>
        <PageLoader />
      </MemoryRouter>
    )

    const statusEl = screen.getByRole('status')
    expect(statusEl).toBeInTheDocument()
    expect(screen.getByText('Cargando Axora…')).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(
      <MemoryRouter>
        <PageLoader message="Cargando panel de administración…" />
      </MemoryRouter>
    )

    expect(screen.getByText('Cargando panel de administración…')).toBeInTheDocument()
  })
})
