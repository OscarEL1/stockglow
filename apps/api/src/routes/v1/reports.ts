import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'

export async function reportsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/reports/sales-by-day
  fastify.get(
    '/sales-by-day',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const tenantId = request.tenantId

      // Generar los últimos 7 días
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0, 0, 0, 0)
        return d
      })

      const startDate = days[0]

      const ventas = await prisma.venta.findMany({
        where: {
          tenantId,
          estado: 'COMPLETADA',
          createdAt: { gte: startDate },
        },
      })

      // Agrupar ventas por fecha (YYYY-MM-DD)
      const salesMap = ventas.reduce(
        (acc, venta) => {
          const dateStr = venta.createdAt.toISOString().split('T')[0]
          acc[dateStr] = (acc[dateStr] || 0) + Number(venta.total)
          return acc
        },
        {} as Record<string, number>
      )

      // Formatear respuesta con los 7 días (incluyendo $0 para los vacíos)
      const data = days.map((date) => {
        const dateStr = date.toISOString().split('T')[0]
        const formattedDate = new Intl.DateTimeFormat('es-MX', {
          day: 'numeric',
          month: 'short',
        }).format(date)

        return {
          date: dateStr,
          label: formattedDate,
          total: salesMap[dateStr] || 0,
        }
      })

      return reply.send(successResponse(data))
    }
  )

  // GET /api/v1/reports/top-products
  fastify.get(
    '/top-products',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const tenantId = request.tenantId

      const period = (request.query as any)?.period || 'month'
      let startDate = new Date()
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7)
      } else {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      }
      startDate.setHours(0, 0, 0, 0)

      const detalles = await prisma.detalleVenta.findMany({
        where: {
          venta: {
            tenantId,
            estado: 'COMPLETADA',
            createdAt: { gte: startDate },
          },
        },
        include: {
          variante: {
            include: {
              producto: true,
            },
          },
        },
      })

      // Agrupar por productoId
      const productMap = detalles.reduce(
        (acc, detalle) => {
          const prod = detalle.variante.producto
          if (!acc[prod.id]) {
            acc[prod.id] = {
              id: prod.id,
              nombre: prod.nombre,
              imagenUrl: detalle.variante.imagenUrl,
              cantidadVendida: 0,
            }
          }
          acc[prod.id].cantidadVendida += detalle.cantidad
          return acc
        },
        {} as Record<string, any>
      )

      // Ordenar por cantidadVendida y tomar los top 5
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
        .slice(0, 5)

      return reply.send(successResponse(topProducts))
    }
  )
  // GET /api/v1/reports/employees-ranking
  fastify.get(
    '/employees-ranking',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const tenantId = request.tenantId

      const startDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )

      startDate.setHours(0, 0, 0, 0)

      const ventas = await prisma.venta.findMany({
        where: {
          tenantId,
          estado: 'COMPLETADA',
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          usuario: true,
        },
      })

      const ranking = ventas.reduce(
        (acc, venta) => {
          const usuarioId = venta.usuarioId

          if (!acc[usuarioId]) {
            acc[usuarioId] = {
              usuarioId,
              nombre: venta.usuario.nombre,
              ventas: 0,
              montoTotal: 0,
            }
          }

          acc[usuarioId].ventas += 1
          acc[usuarioId].montoTotal += Number(venta.total)

          return acc
        },
        {} as Record<string, any>
      )

      const result = Object.values(ranking).sort((a, b) => {
        if (b.ventas !== a.ventas) {
          return b.ventas - a.ventas
        }

        return b.montoTotal - a.montoTotal
      })

      return reply.send(successResponse(result))
    }
  )
}
