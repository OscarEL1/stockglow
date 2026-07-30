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
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Crear variante de producto',
        description:
          'Crea una nueva variante (SKU) asociada a un producto existente. Valida unicidad de SKU.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['productoId', 'sku', 'nombreVariante', 'precioVenta'],
          properties: {
            productoId: { type: 'string', description: 'ID del producto padre' },
            sku: { type: 'string', description: 'Código SKU único' },
            nombreVariante: { type: 'string', description: 'Nombre de la variante' },
            precioVenta: { type: 'number', minimum: 0, description: 'Precio de venta' },
            costoUnitario: { type: 'number', minimum: 0, nullable: true, description: 'Costo unitario (opcional)' },
            stockActual: { type: 'number', minimum: 0, description: 'Stock inicial' },
            stockMinimo: { type: 'number', minimum: 0, description: 'Stock mínimo (usa global si se omite)' },
            imagenUrl: { type: 'string', format: 'uri', nullable: true, description: 'URL de imagen' },
            fechaCaducidad: { type: 'string', format: 'date', nullable: true, description: 'Fecha de caducidad (YYYY-MM-DD)' },
          },
        },
        response: {
          201: {
            description: 'Variante creada',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const input = createVariantSchema.parse(request.body)

      const existing = await prisma.varianteProducto.findFirst({
        where: { tenantId: request.tenantId, sku: input.sku },
      })

      if (existing) throw Errors.SKU_ALREADY_EXISTS()

      const tenant = await prisma.tenant.findUnique({
        where: {
          id: request.tenantId,
        },
        select: {
          stockMinimoGlobal: true,
        },
      })

      if (!tenant) {
        throw new Error('No existe la configuración de la tienda')
      }

      const { fechaCaducidad, stockMinimo, ...variantData } = input

      const variant = await prisma.varianteProducto.create({
        data: {
          tenantId: request.tenantId,
          ...variantData,

          stockMinimo: stockMinimo ?? tenant.stockMinimoGlobal,

          fechaCaducidad: fechaCaducidad ? new Date(fechaCaducidad) : null,
        },
      })

      return reply.status(201).send(successResponse(variant))
    }
  )

  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Listar variantes',
        description:
          'Retorna todas las variantes activas de la tienda, incluyendo datos del producto padre. Filtrable por categoría.',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            categoria: {
              type: 'string',
              description: 'Filtrar por categoría (opcional)',
            },
          },
        },
        response: {
          200: {
            description: 'Lista de variantes',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const { categoria } = request.query as { categoria?: string }

      const variants = await prisma.varianteProducto.findMany({
        where: {
          tenantId: request.tenantId,
          activo: true,

          producto: {
            is: {
              activo: true,

              ...(categoria && categoria !== 'Todas'
                ? {
                    categoria,
                  }
                : {}),
            },
          },
        },

        include: {
          producto: true,
        },

        orderBy: {
          updatedAt: 'desc',
        },
      })

      return reply.send(successResponse(variants))
    }
  )

  fastify.patch(
    '/:id/stock',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Ajustar stock de variante',
        description:
          'Ajusta el stock de una variante. Tipo AJUSTE establece el valor directo; ENTRADA/SALIDA suman o restan. Registra el movimiento.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID de la variante' },
          },
        },
        body: {
          type: 'object',
          required: ['tipo', 'cantidad', 'motivo'],
          properties: {
            tipo: {
              type: 'string',
              enum: ['ENTRADA', 'SALIDA', 'AJUSTE'],
              description: 'Tipo de movimiento',
            },
            cantidad: {
              type: 'number',
              description: 'Cantidad (para AJUSTE es el stock final, para ENTRADA/SALIDA es la cantidad a sumar/restar)',
            },
            motivo: {
              type: 'string',
              description: 'Motivo del movimiento',
            },
          },
        },
        response: {
          200: {
            description: 'Stock actualizado',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
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

  fastify.get(
    '/:id/movements',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Historial de movimientos de stock',
        description:
          'Retorna todos los movimientos de stock registrados para una variante, ordenados por fecha descendente.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID de la variante' },
          },
        },
        response: {
          200: {
            description: 'Lista de movimientos',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    tipo: { type: 'string' },
                    cantidad: { type: 'number' },
                    motivo: { type: 'string' },
                    createdAt: { type: 'string' },
                    usuario: {
                      type: 'object',
                      properties: {
                        nombre: { type: 'string' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
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

  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Actualizar variante',
        description:
          'Actualiza campos de una variante. Si el precio de venta cambia, se registra en el historial de precios.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID de la variante' },
          },
        },
        body: {
          type: 'object',
          properties: {
            sku: { type: 'string', description: 'Nuevo SKU' },
            nombreVariante: { type: 'string', description: 'Nuevo nombre' },
            precioVenta: { type: 'number', minimum: 0, description: 'Nuevo precio de venta' },
            costoUnitario: { type: 'number', minimum: 0, nullable: true, description: 'Costo unitario' },
            stockMinimo: { type: 'number', minimum: 0, description: 'Nuevo stock mínimo' },
            imagenUrl: { type: 'string', format: 'uri', nullable: true, description: 'Nueva imagen' },
            fechaCaducidad: { type: 'string', format: 'date', nullable: true, description: 'Nueva fecha de caducidad' },
          },
        },
        response: {
          200: {
            description: 'Variante actualizada',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
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

      const updated = await prisma.$transaction(async (tx) => {
        const updatedVariant = await tx.varianteProducto.update({
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
            ...(input.costoUnitario !== undefined && {
              costoUnitario: input.costoUnitario,
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

        if (
          input.precioVenta !== undefined &&
          Number(input.precioVenta) !== Number(variant.precioVenta)
        ) {
          await tx.historialPrecio.create({
            data: {
              varianteId: request.params.id,
              precioAnterior: variant.precioVenta,
              precioNuevo: input.precioVenta,
            },
          })
        }

        return updatedVariant
      })

      return reply.send(successResponse(updated))
    }
  )

  fastify.patch(
    '/:id/archive',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Archivar variante',
        description:
          'Marca una variante como inactiva. No se eliminará permanentemente.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID de la variante' },
          },
        },
        response: {
          200: {
            description: 'Variante archivada',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const variant = await prisma.varianteProducto.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
        },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      const updated = await prisma.varianteProducto.update({
        where: { id: request.params.id },
        data: { activo: false },
        include: {
          producto: true,
        },
      })

      return reply.send(successResponse(updated))
    }
  )

  fastify.get(
    '/:id/price-history',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Historial de precios',
        description:
          'Retorna el historial de cambios de precio de una variante, ordenado por fecha descendente.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID de la variante' },
          },
        },
        response: {
          200: {
            description: 'Historial de precios',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    precioAnterior: { type: 'number' },
                    precioNuevo: { type: 'number' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const variant = await prisma.varianteProducto.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      const history = await prisma.historialPrecio.findMany({
        where: { varianteId: request.params.id },
        orderBy: { createdAt: 'desc' },
      })

      return reply.send(successResponse(history))
    }
  )
}
