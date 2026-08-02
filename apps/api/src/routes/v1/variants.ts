import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'
import {
  createVariantSchema,
  updateVariantSchema,
  adjustStockSchema,
  bulkVariantItemSchema,
  createBulkVariantsSchema,
} from '../../schemas/variant.schema.js'

export async function variantRoutes(fastify: FastifyInstance) {
  // POST /api/v1/inventory/variants
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const input = createVariantSchema.parse(request.body)

      const existing = await prisma.varianteProducto.findFirst({
        where: { tenantId: request.tenantId, sku: input.sku },
      })

      if (existing) throw Errors.SKU_ALREADY_EXISTS()

      const tenant = await prisma.tenant.findUnique({
        where: {
          id: request.tenantId,
        },
        select: {
          stockMinimoGlobal: true,
        },
      })

      if (!tenant) {
        throw Errors.TENANT_CONFIG_NOT_FOUND()
      }

      const { fechaCaducidad, stockMinimo, ...variantData } = input

      const variant = await prisma.varianteProducto.create({
        data: {
          tenantId: request.tenantId,
          ...variantData,

          stockMinimo: stockMinimo ?? tenant.stockMinimoGlobal,

          fechaCaducidad: fechaCaducidad ? new Date(fechaCaducidad) : null,
        },
      })

      return reply.status(201).send(successResponse(variant))
    }
  )

  // POST /api/v1/inventory/variants/bulk
  fastify.post(
    '/bulk',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['inventory'],
        summary: 'Crear variantes en lote',
        description:
          'Registra entre 1 y 10 variantes para un mismo producto en una sola operación. Valida cada fila de forma independiente: las filas válidas se crean aunque otras tengan errores. Detecta SKU duplicados dentro de la carga y SKU existentes en la tienda.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['productoId', 'variantes'],
          properties: {
            productoId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del producto al que pertenecen las variantes',
            },
            variantes: {
              type: 'array',
              minItems: 1,
              maxItems: 10,
              description: 'Lista de variantes a crear',
              items: {
                type: 'object',
                required: ['sku', 'nombreVariante', 'precioVenta'],
                properties: {
                  sku: {
                    type: 'string',
                    maxLength: 50,
                    description: 'Código SKU único',
                  },
                  nombreVariante: {
                    type: 'string',
                    maxLength: 100,
                    description: 'Nombre o tono de la variante',
                  },
                  precioVenta: {
                    type: 'number',
                    exclusiveMinimum: 0,
                    description: 'Precio de venta',
                  },
                  stockActual: {
                    type: 'number',
                    minimum: 0,
                    description: 'Stock actual (default: 0)',
                  },
                  stockMinimo: {
                    type: 'number',
                    minimum: 0,
                    description:
                      'Stock mínimo (usa el global de la tienda si se omite)',
                  },
                  fechaCaducidad: {
                    type: 'string',
                    format: 'date',
                    nullable: true,
                    description: 'Fecha de caducidad (YYYY-MM-DD)',
                  },
                },
              },
            },
          },
        },
        response: {
          201: {
            description: 'Todas las variantes se crearon correctamente',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  creadas: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        fila: { type: 'number' },
                        id: { type: 'string' },
                        sku: { type: 'string' },
                        nombreVariante: { type: 'string' },
                      },
                    },
                  },
                  errores: { type: 'array' },
                  totalSolicitadas: { type: 'number' },
                  totalCreadas: { type: 'number' },
                  totalErrores: { type: 'number' },
                },
              },
            },
          },
          207: {
            description: 'Resultado parcial: algunas variantes no se crearon',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  creadas: { type: 'array' },
                  errores: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        fila: { type: 'number' },
                        sku: { type: 'string' },
                        code: { type: 'string' },
                        message: { type: 'string' },
                        campo: { type: 'string' },
                      },
                    },
                  },
                  totalSolicitadas: { type: 'number' },
                  totalCreadas: { type: 'number' },
                  totalErrores: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const input = createBulkVariantsSchema.parse(request.body)
      const { tenantId } = request

      /*
       * Todas las variantes deben pertenecer a un producto activo
       * del mismo tenant.
       */
      const product = await prisma.producto.findFirst({
        where: {
          id: input.productoId,
          tenantId,
          activo: true,
        },
        select: {
          id: true,
        },
      })

      if (!product) {
        throw Errors.PRODUCT_NOT_FOUND()
      }

      const tenant = await prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },
        select: {
          stockMinimoGlobal: true,
        },
      })

      if (!tenant) {
        throw Errors.TENANT_CONFIG_NOT_FOUND()
      }

      /*
       * Validamos primero cada fila para obtener los SKU válidos
       * que deben consultarse en la base.
       */
      const parsedRows = input.variantes.map((rawRow, index) => ({
        index,
        rawRow,
        parsed: bulkVariantItemSchema.safeParse(rawRow),
      }))

      const candidateSkus = Array.from(
        new Set(
          parsedRows
            .filter((row) => row.parsed.success)
            .map((row) => (row.parsed.success ? row.parsed.data.sku : ''))
            .filter(Boolean)
        )
      )

      const existingVariants =
        candidateSkus.length > 0
          ? await prisma.varianteProducto.findMany({
              where: {
                tenantId,
                sku: {
                  in: candidateSkus,
                },
              },
              select: {
                sku: true,
              },
            })
          : []

      const existingSkus = new Set(
        existingVariants.map((variant) => variant.sku)
      )

      const seenSkus = new Set<string>()

      const creadas: Array<{
        fila: number
        id: string
        sku: string
        nombreVariante: string
      }> = []

      const errores: Array<{
        fila: number
        sku: string
        code: string
        message: string
        campo?: string
      }> = []

      /*
       * Procesamiento independiente por fila.
       * Una fila fallida no cancela las demás.
       */
      for (const row of parsedRows) {
        const fila = row.index + 1

        if (!row.parsed.success) {
          const issue = row.parsed.error.issues[0]

          let rawSku = ''

          if (
            typeof row.rawRow === 'object' &&
            row.rawRow !== null &&
            'sku' in row.rawRow
          ) {
            rawSku = String((row.rawRow as { sku?: unknown }).sku ?? '')
          }

          errores.push({
            fila,
            sku: rawSku,
            code: 'VALIDATION_ERROR',
            message: issue?.message ?? 'La fila contiene datos inválidos',
            campo: issue?.path.join('.') || undefined,
          })

          continue
        }

        const variantInput = row.parsed.data
        const sku = variantInput.sku

        /*
         * SKU repetido dentro de la misma operación.
         * La primera fila válida continúa; las siguientes se marcan.
         */
        if (seenSkus.has(sku)) {
          errores.push({
            fila,
            sku,
            code: 'DUPLICATE_SKU_IN_REQUEST',
            message: 'El SKU está repetido dentro de esta carga',
            campo: 'sku',
          })

          continue
        }

        seenSkus.add(sku)

        /*
         * SKU ya registrado previamente en la tienda.
         */
        if (existingSkus.has(sku)) {
          errores.push({
            fila,
            sku,
            code: 'SKU_ALREADY_EXISTS',
            message: 'El SKU ya existe para esta tienda',
            campo: 'sku',
          })

          continue
        }

        const { fechaCaducidad, stockMinimo, ...variantData } = variantInput

        try {
          const createdVariant = await prisma.varianteProducto.create({
            data: {
              tenantId,
              productoId: input.productoId,
              ...variantData,

              stockMinimo: stockMinimo ?? tenant.stockMinimoGlobal,

              fechaCaducidad: fechaCaducidad ? new Date(fechaCaducidad) : null,
            },
          })

          creadas.push({
            fila,
            id: createdVariant.id,
            sku: createdVariant.sku,
            nombreVariante: createdVariant.nombreVariante,
          })
        } catch (creationError) {
          const prismaCode =
            typeof creationError === 'object' &&
            creationError !== null &&
            'code' in creationError
              ? String((creationError as { code?: unknown }).code ?? '')
              : ''

          if (prismaCode === 'P2002') {
            errores.push({
              fila,
              sku,
              code: 'SKU_ALREADY_EXISTS',
              message: 'El SKU ya existe para esta tienda',
              campo: 'sku',
            })

            continue
          }

          fastify.log.error(
            {
              creationError,
              fila,
              sku,
            },
            'No se pudo crear una variante de la carga múltiple'
          )

          errores.push({
            fila,
            sku,
            code: 'VARIANT_CREATE_FAILED',
            message: 'No se pudo guardar esta variante',
          })
        }
      }

      const result = {
        creadas,
        errores,
        totalSolicitadas: input.variantes.length,
        totalCreadas: creadas.length,
        totalErrores: errores.length,
      }

      /*
       * 201 si todas se crearon.
       * 207 si hubo resultados parciales.
       * Ambos son respuestas exitosas para fetch().
       */
      return reply
        .status(errores.length > 0 ? 207 : 201)
        .send(successResponse(result))
    }
  )

  // GET /api/v1/inventory/variants
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { categoria } = request.query as { categoria?: string }

      const variants = await prisma.varianteProducto.findMany({
        where: {
          tenantId: request.tenantId,
          activo: true,

          producto: {
            is: {
              activo: true,

              ...(categoria && categoria !== 'Todas'
                ? {
                    categoria,
                  }
                : {}),
            },
          },
        },

        include: {
          producto: true,
        },

        orderBy: {
          updatedAt: 'desc',
        },
      })

      return reply.send(successResponse(variants))
    }
  )

  // PATCH /api/v1/inventory/variants/:id/stock
  fastify.patch(
    '/:id/stock',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const input = adjustStockSchema.parse(request.body)

      const variant = await prisma.varianteProducto.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      const newStock =
        input.tipo === 'AJUSTE'
          ? input.cantidad
          : variant.stockActual + input.cantidad

      if (newStock < 0) {
        throw Errors.INSUFFICIENT_STOCK()
      }

      const usuario = await prisma.usuario.findFirst({
        where: {
          tenantId: request.tenantId,
          clerkUserId: request.userId,
        },
      })

      if (!usuario) {
        throw Errors.USER_NOT_FOUND()
      }

      const [updated] = await prisma.$transaction([
        prisma.varianteProducto.update({
          where: { id: request.params.id },
          data: { stockActual: newStock },
        }),

        prisma.movimientoStock.create({
          data: {
            tenantId: request.tenantId,
            varianteId: request.params.id,
            usuarioId: usuario.id,
            tipo: input.tipo,
            cantidad: input.cantidad,
            motivo: input.motivo,
          },
        }),
      ])

      return reply.send(successResponse(updated))
    }
  )

  // GET /api/v1/inventory/variants/:id/movements
  fastify.get(
    '/:id/movements',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const variant = await prisma.varianteProducto.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      const movements = await prisma.movimientoStock.findMany({
        where: {
          varianteId: request.params.id,
          tenantId: request.tenantId,
        },
        include: {
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return reply.send(successResponse(movements))
    }
  )
  // PATCH /api/v1/inventory/variants/:id
  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const input = updateVariantSchema.parse(request.body)

      const variant = await prisma.varianteProducto.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
        },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      if (input.sku && input.sku !== variant.sku) {
        const skuExists = await prisma.varianteProducto.findFirst({
          where: {
            tenantId: request.tenantId,
            sku: input.sku,
            id: {
              not: request.params.id,
            },
          },
        })

        if (skuExists) throw Errors.SKU_ALREADY_EXISTS()
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedVariant = await tx.varianteProducto.update({
          where: {
            id: request.params.id,
          },
          data: {
            ...(input.sku !== undefined && {
              sku: input.sku,
            }),
            ...(input.nombreVariante !== undefined && {
              nombreVariante: input.nombreVariante,
            }),
            ...(input.imagenUrl !== undefined && {
              imagenUrl: input.imagenUrl,
            }),
            ...(input.precioVenta !== undefined && {
              precioVenta: input.precioVenta,
            }),
            ...(input.costoUnitario !== undefined && {
              costoUnitario: input.costoUnitario,
            }),
            ...(input.stockMinimo !== undefined && {
              stockMinimo: input.stockMinimo,
            }),
            ...(input.fechaCaducidad !== undefined && {
              fechaCaducidad: input.fechaCaducidad
                ? new Date(input.fechaCaducidad)
                : null,
            }),
          },
          include: {
            producto: true,
          },
        })

        if (
          input.precioVenta !== undefined &&
          Number(input.precioVenta) !== Number(variant.precioVenta)
        ) {
          await tx.historialPrecio.create({
            data: {
              varianteId: request.params.id,
              precioAnterior: variant.precioVenta,
              precioNuevo: input.precioVenta,
            },
          })
        }

        return updatedVariant
      })

      return reply.send(successResponse(updated))
    }
  )

  // PATCH /api/v1/inventory/variants/:id/archive
  fastify.patch(
    '/:id/archive',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const variant = await prisma.varianteProducto.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
        },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      const updated = await prisma.varianteProducto.update({
        where: { id: request.params.id },
        data: { activo: false },
        include: {
          producto: true,
        },
      })

      return reply.send(successResponse(updated))
    }
  )

  // GET /api/v1/inventory/variants/:id/price-history — HU-096
  fastify.get(
    '/:id/price-history',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const variant = await prisma.varianteProducto.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })

      if (!variant) throw Errors.VARIANT_NOT_FOUND()

      const history = await prisma.historialPrecio.findMany({
        where: { varianteId: request.params.id },
        orderBy: { createdAt: 'desc' },
      })

      return reply.send(successResponse(history))
    }
  )
}
