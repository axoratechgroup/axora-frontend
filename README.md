# AXORA — Frontend

Billetera multi-moneda para mochileros y nómadas digitales. Frontend construido con React + TypeScript + Vite.

## Requisitos previos

- Node.js (v18 o superior recomendado)
- npm

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

Levanta el servidor de desarrollo de Vite (por defecto en `http://localhost:5173`).

> Asegurate de tener el backend (`axora-backend`) corriendo en paralelo en el puerto indicado por `VITE_API_URL`.

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

## Stack

- React + TypeScript
- Vite
- Vitest + Testing Library
- Deploy: Vercel
