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
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const input = createVariantSchema.parse(request.body)

      const existing = await prisma.varianteProducto.findFirst({
        where: { tenantId: request.tenantId, sku: input.sku },
      })

      if (existing) throw Errors.SKU_ALREADY_EXISTS()

      const variant = await prisma.varianteProducto.create({
        data: {
          tenantId: request.tenantId,
          ...input,
          precioVenta: input.precioVenta,
          fechaCaducidad: input.fechaCaducidad
            ? new Date(input.fechaCaducidad)
            : null,
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
      const { categoria } = request.query as { categoria?: string }

      const variants = await prisma.varianteProducto.findMany({
        where: {
          tenantId: request.tenantId,
          ...(categoria && categoria !== 'Todas'
            ? { producto: { categoria } }
            : {}),
        },
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

      const newStock =
        input.tipo === 'AJUSTE'
          ? input.cantidad
          : variant.stockActual + input.cantidad

      if (newStock < 0) {
        throw Errors.INSUFFICIENT_STOCK()
      }

      const usuario = await prisma.usuario.findFirst({
        where: {
          tenantId: request.tenantId,
          clerkUserId: request.userId,
        },
      })

      if (!usuario) {
        throw new Error('No existe un usuario registrado para esta tienda')
      }

      const [updated] = await prisma.$transaction([
        prisma.varianteProducto.update({
          where: { id: request.params.id },
          data: { stockActual: newStock },
        }),

        prisma.movimientoStock.create({
          data: {
            tenantId: request.tenantId,
            varianteId: request.params.id,
            usuarioId: usuario.id,
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
  // PATCH /api/v1/inventory/variants/:id
  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const input = updateVariantSchema.parse(request.body)

      const variant = await prisma.varianteProducto.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
        },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      if (input.sku && input.sku !== variant.sku) {
        const skuExists = await prisma.varianteProducto.findFirst({
          where: {
            tenantId: request.tenantId,
            sku: input.sku,
            id: {
              not: request.params.id,
            },
          },
        })

        if (skuExists) throw Errors.SKU_ALREADY_EXISTS()
      }

      const updated = await prisma.varianteProducto.update({
        where: {
          id: request.params.id,
        },
        data: {
          ...(input.sku !== undefined && {
            sku: input.sku,
          }),
          ...(input.nombreVariante !== undefined && {
            nombreVariante: input.nombreVariante,
          }),
          ...(input.imagenUrl !== undefined && {
            imagenUrl: input.imagenUrl,
          }),
          ...(input.precioVenta !== undefined && {
            precioVenta: input.precioVenta,
          }),
          ...(input.stockMinimo !== undefined && {
            stockMinimo: input.stockMinimo,
          }),
          ...(input.fechaCaducidad !== undefined && {
            fechaCaducidad: input.fechaCaducidad
              ? new Date(input.fechaCaducidad)
              : null,
          }),
        },
        include: {
          producto: true,
        },
      })

      return reply.send(successResponse(updated))
    }
  )
}
