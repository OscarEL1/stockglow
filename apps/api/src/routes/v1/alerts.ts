import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'

const MS_POR_DIA = 1000 * 60 * 60 * 24

export async function alertRoutes(fastify: FastifyInstance) {
  // GET /api/v1/alerts
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { tenantId } = request
      const includeRead = (request.query as any)?.includeRead === 'true'
      const whereClause = includeRead
        ? { tenantId }
        : { tenantId, leida: false }

      // 1. Buscamos el umbral configurado por la tienda (Tenant)
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { umbralDiasCaducidad: true },
      })

      // Si por alguna razón no tiene configuración asignada, usamos 30 por defecto
      const diasAlertaCaducidad = tenant?.umbralDiasCaducidad ?? 30

      // Alertas persistidas (hoy: BAJO_STOCK, generadas al confirmar una venta)
      const alertasStock = await prisma.alerta.findMany({
        where: whereClause,
        include: {
          variante: {
            select: {
              nombreVariante: true,
              sku: true,
              stockActual: true,
              stockMinimo: true,
              producto: {
                select: { nombre: true, marca: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Alertas de caducidad: aún no se persisten en `alertas`, se calculan
      // al vuelo a partir de fechaCaducidad de cada variante.
      const variantesConCaducidad = await prisma.varianteProducto.findMany({
        where: { tenantId, fechaCaducidad: { not: null } },
        include: {
          producto: {
            select: { nombre: true, marca: true },
          },
        },
      })

      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const utcHoy = Date.UTC(
        hoy.getUTCFullYear(),
        hoy.getUTCMonth(),
        hoy.getUTCDate()
      )

      const alertasCaducidad = variantesConCaducidad
        .map((v) => {
          const fechaCaducidad = v.fechaCaducidad as Date
          const utcCaducidad = Date.UTC(
            fechaCaducidad.getUTCFullYear(),
            fechaCaducidad.getUTCMonth(),
            fechaCaducidad.getUTCDate()
          )
          const diasRestantes = Math.floor((utcCaducidad - utcHoy) / MS_POR_DIA)

          return { v, fechaCaducidad, diasRestantes }
        })
        // Filtramos usando la variable dinámica de días
        .filter(({ diasRestantes }) => diasRestantes <= diasAlertaCaducidad)
        .map(({ v, fechaCaducidad, diasRestantes }) => {
          //  CA01: variante tiene más de 10 unidades y caduca en menos de 15 días
          const sugerirPromocion = v.stockActual > 10 && diasRestantes < 15

          return {
            id: `auto-caducidad-${v.id}`,
            tipo: 'CADUCIDAD_PROXIMA' as const,
            leida: false,
            createdAt: v.updatedAt.toISOString(),
            diasRestantes,
            fechaCaducidad: fechaCaducidad.toISOString(),
            sugerirPromocion, // Enviamos la bandera al frontend
            variante: {
              id: v.id,
              sku: v.sku,
              nombreVariante: v.nombreVariante || 'Estándar',
              stockActual: v.stockActual, // CA02: Stock actual enviado
              stockMinimo: v.stockMinimo,
              producto: {
                nombre: v.producto.nombre,
                marca: v.producto.marca || null,
              },
            },
          }
        })

      const alertas: any[] = [...alertasCaducidad, ...alertasStock]

      // Caducidad primero (más urgente primero), luego el resto en su orden original
      alertas.sort((a, b) => {
        if (a.tipo === 'CADUCIDAD_PROXIMA' && b.tipo === 'CADUCIDAD_PROXIMA') {
          return a.diasRestantes - b.diasRestantes
        }
        if (a.tipo === 'CADUCIDAD_PROXIMA' && b.tipo !== 'CADUCIDAD_PROXIMA') {
          return -1
        }
        if (a.tipo !== 'CADUCIDAD_PROXIMA' && b.tipo === 'CADUCIDAD_PROXIMA') {
          return 1
        }
        return 0
      })

      return reply.send(successResponse(alertas))
    }
  )

  // PATCH /api/v1/alerts/:id/read
  fastify.patch(
    '/:id/read',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { id } = request.params as { id: string }

      // Las alertas de caducidad son calculadas, no existen como fila en la
      // tabla `alertas`: no hay nada que persistir, solo confirmamos al cliente.
      if (id.startsWith('auto-caducidad-')) {
        return reply.send(successResponse({ id, leida: true }))
      }

      await prisma.alerta.update({
        where: { id, tenantId: request.tenantId },
        data: { leida: true },
      })
      return reply.send(successResponse({ id, leida: true }))
    }
  )

  // PATCH /api/v1/alerts/mark-read
  fastify.patch(
    '/mark-read',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { tenantId } = request

      const result = await prisma.alerta.updateMany({
        where: { tenantId, leida: false },
        data: { leida: true },
      })

      return reply.send(successResponse({ count: result.count }))
    }
  )
}
