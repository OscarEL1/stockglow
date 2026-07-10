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
      const todasLasVariantes = await prisma.varianteProducto.findMany({
        where: { tenantId: request.tenantId },
        include: { producto: true },
      })

      const variantesCriticas = todasLasVariantes.filter((v) => {
        const actual = v.stockActual ?? 0
        const minimo = v.stockMinimo ?? 0
        return actual <= minimo || actual === 0
      })

      const alertasFormateadas = variantesCriticas.map((v) => ({
        id: `auto-${v.id}`,
        tipo: 'BAJO_STOCK',
        createdAt: v.updatedAt.toISOString(),
        variante: {
          id: v.id,
          sku: v.sku,
          nombreVariante: v.nombreVariante || 'Estándar',
          stockActual: v.stockActual,
          stockMinimo: v.stockMinimo,
          producto: {
            nombre: v.producto.nombre,
            marca: v.producto.marca || null,
          },
        },
      }))

      alertasFormateadas.sort(
        (a, b) => a.variante.stockActual - b.variante.stockActual
      )
      return reply.send(successResponse(alertasFormateadas))
    }
  )

  // PATCH /api/v1/alerts/:id/read
  fastify.patch(
    '/:id/read',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      return reply.send(successResponse({ id: request.params.id, leida: true }))
    }
  )
}
