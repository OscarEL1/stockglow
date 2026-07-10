import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'

export async function alertRoutes(fastify: FastifyInstance) {
  // GET /api/v1/alerts
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { tenantId } = request

      const alertas = await prisma.alerta.findMany({
        where: { tenantId, leida: false },
        include: {
          variante: {
            select: {
              nombreVariante: true,
              sku: true,
              producto: {
                select: { nombre: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return reply.send(successResponse(alertas))
    }
  )

  // PATCH /api/v1/alerts/mark-read
  fastify.patch(
    '/mark-read',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { tenantId } = request

      const result = await prisma.alerta.updateMany({
        where: { tenantId, leida: false },
        data: { leida: true },
      })

      return reply.send(successResponse({ count: result.count }))
    }
  )
}
