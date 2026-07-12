import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'

const updateSettingsSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .optional(),
  logoUrl: z.string().url('URL de logo inválida').nullable().optional(),
})

export async function settingsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/settings
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId },
        select: { nombreTienda: true, logoUrl: true },
      })

      return reply.send(
        successResponse({
          nombre: tenant?.nombreTienda ?? '',
          logoUrl: tenant?.logoUrl ?? null,
        })
      )
    }
  )

  // PATCH /api/v1/settings
  fastify.patch(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const input = updateSettingsSchema.parse(request.body)

      const tenant = await prisma.tenant.update({
        where: { id: request.tenantId },
        data: {
          ...(input.nombre !== undefined && { nombreTienda: input.nombre }),
          ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        },
      })

      return reply.send(
        successResponse({
          nombre: tenant.nombreTienda,
          logoUrl: tenant.logoUrl,
        })
      )
    }
  )
}
