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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['suppliers'],
        summary: 'Listar proveedores',
        description: 'Obtiene todos los proveedores del tenant actual',
        response: {
          200: {
            description: 'Lista de proveedores',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    nombre: { type: 'string' },
                    contacto: { type: 'string' },
                    telefono: { type: 'string' },
                    email: { type: 'string' },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['suppliers'],
        summary: 'Crear proveedor',
        description: 'Registra un nuevo proveedor en el directorio',
        body: {
          type: 'object',
          required: ['nombre'],
          properties: {
            nombre: { type: 'string' },
            contacto: { type: 'string' },
            telefono: { type: 'string' },
            email: { type: 'string' },
          },
        },
        response: {
          201: {
            description: 'Proveedor creado',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nombre: { type: 'string' },
                  contacto: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['suppliers'],
        summary: 'Actualizar proveedor',
        description: 'Actualiza los datos de un proveedor existente',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            contacto: { type: 'string' },
            telefono: { type: 'string' },
            email: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Proveedor actualizado',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nombre: { type: 'string' },
                  contacto: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
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
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['suppliers'],
        summary: 'Eliminar proveedor',
        description: 'Elimina un proveedor del directorio',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Proveedor eliminado',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
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
