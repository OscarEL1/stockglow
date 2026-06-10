[![CI](https://github.com/OscarEL1/stockglow/actions/workflows/ci.yml/badge.svg)](https://github.com/OscarEL1/stockglow/actions/workflows/ci.yml)

SaaS de gestión de inventario para tiendas de cosméticos.

## Stack

- **Frontend:** React 18 + Vite + TailwindCSS + React Query
- **Backend:** Node.js 20 + Fastify 4 + Prisma + Zod
- **Base de datos:** PostgreSQL 15 (Supabase) + Redis (Upstash)
- **Auth:** Clerk
- **Infra:** Vercel + Railway + GitHub Actions

## Estructura del monorepo
stockglow/
├── apps/
│   ├── api/        # Backend Fastify
│   └── web/        # Frontend React
├── packages/
│   └── shared/     # Tipos y schemas compartidos
└── .github/
└── workflows/  # CI/CD pipelines

## Setup local

```bash
# Clonar el repo
git clone https://github.com/OscarEL1/stockglow.git
cd stockglow

# Instalar dependencias (activa Husky automáticamente)
pnpm install
```

## Convención de commits

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para el flujo completo de GitFlow
y las reglas de commits.
