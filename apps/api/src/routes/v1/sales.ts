import type { FastifyInstance } from 'fastify'
import type { Decimal } from '@prisma/client/runtime/library.js'
import { prisma } from '../../lib/prisma.js'
import { acquireLock, releaseLock, lockKey } from '../../lib/redis.js'
import { emitToTenant } from '../../plugins/websocket.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import { createSaleSchema } from '../../schemas/sale.schema.js'

interface DetalleItem {
  varianteId: string
  cantidad: number
  precioUnitario: Decimal
  newStock: number
  stockMinimo: number
  sku: string
}

export async function saleRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { tenantId } = request

      const ventas = await prisma.venta.findMany({
        where: { tenantId },
        include: {
          detalles: {
            include: {
              variante: {
                select: {
                  nombreVariante: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return reply.send(successResponse(ventas))
    }
  )

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

          if (!acquired) throw Errors.LOCK_NOT_ACQUIRED()

          locks.push(key)
        }

        // 3. Construir detalles con tipo explícito
        let total = 0
        const detalles: DetalleItem[] = []

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

        // 4. Ejecutar transaccion atomica
        const currentUserId = userId

        const venta = await prisma.$transaction(async (tx) => {
          const nuevaVenta = await tx.venta.create({
            data: {
              tenantId,
              usuarioId: currentUserId,
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

          for (const d of detalles) {
            await tx.varianteProducto.update({
              where: { id: d.varianteId },
              data: { stockActual: d.newStock },
            })

            await tx.movimientoStock.create({
              data: {
                tenantId,
                varianteId: d.varianteId,
                usuarioId: currentUserId,
                tipo: 'ENTRADA',
                cantidad: -d.cantidad,
                motivo: `Venta #${nuevaVenta.id}`,
              },
            })

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

        // 5. Emitir evento WebSocket al dashboard del dueno
        try {
          emitToTenant(tenantId, 'stock:update', {
            ventaId: venta.id,
            items: detalles.map((d) => ({
              varianteId: d.varianteId,
              sku: d.sku,
              stockActual: d.newStock,
            })),
            timestamp: new Date().toISOString(),
          })
        } catch (wsErr) {
          fastify.log.warn(
            { wsErr },
            'WebSocket emit fallo pero la venta fue confirmada'
          )
        }

        return reply.status(201).send(successResponse(venta))
      } finally {
        // 6. Liberar locks siempre
        for (const key of locks) {
          await releaseLock(key)
        }
      }
    }
  )
}
