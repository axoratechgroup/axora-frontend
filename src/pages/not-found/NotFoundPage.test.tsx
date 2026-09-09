import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.tsx'
import NotFoundPage from './NotFoundPage.tsx'

function renderNotFound(initialEntry = '/404') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>Página de inicio</p>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('muestra el código 404 y los mensajes correspondientes', () => {
    renderNotFound()

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Ups… este gatito no encontró la página.')).toBeInTheDocument()
    expect(screen.getByText('La página que buscas no existe.')).toBeInTheDocument()
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

  it('muestra enlace "Volver al dashboard" apuntando a "/dashboard" para usuario estándar autenticado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })),
    )
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('user', JSON.stringify({ username: 'user1', role: 'user' }))

    renderNotFound()

    const link = await screen.findByRole('link', { name: 'Volver al dashboard' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard')
  })

  it('muestra enlace "Volver al panel" apuntando a "/admin" para administrador autenticado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })),
    )
    localStorage.setItem('token', 'fake-admin-token')
    localStorage.setItem('user', JSON.stringify({ username: 'admin1', role: 'admin' }))

    renderNotFound()

    const link = await screen.findByRole('link', { name: 'Volver al panel' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/admin')
  })
})
