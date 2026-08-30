# AXORA — Frontend

Billetera multi-moneda para mochileros y nómadas digitales. Permite gestionar saldo en varias monedas, iniciar sesión de forma segura y (próximamente) intercambiar divisas y ver actividad en tiempo real.

Construido con **React + TypeScript + Vite**, consumiendo la API REST del backend (`axora-backend`, Express + PostgreSQL).

## Requisitos previos

- Node.js (v18 o superior recomendado)
- npm
- El backend (`axora-backend`) corriendo en paralelo — ver su propio README para el setup de la base de datos

## Instalación

```bash
npm install
```

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```bash
cp .env.example .env
```

| Variable       | Descripción                    | Ejemplo                 |
| -------------- | ------------------------------ | ----------------------- |
| `VITE_API_URL` | URL base del backend (Express) | `http://localhost:3000` |

## Desarrollo local

```bash
npm run dev
```

Levanta el servidor de desarrollo de Vite en `http://localhost:5173`.

> Asegurate de tener el backend corriendo en el puerto indicado por `VITE_API_URL`, con CORS habilitado para `http://localhost:5173` (viene configurado así por default en el backend).

## Build de producción

```bash
npm run build
```

Compila TypeScript y genera el build optimizado en `dist/`.

```bash
npm run preview
```

Sirve localmente el build de producción para verificarlo antes de deployar.

## Tests

```bash
npm run test        # modo watch
npm run test:run    # corre una vez y termina (útil para CI)
```

## Lint

```bash
npm run lint
```

## Rutas de la aplicación

| Ruta         | Página    | Protegida | Descripción                                                               |
| ------------ | --------- | --------- | ------------------------------------------------------------------------- |
| `/`          | Landing   | No        | Home pública con info del producto                                        |
| `/login`     | Login     | No        | Inicio de sesión, conectado a `POST /auth/login`                          |
| `/registro`  | Registro  | No        | Alta de cuenta, conectado a `POST /auth/register` (crea usuario + wallet) |
| `/dashboard` | Dashboard | Sí        | Resumen de cuenta, activos y transacciones. Requiere sesión activa        |

Las rutas protegidas usan `ProtectedRoute`, que valida `isAuthenticated` desde `AuthContext` y redirige a `/login` si no hay sesión.

## Autenticación

- El login y el registro guardan el JWT devuelto por el backend en `localStorage` (`token`) junto con los datos del usuario (`user`).
- La sesión persiste entre recargas: `AuthContext` verifica si existe un token guardado al montar la app.
- El botón de logout del dashboard limpia `localStorage` y redirige a `/login`.

## Estado del dashboard

Los balances y transacciones que se muestran hoy son **datos de ejemplo (mock)**. El fetch real está escrito y comentado en `DashboardPage.tsx`, a la espera de que el backend exponga el endpoint de wallet/balances protegido por JWT.

## Estructura del proyecto
