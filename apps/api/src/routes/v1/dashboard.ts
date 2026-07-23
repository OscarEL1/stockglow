import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'

export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/v1/dashboard/summary
  fastify.get(
    '/summary',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const totalProducts = await prisma.producto.count({
        where: {
          tenantId: request.tenantId,
          activo: true,
        },
      })

      const variants = await prisma.varianteProducto.findMany({
        where: {
          tenantId: request.tenantId,
          activo: true,
          producto: {
            is: {
              activo: true,
            },
          },
        },
        select: {
          stockActual: true,
          precioVenta: true,
          stockMinimo: true,
        },
      })

      let totalValue = 0
      let totalAlerts = 0

      for (const variant of variants) {
        const stock = variant.stockActual
        const precio = Number(variant.precioVenta)
        totalValue += stock * precio

        if (stock <= variant.stockMinimo) {
          totalAlerts++
        }
      }

      const totalVariants = variants.length

      const disponibles = variants.filter(
        (v) => v.stockActual > v.stockMinimo
      ).length
      const stockBajo = variants.filter(
        (v) => v.stockActual > 0 && v.stockActual <= v.stockMinimo
      ).length
      const agotados = variants.filter((v) => v.stockActual === 0).length

      // Determine start of current month
      const now = new Date()
      const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      startCurrentMonth.setHours(0, 0, 0, 0)

      // Determine start of previous month
      const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      startPrevMonth.setHours(0, 0, 0, 0)
      const endPrevMonth = new Date(startCurrentMonth.getTime() - 1) // last ms of previous month

      // Sales for current month
      const currentMonthQuery = await prisma.venta.aggregate({
        where: {
          tenantId: request.tenantId,
          createdAt: { gte: startCurrentMonth },
          estado: 'COMPLETADA',
        },
        _sum: { total: true },
      })

      // Sales for previous month
      const prevMonthQuery = await prisma.venta.aggregate({
        where: {
          tenantId: request.tenantId,
          createdAt: { gte: startPrevMonth, lte: endPrevMonth },
          estado: 'COMPLETADA',
        },
        _sum: { total: true },
      })

      const totalVentasMesActual = Number(currentMonthQuery._sum.total || 0)
      const totalVentasMesAnterior = Number(prevMonthQuery._sum.total || 0)

      // Existing today sales (keep for other UI)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const ventasHoyQuery = await prisma.venta.aggregate({
        where: {
          tenantId: request.tenantId,
          createdAt: { gte: today },
          estado: 'COMPLETADA',
        },
        _sum: { total: true },
      })
      const totalVentasHoy = Number(ventasHoyQuery._sum.total || 0)

      return reply.send(
        successResponse({
          totalProducts,
          totalVariants,
          totalValue,
          totalAlerts,
          totalVentasHoy,
          totalVentasMesActual,
          totalVentasMesAnterior,
          disponibles,
          stockBajo,
          agotados,
        })
      )
    }
  )

  // GET /api/v1/dashboard/category-distribution
  fastify.get(
    '/category-distribution',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const variants = await prisma.varianteProducto.findMany({
        where: {
          tenantId: request.tenantId,
          activo: true,
          producto: {
            is: {
              activo: true,
            },
          },
        },
        select: {
          stockActual: true,
          precioVenta: true,
          producto: {
            select: {
              categoria: true,
            },
          },
        },
      })

      const categoryMap = new Map<
        string,
        { totalValue: number; totalVariants: number }
      >()

      for (const variant of variants) {
        const categoria = variant.producto.categoria || 'Sin categoría'
        const valor = variant.stockActual * Number(variant.precioVenta)
        const existing = categoryMap.get(categoria) ?? {
          totalValue: 0,
          totalVariants: 0,
        }
        categoryMap.set(categoria, {
          totalValue: existing.totalValue + valor,
          totalVariants: existing.totalVariants + 1,
        })
      }

      const distribution = Array.from(categoryMap.entries()).map(
        ([categoria, data]) => ({
          categoria,
          totalValue: Math.round(data.totalValue * 100) / 100,
          totalVariants: data.totalVariants,
        })
      )

      return reply.send(successResponse(distribution))
    }
  )
}
