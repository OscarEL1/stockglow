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

  // GET /api/v1/inventory/products
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { skip, take, page, limit } = getPagination(request.query as any)

      const [products, total] = await Promise.all([
        prisma.producto.findMany({
          where: { tenantId: request.tenantId },
          include: { variantes: true },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.producto.count({
          where: { tenantId: request.tenantId },
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
        where: { tenantId: request.tenantId, categoria: { not: null } },
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
}
