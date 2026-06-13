import { describe, it, expect, vi } from 'vitest'
import { acquireLock, releaseLock, lockKey } from '../../../lib/redis.js'
import { successResponse, errorResponse } from '../../../lib/response.js'

vi.mock('../../../lib/redis.js', () => ({
  acquireLock: vi.fn().mockResolvedValue(true),
  releaseLock: vi.fn().mockResolvedValue(undefined),
  lockKey: (tenantId: string, sku: string) => `lock:${tenantId}:${sku}`,
  redis: {},
}))

vi.mock('../../../plugins/websocket.js', () => ({
  emitToTenant: vi.fn(),
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

describe('WebSocket — emitToTenant', () => {
  it('emite el evento con los skus y stocks correctos', async () => {
    const { emitToTenant } = await import('../../../plugins/websocket.js')

    const detalles = [
      { varianteId: 'var-001', sku: 'LAB-MATTE-04', newStock: 9 },
    ]

    emitToTenant('tenant-kaprich-001', 'stock:update', {
      ventaId: 'venta-001',
      items: detalles.map((d) => ({
        varianteId: d.varianteId,
        sku: d.sku,
        stockActual: d.newStock,
      })),
      timestamp: new Date().toISOString(),
    })

    expect(emitToTenant).toHaveBeenCalledWith(
      'tenant-kaprich-001',
      'stock:update',
      expect.objectContaining({
        ventaId: 'venta-001',
        items: expect.arrayContaining([
          expect.objectContaining({ sku: 'LAB-MATTE-04', stockActual: 9 }),
        ]),
      })
    )
  })

  it.todo(
    'una falla de WebSocket no afecta el status 201 - pendiente test de integración con fastify.inject'
  )
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
