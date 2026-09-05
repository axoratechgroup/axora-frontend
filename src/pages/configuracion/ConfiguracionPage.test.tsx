import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import ConfiguracionPage from './ConfiguracionPage.tsx'

function renderConfiguracion() {
  localStorage.setItem(
    'user',
    JSON.stringify({
      first_name: 'Ana',
      last_name: 'López',
      username: 'analopez',
      email: 'ana@axora.test',
      role: 'user',
    }),
  )

  return render(
    <MemoryRouter initialEntries={['/configuracion']}>
      <Routes>
        <Route path="/configuracion" element={<ConfiguracionPage />} />
        <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
      </Routes>
    </MemoryRouter>,
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
    const user = userEvent.setup()
    renderConfiguracion()

    const themeButton = screen.getByRole('button', { name: /Alternar tema visual/i })
    expect(themeButton).toHaveTextContent(/Modo oscuro/i)

    await user.click(themeButton)
    expect(themeButton).toHaveTextContent(/Modo claro/i)
    expect(localStorage.getItem('theme')).toBe('light')

    await user.click(themeButton)
    expect(themeButton).toHaveTextContent(/Modo oscuro/i)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('navega al dashboard al presionar el botón de volver', async () => {
    const user = userEvent.setup()
    renderConfiguracion()

    await user.click(screen.getByRole('button', { name: /Volver al panel principal/i }))
    expect(await screen.findByText('Dashboard Mock')).toBeInTheDocument()
  })
})
