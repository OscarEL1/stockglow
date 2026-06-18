import type { FastifyInstance } from 'fastify'
import { successResponse } from '../../lib/response.js'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Verificar estado del servidor',
        description:
          'Retorna el estado actual del servidor y la versión de la API',
        security: [],
        response: {
          200: {
            description: 'Servidor operativo',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  version: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      return successResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
      })
    }
  )
}
