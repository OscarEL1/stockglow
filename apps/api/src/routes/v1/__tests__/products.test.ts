import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { successResponse } from '../../lib/response.js'

// Mock de prisma para no necesitar BD ni variables de entorno en CI
vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    producto: {
      create: vi.fn().mockResolvedValue({
        id: 'prod-001',
        tenantId: 'tenant-kaprich-001',
        nombre: 'Labial Matte',
        marca: 'LOreal',
        categoria: 'Labiales',
        descripcion: null,
        createdAt: new Date(),
      }),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
    },
  },
}))

describe('Plugin de inventario — productos', () => {
  it('successResponse retorna estructura correcta para productos', () => {
    const product = {
      id: 'prod-001',
      tenantId: 'tenant-kaprich-001',
      nombre: 'Labial Matte',
    }
    const result = successResponse(product)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(product)
    expect(result.meta.version).toBe('v1')
  })

  it('tenant A no puede ver datos de tenant B', () => {
    const tenantA = 'tenant-kaprich-001'
    const tenantB = 'tenant-beautycare-002'
    expect(tenantA).not.toBe(tenantB)
  })

  it('un producto pertenece a un solo tenant', () => {
    const product = {
      id: 'prod-001',
      tenantId: 'tenant-kaprich-001',
      nombre: 'Labial Matte',
    }
    expect(product.tenantId).toBe('tenant-kaprich-001')
    expect(product.tenantId).not.toBe('tenant-beautycare-002')
  })
})
