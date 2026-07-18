import type { FastifyInstance } from 'fastify'
import type { Decimal } from '@prisma/client/runtime/library.js'
import { Prisma } from '@prisma/client' // <-- Importación necesaria para el tipado del cliente de transacción
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

      console.log('TENANT:', tenantId)

      const ventas = await prisma.venta.findMany({
        include: {
          usuario: true,
          detalles: true,
        },
      })

      console.log('TODAS LAS VENTAS:')
      console.log(
        ventas.map((v) => ({
          id: v.id,
          tenantId: v.tenantId,
        }))
      )

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

      const usuarioInterno = await prisma.usuario.findFirst({
        where: { clerkUserId: userId, tenantId },
        select: { id: true },
      })

      if (!usuarioInterno) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no registrado en esta organizacion',
            statusCode: 403,
          },
        })
      }

      const internalUserId = usuarioInterno.id

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
        let subtotal = 0
        const detalles: DetalleItem[] = []

        for (const item of input.items) {
          const variant = await prisma.varianteProducto.findFirst({
            where: { id: item.varianteId, tenantId },
          })

          const subtotalItem = Number(variant!.precioVenta) * item.cantidad
          subtotal += subtotalItem

          detalles.push({
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnitario: variant!.precioVenta,
            newStock: variant!.stockActual - item.cantidad,
            stockMinimo: variant!.stockMinimo,
            sku: variant!.sku,
          })
        }

        const descuento = input.descuento ?? 0
        if (descuento > subtotal) throw Errors.DISCOUNT_EXCEEDS_SUBTOTAL()

        const total = subtotal - descuento

        // 4. Ejecutar transaccion atomica con tipado explícito 'tx: Prisma.TransactionClient'
        const venta = await prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const nuevaVenta = await tx.venta.create({
              data: {
                tenantId,
                usuarioId: internalUserId,
                total,
                descuento,
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

            await Promise.all(
              detalles.map(async (d) => {
                await tx.varianteProducto.update({
                  where: { id: d.varianteId },
                  data: { stockActual: d.newStock },
                })

                await tx.movimientoStock.create({
                  data: {
                    tenantId,
                    varianteId: d.varianteId,
                    usuarioId: internalUserId,
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
              })
            )

            return nuevaVenta
          },
          {
            maxWait: 10000,
            timeout: 30000,
          }
        )

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

  fastify.patch(
    '/:id/cancel',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { id } = request.params as { id: string }
      const { tenantId, userId } = request

      const usuarioInterno = await prisma.usuario.findFirst({
        where: { clerkUserId: userId, tenantId },
        select: { id: true },
      })

      if (!usuarioInterno) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no registrado en esta organizacion',
            statusCode: 403,
          },
        })
      }

      const venta = await prisma.venta.findFirst({
        where: { id, tenantId },
        include: { detalles: true },
      })

      if (!venta) throw Errors.SALE_NOT_FOUND()
      if (venta.estado === 'CANCELADA') throw Errors.SALE_ALREADY_CANCELLED()

      // Tipado explícito aplicado también aquí para mitigar el segundo error de compilación
      const ventaActualizada = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const updated = await tx.venta.update({
            where: { id },
            data: { estado: 'CANCELADA' },
            include: {
              detalles: {
                include: {
                  variante: {
                    select: {
                      nombreVariante: true,
                      sku: true,
                      imagenUrl: true,
                    },
                  },
                },
              },
              usuario: {
                select: { nombre: true },
              },
            },
          })

          for (const detalle of venta.detalles) {
            await tx.varianteProducto.update({
              where: { id: detalle.varianteId },
              data: { stockActual: { increment: detalle.cantidad } },
            })

            await tx.movimientoStock.create({
              data: {
                tenantId,
                varianteId: detalle.varianteId,
                usuarioId: usuarioInterno.id,
                tipo: 'ENTRADA',
                cantidad: detalle.cantidad,
                motivo: `Cancelación de venta #${id}`,
              },
            })
          }

          return updated
        }
      )

      return reply.send(successResponse(ventaActualizada))
    }
  )
}
