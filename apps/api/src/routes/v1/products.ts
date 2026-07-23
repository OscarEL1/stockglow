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
  // POST /api/v1/inventory/products
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
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

  // GET /api/v1/inventory/products?status=active|archived
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
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
          },
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),

        prisma.producto.count({
          where,
        }),
      ])

      return reply.send(
        successResponse(products, paginatedMeta(total, page, limit))
      )
    }
  )

  // GET /api/v1/inventory/products/categories
  fastify.get(
    '/categories',
    {
      preHandler: [fastify.authenticate],
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

  // GET /api/v1/inventory/products/:id
  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const product = await prisma.producto.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
        },
        include: { variantes: true },
      })

      if (!product) throw Errors.PRODUCT_NOT_FOUND()

      return reply.send(successResponse(product))
    }
  )

  // PATCH /api/v1/inventory/products/:id
  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
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

  // PATCH /api/v1/inventory/products/:id/archive
  fastify.patch(
    '/:id/archive',
    {
      preHandler: [fastify.authenticate],
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

  // PATCH /api/v1/inventory/products/:id/restore
  fastify.patch(
    '/:id/restore',
    {
      preHandler: [fastify.authenticate],
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

  // DELETE /api/v1/inventory/products/:id
  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
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
