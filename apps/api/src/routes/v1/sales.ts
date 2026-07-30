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

      const ventas = await prisma.venta.findMany({
        where: { tenantId },
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
            select: { nombre: true, rol: true },
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
                notas: input.notas,
                metodoPago: input.metodoPago,
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
            metodoPago: venta.metodoPago,
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

  // GET /api/v1/sales/daily-closing — CA01: desglose de ventas por empleada
  fastify.get(
    '/daily-closing',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { tenantId, orgRole } = request

      if (orgRole !== 'org:admin') {
        throw Errors.FORBIDDEN()
      }

      const { fecha } = request.query as { fecha?: string }

      const now = new Date()
      const target = fecha
        ? (() => {
            const [y, m, d] = fecha.split('-').map(Number)
            return new Date(y, m - 1, d)
          })()
        : now
      const startOfDay = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        0,
        0,
        0,
        0
      )
      const endOfDay = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        23,
        59,
        59,
        999
      )

      const ventas = await prisma.venta.findMany({
        where: {
          tenantId,
          estado: 'COMPLETADA',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          usuario: {
            select: { id: true, nombre: true },
          },
        },
      })

      // CA02: Sin ventas registradas
      if (ventas.length === 0) {
        return reply.send(
          successResponse({
            fecha: startOfDay.toISOString().split('T')[0],
            empleadas: [],
            totalGeneral: 0,
            totalTransacciones: 0,
            sinVentas: true,
          })
        )
      }

      // Agrupar por empleada
      const employeeMap = new Map<
        string,
        { usuarioId: string; nombre: string; transacciones: number; total: number }
      >()

      for (const venta of ventas) {
        const key = venta.usuarioId
        if (!employeeMap.has(key)) {
          employeeMap.set(key, {
            usuarioId: key,
            nombre: venta.usuario.nombre,
            transacciones: 0,
            total: 0,
          })
        }
        const entry = employeeMap.get(key)!
        entry.transacciones += 1
        entry.total += Number(venta.total)
      }

      const empleadas = Array.from(employeeMap.values()).sort(
        (a, b) => b.total - a.total
      )

      const totalGeneral = empleadas.reduce((sum, e) => sum + e.total, 0)
      const totalTransacciones = empleadas.reduce(
        (sum, e) => sum + e.transacciones,
        0
      )

      return reply.send(
        successResponse({
          fecha: startOfDay.toISOString().split('T')[0],
          empleadas,
          totalGeneral,
          totalTransacciones,
          sinVentas: false,
        })
      )
    }
  )
}
