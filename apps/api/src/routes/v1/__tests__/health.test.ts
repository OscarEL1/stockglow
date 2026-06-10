import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { healthRoutes } from '../health.js'

describe('GET /api/v1/health', () => {
  it('debe responder 200 con status ok', async () => {
    const app = Fastify()
    await app.register(healthRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
    expect(body.meta.version).toBe('v1')
  })
})
