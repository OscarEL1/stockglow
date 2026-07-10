import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import {
  createVariantSchema,
  updateVariantSchema,
  adjustStockSchema,
} from '../../schemas/variant.schema.js'

export async function variantRoutes(fastify: FastifyInstance) {
  // POST /api/v1/inventory/variants
  // POST /api/v1/inventory/variants
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      // Extraemos lo que viene crudo del cuerpo antes o después del parseo por seguridad
      const bodyCrudo = request.body || {}
      const input = createVariantSchema.parse(bodyCrudo)

      const existing = await prisma.varianteProducto.findFirst({
        where: { tenantId: request.tenantId, sku: input.sku },
      })

      if (existing) throw Errors.SKU_ALREADY_EXISTS()

      // Buscamos la fecha intentando leer ambos formatos (camelCase y snake_case)
      const fechaFinal =
        input.fechaCaducidad ||
        bodyCrudo.fecha_caducidad ||
        bodyCrudo.fechaCaducidad

      const variant = await prisma.varianteProducto.create({
        data: {
          tenantId: request.tenantId,
          sku: input.sku,
          nombreVariante: input.nombreVariante,
          imagenUrl: input.imagenUrl,
          stockActual: input.stockActual,
          stockMinimo: input.stockMinimo,
          precioVenta: input.precioVenta,
          productoId: input.productoId,
          // Forzamos el parseo correcto de la fecha a un objeto Date de JS
          fechaCaducidad: fechaFinal ? new Date(fechaFinal) : null,
        },
      })

      return reply.status(201).send(successResponse(variant))
    }
  )

  // GET /api/v1/inventory/variants
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const variants = await prisma.varianteProducto.findMany({
        where: { tenantId: request.tenantId },
        include: { producto: true },
        orderBy: { updatedAt: 'desc' },
      })

      return reply.send(successResponse(variants))
    }
  )

  // PATCH /api/v1/inventory/variants/:id/stock
  fastify.patch(
    '/:id/stock',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const input = adjustStockSchema.parse(request.body)

      const variant = await prisma.varianteProducto.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      const newStock = variant.stockActual + input.cantidad

      if (newStock < 0) throw Errors.INSUFFICIENT_STOCK()

      const [updated] = await prisma.$transaction([
        prisma.varianteProducto.update({
          where: { id: request.params.id },
          data: { stockActual: newStock },
        }),
        prisma.movimientoStock.create({
          data: {
            tenantId: request.tenantId,
            varianteId: request.params.id,
            usuarioId: request.userId,
            tipo: input.tipo,
            cantidad: input.cantidad,
            motivo: input.motivo,
          },
        }),
      ])

      return reply.send(successResponse(updated))
    }
  )

  // GET /api/v1/inventory/variants/:id/movements
  fastify.get(
    '/:id/movements',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const variant = await prisma.varianteProducto.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      const movements = await prisma.movimientoStock.findMany({
        where: {
          varianteId: request.params.id,
          tenantId: request.tenantId,
        },
        include: {
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return reply.send(successResponse(movements))
    }
  )
}
