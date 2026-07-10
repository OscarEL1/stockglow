import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { onboardingSchema } from '../../schemas/onboarding.schema.js'

export async function onboardingRoutes(fastify: FastifyInstance) {
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
          data: { nombreTienda: input.nombreTienda },
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
            descripcion: input.descripcion,
          },
        })
        return reply.send(successResponse({ step: 2, producto }))
      }

      // Paso 3: Crear variante
      if (input.step === 3) {
        const variante = await prisma.varianteProducto.create({
          data: {
            tenantId,
            productoId: input.productoId,
            sku: input.sku,
            nombreVariante: input.nombreVariante,
            precioVenta: input.precioVenta,
            stockActual: input.stockInicial,
            stockMinimo: 1,
          },
        })
        return reply.send(successResponse({ step: 3, variante }))
      }

      return reply.status(400).send({ success: false, error: 'Invalid step' })
    }
  )
}
