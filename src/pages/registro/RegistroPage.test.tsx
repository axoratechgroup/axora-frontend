import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.tsx'
import RegistroPage from './RegistroPage.tsx'

function renderRegistro() {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <AuthProvider>
        <Routes>
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillValidRegistration(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'Ana')
  await user.type(screen.getByLabelText('Apellido'), 'López')
  await user.type(screen.getByLabelText('Usuario'), 'analopez')
  await user.type(screen.getByLabelText('Correo'), 'ana@axora.test')
  await user.type(screen.getByLabelText('Contraseña'), 'contraseña-segura')
}

afterEach(() => vi.unstubAllGlobals())

describe('RegistroPage', () => {
  it('avisa en vivo cuando la contraseña tiene menos de 8 caracteres', async () => {
    const user = userEvent.setup()
    renderRegistro()

    await user.type(screen.getByLabelText('Contraseña'), '1234567')

    expect(screen.getByText('Mínimo 8 caracteres (7/8)')).toBeInTheDocument()
  })

  it('envía los datos correctos y navega al dashboard al registrarse', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'token-registro', user: { first_name: 'Ana', username: 'analopez' } }),
    })
    vi.stubGlobal('fetch', fetchMock)
    renderRegistro()

    await fillValidRegistration(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          first_name: 'Ana',
          last_name: 'López',
          username: 'analopez',
          email: 'ana@axora.test',
          password: 'contraseña-segura',
        }),
      }),
    )
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('token-registro')
  })

  it('muestra el error de la API cuando el usuario ya existe', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'El correo ya está registrado.' }),
    }))
    renderRegistro()

    await fillValidRegistration(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado.')
    expect(localStorage.getItem('token')).toBeNull()
  })
})
