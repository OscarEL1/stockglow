import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'

export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/v1/dashboard/summary
  fastify.get(
    '/summary',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const totalProducts = await prisma.producto.count({
        where: { tenantId: request.tenantId },
      })

      const variants = await prisma.varianteProducto.findMany({
        where: { tenantId: request.tenantId },
        select: { stockActual: true, precioVenta: true, stockMinimo: true },
      })

      let totalValue = 0
      let totalAlerts = 0

      for (const variant of variants) {
        const stock = variant.stockActual
        const precio = Number(variant.precioVenta)
        totalValue += stock * precio

        if (stock <= variant.stockMinimo) {
          totalAlerts++
        }
      }

      return reply.send(
        successResponse({
          totalProducts,
          totalValue,
          totalAlerts,
        })
      )
    }
  )
}
