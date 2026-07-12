import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import { onboardingSchema } from '../../schemas/onboarding.schema.js'

export async function onboardingRoutes(fastify: FastifyInstance) {
  // GET /api/v1/onboarding/status
  fastify.get(
    '/status',
    { preHandler: [fastify.authenticate] },
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

  // POST /api/v1/onboarding
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate] },
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
