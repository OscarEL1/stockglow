import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import { getTenantCategories } from '../../lib/categories.js'
import { sanitizeText } from '../../utils/sanitize.js'

const updateSettingsSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .optional()
    .transform((value) => (value === undefined ? value : sanitizeText(value))),
  logoUrl: z.string().url('URL de logo inválida').nullable().optional(),
  umbralDiasCaducidad: z
    .number()
    .int()
    .min(1, 'El umbral debe ser de al menos 1 día')
    .optional(),
  stockMinimoGlobal: z
    .number()
    .int()
    .min(0, 'El stock mínimo global no puede ser negativo')
    .optional(),
})

const createCategorySchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre de la categoría es requerido')
    .max(50)
    .transform(sanitizeText),
})

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['settings'],
        summary: 'Obtener configuración de la tienda',
        description:
          'Retorna la configuración actual: nombre, logo, umbral de caducidad y stock mínimo global.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Configuración de la tienda',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  logoUrl: { type: 'string', nullable: true },
                  umbralDiasCaducidad: { type: 'number' },
                  stockMinimoGlobal: { type: 'number' },
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
        select: {
          nombreTienda: true,
          logoUrl: true,
          umbralDiasCaducidad: true,
          stockMinimoGlobal: true,
        },
      })

      return reply.send(
        successResponse({
          nombre: tenant?.nombreTienda ?? '',
          logoUrl: tenant?.logoUrl ?? null,
          umbralDiasCaducidad: tenant?.umbralDiasCaducidad ?? 30,
          stockMinimoGlobal: tenant?.stockMinimoGlobal ?? 5,
        })
      )
    }
  )

  fastify.patch(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['settings'],
        summary: 'Actualizar configuración de la tienda',
        description:
          'Actualiza campos de configuración de forma parcial. Solo se modifican los campos enviados.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            nombre: {
              type: 'string',
              minLength: 2,
              description: 'Nombre de la tienda',
            },
            logoUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'URL del logo',
            },
            umbralDiasCaducidad: {
              type: 'number',
              minimum: 1,
              description: 'Días de anticipación para alertas de caducidad',
            },
            stockMinimoGlobal: {
              type: 'number',
              minimum: 0,
              description: 'Stock mínimo por defecto para nuevas variantes',
            },
          },
        },
        response: {
          200: {
            description: 'Configuración actualizada',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  logoUrl: { type: 'string', nullable: true },
                  umbralDiasCaducidad: { type: 'number' },
                  stockMinimoGlobal: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const input = updateSettingsSchema.parse(request.body)

      const tenant = await prisma.tenant.update({
        where: { id: request.tenantId },
        data: {
          ...(input.nombre !== undefined && { nombreTienda: input.nombre }),
          ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
          ...(input.umbralDiasCaducidad !== undefined && {
            umbralDiasCaducidad: input.umbralDiasCaducidad,
          }),
          ...(input.stockMinimoGlobal !== undefined && {
            stockMinimoGlobal: input.stockMinimoGlobal,
          }),
        },
      })

      return reply.send(
        successResponse({
          nombre: tenant.nombreTienda,
          logoUrl: tenant.logoUrl,
          umbralDiasCaducidad: tenant.umbralDiasCaducidad,
          stockMinimoGlobal: tenant.stockMinimoGlobal,
        })
      )
    }
  )

  fastify.get(
    '/categories',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['settings'],
        summary: 'Listar categorías de la tienda',
        description:
          'Retorna todas las categorías configuradas para esta tienda.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Lista de categorías',
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
                    tenantId: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const categorias = await getTenantCategories(request.tenantId)

      return reply.send(successResponse(categorias))
    }
  )

  fastify.post(
    '/categories',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['settings'],
        summary: 'Crear categoría',
        description: 'Agrega una nueva categoría a la tienda. Nombre único por tienda.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['nombre'],
          properties: {
            nombre: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'Nombre de la categoría',
            },
          },
        },
        response: {
          201: {
            description: 'Categoría creada',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nombre: { type: 'string' },
                  tenantId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
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

  fastify.delete(
    '/categories/:nombre',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['settings'],
        summary: 'Eliminar categoría',
        description:
          'Elimina una categoría y desasocia todos los productos que la usaban. Los productos quedan sin categoría.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['nombre'],
          properties: {
            nombre: {
              type: 'string',
              description: 'Nombre de la categoría a eliminar (URL-encoded)',
            },
          },
        },
        response: {
          200: {
            description: 'Categoría eliminada',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
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
