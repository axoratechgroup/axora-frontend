import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import NotFoundPage from './NotFoundPage.tsx'

function renderNotFound(initialEntry = '/404') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<p>Página de inicio</p>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  it('muestra el código 404 y los mensajes correspondientes', () => {
    renderNotFound()

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Ups… este gatito no encontró la página.')).toBeInTheDocument()
    expect(screen.getByText('La página que buscás no existe.')).toBeInTheDocument()
  })

  it('muestra el enlace "Volver al inicio" apuntando a la ruta raíz "/"', () => {
    renderNotFound()

    const link = screen.getByRole('link', { name: 'Volver al inicio' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('renderiza NotFoundPage cuando se accede a una URL desconocida', () => {
    renderNotFound('/ruta-inexistente')

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Ups… este gatito no encontró la página.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument()
  })
})
