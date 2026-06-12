import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { redis, acquireLock, releaseLock, lockKey } from '../../lib/redis.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import { createSaleSchema } from '../../schemas/sale.schema.js'

export async function saleRoutes(fastify: FastifyInstance) {
  // POST /api/v1/sales
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const input = createSaleSchema.parse(request.body)
      const { tenantId, userId } = request

      // 1. Verificar stock previo para todos los items
      for (const item of input.items) {
        const variant = await prisma.varianteProducto.findFirst({
          where: { id: item.varianteId, tenantId },
        })

        if (!variant) throw Errors.VARIANT_NOT_FOUND()
        if (variant.stockActual < item.cantidad)
          throw Errors.INSUFFICIENT_STOCK()
      }

      // 2. Adquirir locks para todos los SKUs
      const locks: string[] = []

      try {
        for (const item of input.items) {
          const variant = await prisma.varianteProducto.findFirst({
            where: { id: item.varianteId, tenantId },
            select: { sku: true },
          })

          const key = lockKey(tenantId, variant!.sku)
          const acquired = await acquireLock(key, 5)

          if (!acquired) {
            throw Errors.LOCK_NOT_ACQUIRED()
          }

          locks.push(key)
        }

        // 3. Ejecutar transaccion atomica
        let total = 0
        const detalles = []

        for (const item of input.items) {
          const variant = await prisma.varianteProducto.findFirst({
            where: { id: item.varianteId, tenantId },
          })

          const subtotal = Number(variant!.precioVenta) * item.cantidad
          total += subtotal

          detalles.push({
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnitario: variant!.precioVenta,
            newStock: variant!.stockActual - item.cantidad,
            stockMinimo: variant!.stockMinimo,
            sku: variant!.sku,
          })
        }

        const venta = await prisma.$transaction(async (tx) => {
          // Crear la venta
          const nuevaVenta = await tx.venta.create({
            data: {
              tenantId,
              usuarioId: userId,
              total,
              estado: 'COMPLETADA',
              detalles: {
                create: detalles.map((d) => ({
                  varianteId: d.varianteId,
                  cantidad: d.cantidad,
                  precioUnitario: d.precioUnitario,
                })),
              },
            },
            include: { detalles: true },
          })

          // Actualizar stock y registrar movimientos
          for (const d of detalles) {
            await tx.varianteProducto.update({
              where: { id: d.varianteId },
              data: { stockActual: d.newStock },
            })

            await tx.movimientoStock.create({
              data: {
                tenantId,
                varianteId: d.varianteId,
                usuarioId,
                tipo: 'ENTRADA',
                cantidad: -d.cantidad,
                motivo: `Venta #${nuevaVenta.id}`,
              },
            })

            // Generar alerta si stock bajo
            if (d.newStock <= d.stockMinimo) {
              await tx.alerta.create({
                data: {
                  tenantId,
                  varianteId: d.varianteId,
                  tipo: 'BAJO_STOCK',
                  leida: false,
                },
              })
            }
          }

          return nuevaVenta
        })

        return reply.status(201).send(successResponse(venta))
      } finally {
        // 4. Liberar locks siempre — incluso si la transaccion falla
        for (const key of locks) {
          await releaseLock(key)
        }
      }
    }
  )
}
