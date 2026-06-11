import type { FastifyInstance } from 'fastify'
import { successResponse } from '../../lib/response.js'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return successResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })
}
