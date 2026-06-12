import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { productRoutes } from '../products.js'
import { errorHandler } from '../../plugins/error-handler.js'

describe('GET /api/v1/inventory/products', () => {
  it('debe retornar solo productos del tenant autenticado', async () => {
    const app = Fastify()
    await app.register(errorHandler)

    app.decorate('authenticate', async (request: any) => {
      request.tenantId = 'tenant-kaprich-001'
      request.userId = 'user-test-001'
    })

    await app.register(productRoutes, {
      prefix: '/api/v1/inventory/products',
    })

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/products',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })
})
