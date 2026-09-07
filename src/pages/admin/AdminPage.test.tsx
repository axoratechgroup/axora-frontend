import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPage from './AdminPage.tsx'

const mockGetAdminUsersApi = vi.fn()
const mockGetAdminTransactionsApi = vi.fn()
const mockUpdateUserRoleApi = vi.fn()

vi.mock('../../api/admin.api.ts', () => ({
  getAdminUsersApi: () => mockGetAdminUsersApi(),
  getAdminTransactionsApi: () => mockGetAdminTransactionsApi(),
  updateUserRoleApi: (userId: string, role: string) => mockUpdateUserRoleApi(userId, role),
}))

function renderAdminPage() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('muestra aviso de acceso restringido si el usuario no es admin', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'u1', username: 'camilo', role: 'user' }),
    )

    renderAdminPage()

    expect(screen.getByText('Acceso Restringido')).toBeInTheDocument()
    expect(
      screen.getByText(/reservada exclusivamente para cuentas con rol de/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Volver al Dashboard/i })).toBeInTheDocument()
  })

  it('renderiza métricas, usuarios y permite alternar a transacciones cuando es admin', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin1', username: 'adminaxora', role: 'admin' }),
    )

    mockGetAdminUsersApi.mockResolvedValueOnce([
      {
        id: 'usr-12345678-abcd',
        first_name: 'Camila',
        last_name: 'Gómez',
        username: 'camilag',
        email: 'camila@axora.test',
        role: 'user',
        created_at: '2026-09-04T12:00:00Z',
      },
      {
        id: 'usr-87654321-dcba',
        first_name: 'Mateo',
        last_name: 'Silva',
        username: 'mateos',
        email: 'mateo@axora.test',
        role: 'user',
        created_at: '2026-09-04T14:00:00Z',
      },
    ])

    mockGetAdminTransactionsApi.mockResolvedValueOnce([
      {
        id: 'tx-1',
        type: 'SWAP',
        status: 'COMPLETED',
        username: 'camilag',
        email: 'camila@axora.test',
        from_currency: 'USD',
        from_amount: '100',
        to_currency: 'EUR',
        to_amount: '91.72',
        applied_exchange_rate: '0.9200',
        description: 'Cambio de USD a EUR',
        created_at: '2026-09-04T13:00:00Z',
      },
    ])

    renderAdminPage()

    // Header y badge
    expect(await screen.findByText('Panel de Administración')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()

    // Métricas
    expect(screen.getByText('Usuarios Registrados')).toBeInTheDocument()
    expect(screen.getByText('Transacciones Globales')).toBeInTheDocument()

    // Usuarios en la tabla
    expect(await screen.findByText('@camilag')).toBeInTheDocument()
    expect(screen.getByText('Camila Gómez')).toBeInTheDocument()
    expect(screen.getByText('@mateos')).toBeInTheDocument()

    // Cambiar a la pestaña de transacciones
    const txTab = screen.getByRole('button', { name: /Transacciones \(1\)/i })
    await user.click(txTab)

    // Ver transacción
    expect(await screen.findByText('USD → EUR')).toBeInTheDocument()
    expect(screen.getByText('91,72 EUR')).toBeInTheDocument()
    expect(screen.getByText('0,92')).toBeInTheDocument()
  })

  it('permite filtrar usuarios mediante el buscador', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin1', username: 'adminaxora', role: 'admin' }),
    )

    mockGetAdminUsersApi.mockResolvedValueOnce([
      {
        id: 'u1',
        first_name: 'Camila',
        last_name: 'Gómez',
        username: 'camilag',
        email: 'camila@axora.test',
        role: 'user',
        created_at: '2026-09-04T12:00:00Z',
      },
      {
        id: 'u2',
        first_name: 'Mateo',
        last_name: 'Silva',
        username: 'mateos',
        email: 'mateo@axora.test',
        role: 'user',
        created_at: '2026-09-04T14:00:00Z',
      },
    ])
    mockGetAdminTransactionsApi.mockResolvedValueOnce([])

    renderAdminPage()

    expect(await screen.findByText('@camilag')).toBeInTheDocument()
    expect(screen.getByText('@mateos')).toBeInTheDocument()

    // Escribir en el buscador
    const searchInput = screen.getByPlaceholderText('Buscar por usuario o email…')
    await user.type(searchInput, 'mateo')

    await waitFor(() => {
      expect(screen.queryByText('@camilag')).not.toBeInTheDocument()
      expect(screen.getByText('@mateos')).toBeInTheDocument()
    })
  })

  it('permite promover a un usuario a administrador desde el selector de rol', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin1', username: 'adminaxora', role: 'admin' }),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    mockGetAdminUsersApi.mockResolvedValueOnce([
      {
        id: 'admin1',
        first_name: 'Admin',
        last_name: 'Axora',
        username: 'adminaxora',
        email: 'admin@axora.test',
        role: 'admin',
        created_at: '2026-09-04T12:00:00Z',
      },
      {
        id: 'u2',
        first_name: 'Mateo',
        last_name: 'Silva',
        username: 'mateos',
        email: 'mateo@axora.test',
        role: 'user',
        created_at: '2026-09-04T14:00:00Z',
      },
    ])
    mockGetAdminTransactionsApi.mockResolvedValueOnce([])
    mockUpdateUserRoleApi.mockResolvedValueOnce({
      id: 'u2',
      first_name: 'Mateo',
      last_name: 'Silva',
      username: 'mateos',
      email: 'mateo@axora.test',
      role: 'admin',
    })

    renderAdminPage()

    await screen.findByText('@mateos')

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    // El primero es el del admin logueado (deshabilitado); el segundo, el de Mateo.
    expect(selects[0]).toBeDisabled()
    expect(selects[1]).not.toBeDisabled()

    await user.selectOptions(selects[1], 'admin')

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockUpdateUserRoleApi).toHaveBeenCalledWith('u2', 'admin')
    })
    await waitFor(() => {
      expect(selects[1]).toHaveValue('admin')
    })
  })

  it('no llama a la API si se cancela la confirmación del cambio de rol', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin1', username: 'adminaxora', role: 'admin' }),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    mockGetAdminUsersApi.mockResolvedValueOnce([
      {
        id: 'u2',
        first_name: 'Mateo',
        last_name: 'Silva',
        username: 'mateos',
        email: 'mateo@axora.test',
        role: 'user',
        created_at: '2026-09-04T14:00:00Z',
      },
    ])
    mockGetAdminTransactionsApi.mockResolvedValueOnce([])

    renderAdminPage()

    await screen.findByText('@mateos')
    const select = screen.getByRole('combobox')

    await user.selectOptions(select, 'admin')

    expect(window.confirm).toHaveBeenCalled()
    expect(mockUpdateUserRoleApi).not.toHaveBeenCalled()
  })
})
