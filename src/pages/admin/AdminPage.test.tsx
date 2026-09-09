import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.tsx'
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
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
          <Route path="/login" element={<p>Login Mock</p>} />
          <Route path="/configuracion" element={<p>Configuracion Mock</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
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
      {
        id: 'tx-2',
        type: 'TRANSFER',
        status: 'COMPLETED',
        username: 'camilag',
        email: 'camila@axora.test',
        from_currency: 'USD',
        from_amount: '50',
        to_currency: 'USD',
        to_amount: '50',
        applied_exchange_rate: null,
        recipient_username: 'mateos',
        description: 'Cena del viaje',
        created_at: '2026-09-04T14:00:00Z',
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
    const txTab = screen.getByRole('button', { name: /Transacciones \(2\)/i })
    await user.click(txTab)

    // Ver transacción
    expect(await screen.findByText('USD → EUR')).toBeInTheDocument()
    expect(screen.getByText('91,72 EUR')).toBeInTheDocument()
    expect(screen.getByText('0,92')).toBeInTheDocument()
    expect(screen.getByText('@camilag → @mateos')).toBeInTheDocument()
    expect(screen.getByText('Cena del viaje')).toBeInTheDocument()
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

  it('permite limpiar el buscador con el botón X y restaurar la lista', async () => {
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

    const searchInput = screen.getByPlaceholderText('Buscar por usuario o email…')
    await user.type(searchInput, 'mateo')

    expect(screen.queryByText('@camilag')).not.toBeInTheDocument()

    // Botón de limpiar búsqueda
    const clearBtn = screen.getByRole('button', { name: /Limpiar búsqueda/i })
    expect(clearBtn).toBeInTheDocument()

    await user.click(clearBtn)

    expect(searchInput).toHaveValue('')
    await waitFor(() => {
      expect(screen.getByText('@camilag')).toBeInTheDocument()
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

    expect(screen.getByText('¿Seguro que quieres promover a administrador a @mateos?')).toBeInTheDocument()
    await user.click(screen.getByTestId('confirm-dialog-confirm'))
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

    expect(screen.getByText('¿Seguro que quieres promover a administrador a @mateos?')).toBeInTheDocument()
    await user.click(screen.getByTestId('confirm-dialog-cancel'))
    expect(mockUpdateUserRoleApi).not.toHaveBeenCalled()
  })

  it('permite cerrar sesión desde el encabezado administrativo tras confirmar', async () => {
    const user = userEvent.setup()
    localStorage.setItem('token', 'fake-admin-token')
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin1', username: 'adminaxora', role: 'admin' }),
    )
    mockGetAdminUsersApi.mockResolvedValueOnce([])
    mockGetAdminTransactionsApi.mockResolvedValueOnce([])

    renderAdminPage()

    const logoutBtn = await screen.findByRole('button', { name: /Cerrar Sesión/i })
    await user.click(logoutBtn)

    expect(screen.getByText(/Tendrás que volver a ingresar tus credenciales/i)).toBeInTheDocument()
    await user.click(screen.getByTestId('confirm-dialog-confirm'))

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(await screen.findByText('Login Mock')).toBeInTheDocument()
  })

  it('permite navegar a configuración desde el encabezado administrativo', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin1', username: 'adminaxora', role: 'admin' }),
    )
    mockGetAdminUsersApi.mockResolvedValueOnce([])
    mockGetAdminTransactionsApi.mockResolvedValueOnce([])

    renderAdminPage()

    const configBtn = await screen.findByRole('button', { name: /Configuración/i })
    await user.click(configBtn)

    expect(await screen.findByText('Configuracion Mock')).toBeInTheDocument()
  })

  it('pagína la tabla de usuarios cuando hay más registros que el tamaño de página', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin1', username: 'adminaxora', role: 'admin' }),
    )

    const manyUsers = Array.from({ length: 12 }, (_, i) => ({
      id: `usr-${i + 1}`,
      first_name: `Usuario`,
      last_name: `${i + 1}`,
      username: `user_${i + 1}`,
      email: `user_${i + 1}@axora.test`,
      role: 'user',
      created_at: '2026-09-04T12:00:00Z',
    }))

    mockGetAdminUsersApi.mockResolvedValueOnce(manyUsers)
    mockGetAdminTransactionsApi.mockResolvedValueOnce([])

    renderAdminPage()

    expect(await screen.findByText('@user_1')).toBeInTheDocument()
    expect(screen.getByText('@user_8')).toBeInTheDocument()
    expect(screen.queryByText('@user_9')).not.toBeInTheDocument()

    expect(screen.getByText(/Mostrando 1 a 8 de 12 usuarios/i)).toBeInTheDocument()

    // Ir a página siguiente
    const nextBtn = screen.getByRole('button', { name: 'Página siguiente' })
    await user.click(nextBtn)

    expect(await screen.findByText('@user_9')).toBeInTheDocument()
    expect(screen.getByText('@user_12')).toBeInTheDocument()
    expect(screen.queryByText('@user_1')).not.toBeInTheDocument()
    expect(screen.getByText(/Mostrando 9 a 12 de 12 usuarios/i)).toBeInTheDocument()
  })

  it('permite filtrar transacciones por tipo y estado', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'admin1', username: 'adminaxora', role: 'admin' }),
    )

    mockGetAdminUsersApi.mockResolvedValueOnce([])
    mockGetAdminTransactionsApi.mockResolvedValueOnce([
      {
        id: 'tx-swap-1',
        type: 'SWAP',
        status: 'COMPLETED',
        username: 'ana',
        email: 'ana@axora.test',
        from_currency: 'USD',
        from_amount: '100',
        to_currency: 'EUR',
        to_amount: '92',
        applied_exchange_rate: '0.92',
        description: 'Swap 1',
        created_at: '2026-09-04T12:00:00Z',
      },
      {
        id: 'tx-transfer-1',
        type: 'TRANSFER',
        status: 'PENDING',
        username: 'camilo',
        email: 'camilo@axora.test',
        from_currency: 'USD',
        from_amount: '50',
        to_currency: 'USD',
        to_amount: '50',
        applied_exchange_rate: null,
        recipient_username: 'ana',
        description: 'Transfer 1',
        created_at: '2026-09-04T13:00:00Z',
      },
    ])

    renderAdminPage()

    // Cambiar a transacciones
    await user.click(screen.getByRole('button', { name: /Transacciones/i }))

    expect(await screen.findByText('USD → EUR')).toBeInTheDocument()
    expect(screen.getByText('Transfer 1')).toBeInTheDocument()

    // Filtrar por Tipo: SWAP
    const typeSelect = screen.getByLabelText('Filtrar por tipo de transacción')
    await user.selectOptions(typeSelect, 'SWAP')

    expect(screen.getByText('USD → EUR')).toBeInTheDocument()
    expect(screen.queryByText('Transfer 1')).not.toBeInTheDocument()

    // Filtrar por Estado: PENDING (debe quedar vacío porque el SWAP es COMPLETED)
    const statusSelect = screen.getByLabelText('Filtrar por estado de transacción')
    await user.selectOptions(statusSelect, 'PENDING')

    expect(screen.queryByText('USD → EUR')).not.toBeInTheDocument()
    expect(screen.getByText('No se encontraron transacciones')).toBeInTheDocument()

    // Restablecer filtros con el botón
    const resetBtn = screen.getByRole('button', { name: /Restablecer filtros/i })
    await user.click(resetBtn)

    expect(await screen.findByText('USD → EUR')).toBeInTheDocument()
    expect(screen.getByText('Transfer 1')).toBeInTheDocument()
  })
})
