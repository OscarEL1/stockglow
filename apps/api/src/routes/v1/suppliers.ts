import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import {
  createSupplierSchema,
  updateSupplierSchema,
} from '../../schemas/supplier.schema.js'

export async function supplierRoutes(fastify: FastifyInstance) {
  // GET /api/v1/suppliers
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const tenantId = request.tenantId

      const suppliers = await prisma.proveedor.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      })

      return reply.send(successResponse(suppliers))
    }
  )

  // POST /api/v1/suppliers
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const tenantId = request.tenantId

      if (!tenantId) {
        return reply.status(400).send({
          success: false,
          message: 'No se pudo identificar la organización (tenantId)',
        })
      }

      const body = createSupplierSchema.parse(request.body)

      const supplier = await prisma.proveedor.create({
        data: {
          ...body,
          tenant: {
            connect: { id: tenantId },
          },
        },
      })

      return reply.status(201).send(successResponse(supplier))
    }
  )

  // PUT /api/v1/suppliers/:id
  fastify.put(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const tenantId = request.tenantId
      const { id } = request.params as { id: string }
      const body = updateSupplierSchema.parse(request.body)

      const existing = await prisma.proveedor.findFirst({
        where: { id, tenantId },
      })

      if (!existing) {
        return reply.status(404).send({ message: 'Proveedor no encontrado' })
      }

      const updated = await prisma.proveedor.update({
        where: { id },
        data: body,
      })

      return reply.send(successResponse(updated))
    }
  )

  // DELETE /api/v1/suppliers/:id
  fastify.delete(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const tenantId = request.tenantId
      const { id } = request.params as { id: string }

      const existing = await prisma.proveedor.findFirst({
        where: { id, tenantId },
      })

      if (!existing) {
        return reply.status(404).send({ message: 'Proveedor no encontrado' })
      }

      await prisma.proveedor.delete({
        where: { id },
      })

      return reply.send(
        successResponse({ id, message: 'Proveedor eliminado correctamente' })
      )
    }
  )
}
