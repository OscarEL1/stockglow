import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import { getPagination, paginatedMeta } from '../../lib/pagination.js'
import {
  createProductSchema,
  updateProductSchema,
} from '../../schemas/product.schema.js'

export async function productRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Crear producto',
        description: 'Crea un nuevo producto en el catálogo de la tienda.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['nombre'],
          properties: {
            nombre: { type: 'string', minLength: 1, description: 'Nombre del producto' },
            marca: { type: 'string', description: 'Marca (opcional)' },
            categoria: { type: 'string', description: 'Categoría (opcional)' },
            descripcion: { type: 'string', description: 'Descripción (opcional)' },
          },
        },
        response: {
          201: {
            description: 'Producto creado',
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
      const input = createProductSchema.parse(request.body)

      const product = await prisma.producto.create({
        data: {
          tenantId: request.tenantId,
          ...input,
        },
      })

      return reply.status(201).send(successResponse(product))
    }
  )

  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Listar productos',
        description:
          'Retorna la lista de productos con paginación. Filtrable por estado (active/archived).',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Número de página', default: 1 },
            limit: { type: 'number', description: 'Elementos por página', default: 20 },
            status: {
              type: 'string',
              enum: ['active', 'archived'],
              description: 'Filtrar por estado',
            },
          },
        },
        response: {
          200: {
            description: 'Lista paginada de productos',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  totalPages: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const { skip, take, page, limit } = getPagination(request.query as any)

      const { status } = request.query as {
        status?: 'active' | 'archived'
      }

      const activo = status === 'archived' ? false : true

      const where = {
        tenantId: request.tenantId,
        activo,
      }
      const [products, total] = await Promise.all([
        prisma.producto.findMany({
          where,
          include: {
            variantes: true,
            proveedor: true,
          },
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.producto.count({ where }),
      ])

      return reply.send(
        successResponse(products, paginatedMeta(total, page, limit))
      )
    }
  )

  fastify.get(
    '/categories',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Listar categorías de productos',
        description:
          'Retorna las categorías únicas de todos los productos activos de la tienda.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Lista de categorías',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const categories = await prisma.producto.findMany({
        where: {
          tenantId: request.tenantId,
          activo: true,
          categoria: {
            not: null,
          },
        },
        select: { categoria: true },
        distinct: ['categoria'],
      })

      const uniqueCategories = categories
        .map((c) => c.categoria)
        .filter(Boolean)
        .sort()

      return reply.send(successResponse(uniqueCategories))
    }
  )

  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Obtener producto por ID',
        description:
          'Retorna un producto específico con todas sus variantes.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID del producto' },
          },
        },
        response: {
          200: {
            description: 'Producto encontrado',
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
      const product = await prisma.producto.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
        },
        include: { variantes: true, proveedor: true },
      })

      if (!product) throw Errors.PRODUCT_NOT_FOUND()

      return reply.send(successResponse(product))
    }
  )

  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Actualizar producto',
        description: 'Actualiza campos del producto (nombre, marca, categoría, descripción).',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID del producto' },
          },
        },
        body: {
          type: 'object',
          properties: {
            nombre: { type: 'string', minLength: 1, description: 'Nombre' },
            marca: { type: 'string', nullable: true, description: 'Marca' },
            categoria: { type: 'string', nullable: true, description: 'Categoría' },
            descripcion: { type: 'string', nullable: true, description: 'Descripción' },
          },
        },
        response: {
          200: {
            description: 'Producto actualizado',
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
      const input = updateProductSchema.parse(request.body)

      const existing = await prisma.producto.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })

      if (!existing) throw Errors.PRODUCT_NOT_FOUND()

      const updated = await prisma.producto.update({
        where: { id: request.params.id },
        data: input,
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
        summary: 'Archivar producto',
        description:
          'Marca un producto como inactivo. Solo administradores pueden archivar.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID del producto' },
          },
        },
        response: {
          200: {
            description: 'Producto archivado',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const { id } = request.params as {
        id: string
      }

      const { tenantId, orgRole } = request

      if (orgRole !== 'org:admin') {
        throw Errors.FORBIDDEN()
      }

      const product = await prisma.producto.findFirst({
        where: {
          id,
          tenantId,
        },
        select: {
          id: true,
          nombre: true,
          activo: true,
        },
      })

      if (!product) {
        throw Errors.PRODUCT_NOT_FOUND()
      }

      if (!product.activo) {
        throw Errors.PRODUCT_ALREADY_ARCHIVED()
      }

      const archivedProduct = await prisma.producto.update({
        where: {
          id: product.id,
        },
        data: {
          activo: false,
        },
        include: {
          variantes: true,
        },
      })

      return reply.send(
        successResponse({
          ...archivedProduct,
          message: 'Producto archivado correctamente',
        })
      )
    }
  )

  fastify.patch(
    '/:id/restore',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Restaurar producto archivado',
        description:
          'Restaura un producto archivado a estado activo. Solo administradores.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID del producto' },
          },
        },
        response: {
          200: {
            description: 'Producto restaurado',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const { id } = request.params as {
        id: string
      }

      const { tenantId, orgRole } = request

      if (orgRole !== 'org:admin') {
        throw Errors.FORBIDDEN()
      }

      const product = await prisma.producto.findFirst({
        where: {
          id,
          tenantId,
        },
        select: {
          id: true,
          nombre: true,
          activo: true,
        },
      })

      if (!product) {
        throw Errors.PRODUCT_NOT_FOUND()
      }

      if (product.activo) {
        throw Errors.PRODUCT_ALREADY_ACTIVE()
      }

      const restoredProduct = await prisma.producto.update({
        where: {
          id: product.id,
        },
        data: {
          activo: true,
        },
        include: {
          variantes: true,
        },
      })

      return reply.send(
        successResponse({
          ...restoredProduct,
          message: 'Producto restaurado correctamente',
        })
      )
    }
  )

  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Eliminar producto',
        description:
          'Elimina un producto permanentemente. Solo si no tiene historial de ventas. Solo administradores.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID del producto' },
          },
        },
        response: {
          200: {
            description: 'Producto eliminado',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nombre: { type: 'string' },
                  variantesEliminadas: { type: 'number' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const { id } = request.params as { id: string }
      const { tenantId, orgRole } = request

      /*
       * El frontend y backend utilizan el mismo rol de Clerk.
       * Solo administradores de la organización pueden eliminar.
       */
      if (orgRole !== 'org:admin') {
        throw Errors.FORBIDDEN()
      }

      const product = await prisma.producto.findFirst({
        where: {
          id,
          tenantId,
        },
        select: {
          id: true,
          nombre: true,
          variantes: {
            select: {
              id: true,
            },
          },
        },
      })

      if (!product) {
        throw Errors.PRODUCT_NOT_FOUND()
      }

      const variantIds = product.variantes.map((variant) => variant.id)

      const salesHistoryCount =
        variantIds.length === 0
          ? 0
          : await prisma.detalleVenta.count({
              where: {
                varianteId: {
                  in: variantIds,
                },
              },
            })

      if (salesHistoryCount > 0) {
        throw Errors.PRODUCT_HAS_SALES()
      }

      await prisma.$transaction([
        prisma.alerta.deleteMany({
          where: {
            tenantId,
            varianteId: {
              in: variantIds,
            },
          },
        }),

        prisma.movimientoStock.deleteMany({
          where: {
            tenantId,
            varianteId: {
              in: variantIds,
            },
          },
        }),

        prisma.producto.delete({
          where: {
            id: product.id,
          },
        }),
      ])

      return reply.send(
        successResponse({
          id: product.id,
          nombre: product.nombre,
          variantesEliminadas: variantIds.length,
          message: 'Producto eliminado correctamente',
        })
      )
    }
  )
}
