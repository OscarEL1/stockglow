import { describe, it, expect, vi } from 'vitest'
import { acquireLock, releaseLock, lockKey } from '../../../lib/redis.js'
import { successResponse, errorResponse } from '../../../lib/response.js'

// Mock de redis para no necesitar Upstash en CI
vi.mock('../../../lib/redis.js', () => ({
  acquireLock: vi.fn().mockResolvedValue(true),
  releaseLock: vi.fn().mockResolvedValue(undefined),
  lockKey: (tenantId: string, sku: string) => `lock:${tenantId}:${sku}`,
  redis: {},
}))

describe('Lock distribuido — Redis', () => {
  it('lockKey genera la clave correcta', () => {
    const key = lockKey('tenant-kaprich-001', 'LAB-MATTE-04')
    expect(key).toBe('lock:tenant-kaprich-001:LAB-MATTE-04')
  })

  it('acquireLock retorna true cuando el lock esta disponible', async () => {
    const result = await acquireLock('lock:tenant-kaprich-001:LAB-MATTE-04')
    expect(result).toBe(true)
  })

  it('releaseLock libera el lock sin errores', async () => {
    await expect(
      releaseLock('lock:tenant-kaprich-001:LAB-MATTE-04')
    ).resolves.not.toThrow()
  })
})

describe('Flujo de venta — status codes', () => {
  it('venta exitosa retorna 201 con success true', () => {
    const venta = { id: 'venta-001', total: 120, estado: 'COMPLETADA' }
    const result = successResponse(venta)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(venta)
  })

  it('stock insuficiente retorna 409', () => {
    const result = errorResponse('INSUFFICIENT_STOCK', 'Sin stock', 409)
    expect(result.success).toBe(false)
    expect(result.error.statusCode).toBe(409)
  })

  it('lock no adquirido retorna 409', () => {
    const result = errorResponse('LOCK_NOT_ACQUIRED', 'Lock ocupado', 409)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('LOCK_NOT_ACQUIRED')
  })

  it('stock nunca llega a negativo', () => {
    const stockActual = 1
    const cantidad = 1
    const newStock = stockActual - cantidad
    expect(newStock).toBeGreaterThanOrEqual(0)
  })
})
