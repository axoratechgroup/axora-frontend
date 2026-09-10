import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'react-toastify'
import { ThemeProvider } from '../../context/ThemeContext.tsx'
import ConfiguracionPage from './ConfiguracionPage.tsx'

function renderConfiguracion(role = 'user') {
  localStorage.setItem(
    'user',
    JSON.stringify({
      first_name: 'Ana',
      last_name: 'López',
      username: 'analopez',
      email: 'ana@axora.test',
      role,
    }),
  )

  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/configuracion']}>
        <Routes>
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
          <Route path="/admin" element={<p>Admin Mock</p>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('ConfiguracionPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('muestra la información del perfil del usuario correctamente', () => {
    renderConfiguracion()

    expect(screen.getByText(/Configuración de la cuenta/i)).toBeInTheDocument()
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getAllByText('@analopez').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('ana@axora.test')).toBeInTheDocument()
    expect(screen.getByText('Usuario estándar')).toBeInTheDocument()
    expect(screen.getByText(/Activa y verificada/i)).toBeInTheDocument()
  })

  it('permite alternar el tema visual entre oscuro y claro', async () => {
    const toastSpy = vi.spyOn(toast, 'info')
    const user = userEvent.setup()
    renderConfiguracion()

    const themeButton = screen.getByRole('button', { name: /Alternar tema visual/i })
    expect(themeButton).toHaveTextContent(/Modo oscuro/i)

    await user.click(themeButton)
    expect(themeButton).toHaveTextContent(/Modo claro/i)
    expect(localStorage.getItem('theme')).toBe('light')
    expect(toastSpy).toHaveBeenCalledWith(
      'Modo claro activado',
      expect.objectContaining({ theme: 'light' }),
    )

    await user.click(themeButton)
    expect(themeButton).toHaveTextContent(/Modo oscuro/i)
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(toastSpy).toHaveBeenCalledWith(
      'Modo oscuro activado',
      expect.objectContaining({ theme: 'dark' }),
    )

    toastSpy.mockRestore()
  })

  it('navega al dashboard al presionar el botón de volver para usuario estándar', async () => {
    const user = userEvent.setup()
    renderConfiguracion('user')

    await user.click(screen.getByRole('button', { name: /Volver al panel principal/i }))
    expect(await screen.findByText('Dashboard Mock')).toBeInTheDocument()
  })

  it('muestra sección de administración y navega a /admin al presionar volver para administrador', async () => {
    const user = userEvent.setup()
    renderConfiguracion('admin')

    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Herramientas de Administración')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abrir panel admin/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Volver al panel principal/i }))
    expect(await screen.findByText('Admin Mock')).toBeInTheDocument()
  })
})
