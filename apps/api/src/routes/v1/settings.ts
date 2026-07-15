import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import { getTenantCategories } from '../../lib/categories.js'

const updateSettingsSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .optional(),
  logoUrl: z.string().url('URL de logo inválida').nullable().optional(),
  // 👇 NUEVA VALIDACIÓN: Debe ser un número entero mayor o igual a 1
  umbralDiasCaducidad: z
    .number()
    .int()
    .min(1, 'El umbral debe ser de al menos 1 día')
    .optional(),
})

const createCategorySchema = z.object({
  nombre: z.string().min(1, 'El nombre de la categoría es requerido').max(50),
})

export async function settingsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/settings
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId },
        // 👇 AÑADIDO: Traemos también el umbral guardado
        select: {
          nombreTienda: true,
          logoUrl: true,
          umbralDiasCaducidad: true,
        },
      })

      return reply.send(
        successResponse({
          nombre: tenant?.nombreTienda ?? '',
          logoUrl: tenant?.logoUrl ?? null,
          // 👇 AÑADIDO: Si no tiene valor, mandamos 30 por defecto al frontend
          umbralDiasCaducidad: tenant?.umbralDiasCaducidad ?? 30,
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
          // 👇 AÑADIDO: Si viene el campo en el body, lo actualizamos en la DB
          ...(input.umbralDiasCaducidad !== undefined && {
            umbralDiasCaducidad: input.umbralDiasCaducidad,
          }),
        },
      })

      return reply.send(
        successResponse({
          nombre: tenant.nombreTienda,
          logoUrl: tenant.logoUrl,
          // 👇 AÑADIDO: Retornamos el valor actualizado
          umbralDiasCaducidad: tenant.umbralDiasCaducidad,
        })
      )
    }
  )

  // GET /api/v1/settings/categories
  fastify.get(
    '/categories',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const categorias = await getTenantCategories(request.tenantId)

      return reply.send(successResponse(categorias))
    }
  )

  // POST /api/v1/settings/categories
  fastify.post(
    '/categories',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const { tenantId } = request
      const input = createCategorySchema.parse(request.body)

      const existing = await prisma.categoria.findFirst({
        where: { tenantId, nombre: input.nombre },
      })

      if (existing) throw Errors.CATEGORY_ALREADY_EXISTS()

      const categoria = await prisma.categoria.create({
        data: { tenantId, nombre: input.nombre },
      })

      return reply.status(201).send(successResponse(categoria))
    }
  )

  // DELETE /api/v1/settings/categories/:nombre
  fastify.delete(
    '/categories/:nombre',
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const { tenantId } = request
      const nombre = decodeURIComponent(
        (request.params as { nombre: string }).nombre
      )

      await prisma.categoria.deleteMany({
        where: { tenantId, nombre },
      })

      await prisma.producto.updateMany({
        where: { tenantId, categoria: nombre },
        data: { categoria: null },
      })

      return reply.send(successResponse({ nombre }))
    }
  )
}
