# Changelog

Todos los cambios relevantes de `axora-frontend`. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); las entradas se agrupan por fecha.

## 2026-10-02

### Añadido
- Panel de administración: columna Acciones con botón para eliminar usuarios y modal de confirmación que advierte que se borran la wallet y todos sus movimientos. El botón se deshabilita en la cuenta propia. Consume `DELETE /admin/users/:id` del backend. 4 tests nuevos (188 en total).

### Cambiado
- `VITE_API_URL` apunta al backend en Render (antes Railway).
- README: URLs y referencias de despliegue actualizadas.
