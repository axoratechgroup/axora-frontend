import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.tsx'
import LoginPage from './LoginPage.tsx'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('LoginPage', () => {
  it('muestra una validación si se envía vacío y no llama a la API', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderLogin()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Por favor completa todos los campos.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('guarda sesión y navega al dashboard cuando la API responde correctamente', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'token-prueba', user: { first_name: 'Ana' } }),
    }))
    renderLogin()

    await user.type(screen.getByLabelText('Correo o usuario'), 'ana@axora.test')
    await user.type(screen.getByLabelText('Contraseña'), 'contraseña-segura')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('token-prueba')
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual({ first_name: 'Ana' })
  })

  it('muestra el mensaje recibido cuando el login falla', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Credenciales inválidas.' }),
    }))
    renderLogin()

    await user.type(screen.getByLabelText('Correo o usuario'), 'ana@axora.test')
    await user.type(screen.getByLabelText('Contraseña'), 'contraseña-incorrecta')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas.')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('alterna la visibilidad de la contraseña entre password y text', async () => {
    const user = userEvent.setup()
    renderLogin()

    const passwordInput = screen.getByLabelText('Contraseña')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByRole('button', { name: 'Mostrar contraseña' })
    await user.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument()
  })
})

