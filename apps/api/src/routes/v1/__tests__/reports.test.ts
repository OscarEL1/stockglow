import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { errorHandler } from '../../../plugins/error-handler.js'
import { reportsRoutes } from '../reports.js'

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    venta: {
      findMany: vi.fn(),
    },
  },
}))

const { prisma } = await import('../../../lib/prisma.js')

interface FixtureVenta {
  id: string
  tenantId: string
  usuarioId: string
  total: number
  estado: string
  createdAt: Date
  usuario: { id: string; nombre: string; rol: string }
}

// Simula el filtrado que Prisma aplicaría en la BD real para el `where`
// que usa GET /employees-ranking, a partir de un fixture en memoria.
function fakeFindMany(ventas: FixtureVenta[]) {
  return vi.fn().mockImplementation(({ where }) => {
    return Promise.resolve(
      ventas.filter((venta) => {
        if (where.tenantId && venta.tenantId !== where.tenantId) return false
        if (where.estado && venta.estado !== where.estado) return false
        if (
          where.createdAt?.gte &&
          venta.createdAt.getTime() < where.createdAt.gte.getTime()
        )
          return false
        if (where.usuario?.rol && venta.usuario.rol !== where.usuario.rol)
          return false
        return true
      })
    )
  })
}

async function buildApp(orgRole: string | null) {
  const app = Fastify()
  app.decorate('authenticate', async (request: any) => {
    request.tenantId = 'tenant-kaprich-001'
    request.orgRole = orgRole
  })
  await app.register(errorHandler)
  await app.register(reportsRoutes, { prefix: '/api/v1/reports' })
  return app
}

function venta(overrides: Partial<FixtureVenta>): FixtureVenta {
  return {
    id: 'venta-default',
    tenantId: 'tenant-kaprich-001',
    usuarioId: 'user-default',
    total: 0,
    estado: 'COMPLETADA',
    createdAt: new Date(),
    usuario: { id: 'user-default', nombre: 'Default', rol: 'EMPLOYEE' },
    ...overrides,
  }
}

describe('GET /api/v1/reports/employees-ranking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ordena el ranking por numero de ventas descendente (caso feliz)', async () => {
    ;(prisma.venta.findMany as any) = fakeFindMany([
      venta({
        id: 'v1',
        usuarioId: 'ana',
        total: 100,
        usuario: { id: 'ana', nombre: 'Ana', rol: 'EMPLOYEE' },
      }),
      venta({
        id: 'v2',
        usuarioId: 'ana',
        total: 100,
        usuario: { id: 'ana', nombre: 'Ana', rol: 'EMPLOYEE' },
      }),
      venta({
        id: 'v3',
        usuarioId: 'ana',
        total: 100,
        usuario: { id: 'ana', nombre: 'Ana', rol: 'EMPLOYEE' },
      }),
      venta({
        id: 'v4',
        usuarioId: 'beatriz',
        total: 500,
        usuario: { id: 'beatriz', nombre: 'Beatriz', rol: 'EMPLOYEE' },
      }),
    ])

    const app = await buildApp('org:admin')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/employees-ranking',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.map((e: any) => e.nombre)).toEqual(['Ana', 'Beatriz'])
    expect(body.data[0].ventas).toBe(3)
    expect(body.data[1].ventas).toBe(1)
  })

  it('CA02: en empate de ventas, desempata por monto total descendente', async () => {
    ;(prisma.venta.findMany as any) = fakeFindMany([
      venta({
        id: 'v1',
        usuarioId: 'beatriz',
        total: 500,
        usuario: { id: 'beatriz', nombre: 'Beatriz', rol: 'EMPLOYEE' },
      }),
      venta({
        id: 'v2',
        usuarioId: 'beatriz',
        total: 500,
        usuario: { id: 'beatriz', nombre: 'Beatriz', rol: 'EMPLOYEE' },
      }),
      venta({
        id: 'v3',
        usuarioId: 'carla',
        total: 200,
        usuario: { id: 'carla', nombre: 'Carla', rol: 'EMPLOYEE' },
      }),
      venta({
        id: 'v4',
        usuarioId: 'carla',
        total: 200,
        usuario: { id: 'carla', nombre: 'Carla', rol: 'EMPLOYEE' },
      }),
    ])

    const app = await buildApp('org:admin')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/employees-ranking',
    })

    const body = JSON.parse(response.body)
    expect(body.data.map((e: any) => e.ventas)).toEqual([2, 2])
    expect(body.data.map((e: any) => e.nombre)).toEqual(['Beatriz', 'Carla'])
    expect(body.data[0].montoTotal).toBeGreaterThan(body.data[1].montoTotal)
  })

  it('excluye ventas registradas por OWNER o MANAGER del ranking', async () => {
    ;(prisma.venta.findMany as any) = fakeFindMany([
      venta({
        id: 'v1',
        usuarioId: 'ana',
        total: 100,
        usuario: { id: 'ana', nombre: 'Ana', rol: 'EMPLOYEE' },
      }),
      venta({
        id: 'v2',
        usuarioId: 'jefa',
        total: 900,
        usuario: { id: 'jefa', nombre: 'Jefa', rol: 'OWNER' },
      }),
      venta({
        id: 'v3',
        usuarioId: 'gerente',
        total: 900,
        usuario: { id: 'gerente', nombre: 'Gerente', rol: 'MANAGER' },
      }),
    ])

    const app = await buildApp('org:admin')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/employees-ranking',
    })

    const body = JSON.parse(response.body)
    expect(body.data.map((e: any) => e.nombre)).toEqual(['Ana'])
  })

  it('no mezcla ventas de otro tenantId', async () => {
    ;(prisma.venta.findMany as any) = fakeFindMany([
      venta({
        id: 'v1',
        tenantId: 'tenant-kaprich-001',
        usuarioId: 'ana',
        total: 100,
        usuario: { id: 'ana', nombre: 'Ana', rol: 'EMPLOYEE' },
      }),
      venta({
        id: 'v2',
        tenantId: 'tenant-beautycare-002',
        usuarioId: 'diana',
        total: 999,
        usuario: { id: 'diana', nombre: 'Diana', rol: 'EMPLOYEE' },
      }),
    ])

    const app = await buildApp('org:admin')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/employees-ranking',
    })

    const body = JSON.parse(response.body)
    expect(body.data.map((e: any) => e.nombre)).toEqual(['Ana'])
  })

  it('rechaza con 403 a un usuario con rol org:member (empleada)', async () => {
    ;(prisma.venta.findMany as any) = fakeFindMany([])

    const app = await buildApp('org:member')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/employees-ranking',
    })

    expect(response.statusCode).toBe(403)
    expect(prisma.venta.findMany).not.toHaveBeenCalled()
  })

  it('rechaza con 403 a cualquier rol que no sea org:admin (ej. org:manager)', async () => {
    ;(prisma.venta.findMany as any) = fakeFindMany([
      venta({
        id: 'v1',
        usuarioId: 'ana',
        total: 100,
        usuario: { id: 'ana', nombre: 'Ana', rol: 'EMPLOYEE' },
      }),
    ])

    const app = await buildApp('org:manager')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/employees-ranking',
    })

    expect(response.statusCode).toBe(403)
    expect(prisma.venta.findMany).not.toHaveBeenCalled()
  })
})
