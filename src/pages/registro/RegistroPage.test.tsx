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
  await user.type(screen.getByLabelText(/^Contraseña$/), 'contraseña-segura')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'contraseña-segura')
}

afterEach(() => vi.unstubAllGlobals())

describe('RegistroPage', () => {
  it('avisa en vivo cuando la contraseña tiene menos de 8 caracteres', async () => {
    const user = userEvent.setup()
    renderRegistro()

    await user.type(screen.getByLabelText(/^Contraseña$/), '1234567')

    expect(screen.getByText('Mínimo 8 caracteres (7/8)')).toBeInTheDocument()
  })

  it('alterna la visibilidad de los campos contraseña y confirmar contraseña', async () => {
    const user = userEvent.setup()
    renderRegistro()

    const passwordInput = screen.getByLabelText(/^Contraseña$/)
    const confirmInput = screen.getByLabelText('Confirmar contraseña')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmInput).toHaveAttribute('type', 'password')

    const toggleBtns = screen.getAllByRole('button', { name: 'Mostrar contraseña' })
    expect(toggleBtns).toHaveLength(2)

    // Toggle password
    await user.click(toggleBtns[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(confirmInput).toHaveAttribute('type', 'password')

    // Toggle confirm password
    await user.click(toggleBtns[1])
    expect(confirmInput).toHaveAttribute('type', 'text')

    // Toggle password back to hidden
    const hideBtns = screen.getAllByRole('button', { name: 'Ocultar contraseña' })
    await user.click(hideBtns[0])
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('muestra aviso en vivo si las contraseñas no coinciden y bloquea el envío sin llamar a la API', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderRegistro()

    await user.type(screen.getByLabelText('Nombre'), 'Ana')
    await user.type(screen.getByLabelText('Apellido'), 'López')
    await user.type(screen.getByLabelText('Usuario'), 'analopez')
    await user.type(screen.getByLabelText('Correo'), 'ana@axora.test')
    await user.type(screen.getByLabelText(/^Contraseña$/), 'contraseña-123')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'contraseña-diferente')

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envía los datos correctos sin confirmPassword y navega al dashboard al registrarse con contraseñas coincidentes', async () => {
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
