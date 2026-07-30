import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import { onboardingSchema } from '../../schemas/onboarding.schema.js'

export async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/status',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['onboarding'],
        summary: 'Estado del wizard de onboarding',
        description:
          'Retorna el paso actual del wizard y el último producto creado, si existe.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Estado del onboarding',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  wizardStep: { type: 'number' },
                  productoId: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId },
        select: { wizardStep: true },
      })

      const ultimoProducto = await prisma.producto.findFirst({
        where: { tenantId: request.tenantId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })

      return reply.send(
        successResponse({
          wizardStep: tenant?.wizardStep ?? 1,
          productoId: ultimoProducto?.id ?? null,
        })
      )
    }
  )

  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['onboarding'],
        summary: 'Avanzar wizard de onboarding',
        description:
          'Procesa un paso del wizard: 1) Guarda nombre de tienda, 2) Crea primer producto, 3) Crea primera variante.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['step'],
          properties: {
            step: { type: 'number', enum: [1, 2, 3], description: 'Paso del wizard' },
            nombreTienda: { type: 'string', description: 'Nombre de la tienda (paso 1)' },
            nombre: { type: 'string', description: 'Nombre del producto (paso 2)' },
            marca: { type: 'string', description: 'Marca del producto (paso 2)' },
            categoria: { type: 'string', description: 'Categoría del producto (paso 2)' },
            productoId: { type: 'string', description: 'ID del producto (paso 3)' },
            sku: { type: 'string', description: 'SKU de la variante (paso 3)' },
            nombreVariante: { type: 'string', description: 'Nombre de la variante (paso 3)' },
            precioVenta: { type: 'number', description: 'Precio de venta (paso 3)' },
            stockActual: { type: 'number', description: 'Stock inicial (paso 3)' },
          },
        },
        response: {
          200: {
            description: 'Paso procesado correctamente',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  step: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const { tenantId } = request
      const input = onboardingSchema.parse(request.body)

      // Paso 1: Guardar nombre de tienda
      if (input.step === 1) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { nombreTienda: input.nombreTienda, wizardStep: input.step },
        })
        return reply.send(successResponse({ step: 1 }))
      }

      // Paso 2: Crear producto
      if (input.step === 2) {
        const producto = await prisma.producto.create({
          data: {
            tenantId,
            nombre: input.nombre,
            marca: input.marca,
            categoria: input.categoria,
          },
        })

        await prisma.tenant.update({
          where: { id: tenantId },
          data: { wizardStep: input.step },
        })

        return reply.send(successResponse({ step: 2, producto }))
      }

      // Paso 3: Crear variante
      const productoExistente = await prisma.producto.findFirst({
        where: { id: input.productoId, tenantId },
      })

      if (!productoExistente) throw Errors.PRODUCT_NOT_FOUND()

      const variante = await prisma.varianteProducto.create({
        data: {
          tenantId,
          productoId: input.productoId,
          sku: input.sku,
          nombreVariante: input.nombreVariante,
          precioVenta: input.precioVenta,
          stockActual: input.stockActual,
        },
      })

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { wizardStep: input.step },
      })

      return reply.send(successResponse({ step: 3, variante }))
    }
  )
}
