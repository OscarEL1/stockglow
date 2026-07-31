import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import {
  calcPercentageChange,
  getSalesPeriodRanges,
} from '../../utils/dateRanges.js'
import { Errors } from '../../lib/errors.js'

const SALES_METRICS_PERIODS = ['hoy', 'semana', 'mes'] as const

export async function reportsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/reports/sales-metrics
  fastify.get(
    '/sales-metrics',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const tenantId = request.tenantId
      const ranges = getSalesPeriodRanges()

      const [aggregates, mesAnteriorAggregate] = await Promise.all([
        Promise.all(
          SALES_METRICS_PERIODS.map((period) =>
            prisma.venta.aggregate({
              where: {
                tenantId,
                estado: 'COMPLETADA',
                createdAt: {
                  gte: ranges[period].start,
                  lte: ranges[period].end,
                },
              },
              _sum: { total: true },
              _count: { _all: true },
            })
          )
        ),
        prisma.venta.aggregate({
          where: {
            tenantId,
            estado: 'COMPLETADA',
            createdAt: {
              gte: ranges.mesAnterior.start,
              lte: ranges.mesAnterior.end,
            },
          },
          _sum: { total: true },
        }),
      ])

      const montoMesAnterior = Number(mesAnteriorAggregate._sum.total || 0)

      const data = Object.fromEntries(
        SALES_METRICS_PERIODS.map((period, i) => {
          const montoTotal = Number(aggregates[i]._sum.total || 0)
          const base = {
            numeroVentas: aggregates[i]._count._all,
            montoTotal,
            fechaInicio: ranges[period].start.toISOString(),
            fechaFin: ranges[period].end.toISOString(),
          }

          if (period !== 'mes') return [period, base]

          return [
            period,
            {
              ...base,
              montoMesAnterior,
              porcentajeCambio: calcPercentageChange(
                montoTotal,
                montoMesAnterior
              ),
            },
          ]
        })
      )

      return reply.send(successResponse(data))
    }
  )

  // GET /api/v1/reports/sales-by-day
  fastify.get(
    '/sales-by-day',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const tenantId = request.tenantId

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

      const salesMap = ventas.reduce(
        (acc, venta) => {
          const dateStr = venta.createdAt.toISOString().split('T')[0]
          acc[dateStr] = (acc[dateStr] || 0) + Number(venta.total)
          return acc
        },
        {} as Record<string, number>
      )

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
      const { tenantId, orgRole } = request

      /*
       * Esta vista expone el desempeño de ventas individual de cada
       * empleada, por lo que solo la dueña (org:admin) puede consultarla
       * — igual que el resto de acciones sensibles del dashboard (ej.
       * "Importar inventario"). Una empleada no debe ver el ranking de
       * sus compañeras.
       */
      if (orgRole !== 'org:admin') {
        throw Errors.FORBIDDEN()
      }

      // NOTA (deuda conocida, no tocar aquí): este rango de "mes" usa la
      // hora local del proceso Node, igual que sales-by-day/top-products
      // en este mismo archivo, en vez de America/Mexico_City. Se
      // resolverá de forma centralizada cuando se mergee HU-072
      // (getSalesPeriodRanges en utils/dateRanges.ts).
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
          // Solo vendedoras (EMPLOYEE) cuentan para el ranking; ventas
          // registradas por OWNER/MANAGER quedan fuera.
          usuario: {
            rol: 'EMPLOYEE',
          },
        },
        include: {
          usuario: true,
        },
      })

      interface RankingEntry {
        usuarioId: string
        nombre: string
        ventas: number
        montoTotal: number
      }

      // Nota: una empleada sin ventas en el mes no aparece aquí (no se
      // lista con 0) porque el ranking se construye iterando `ventas` ya
      // filtradas por periodo; es el comportamiento acordado en el
      // review de HU-066.
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
        {} as Record<string, RankingEntry>
      )

      // CA02: desempate por monto total cuando el número de ventas coincide.
      const result = Object.values(ranking).sort((a, b) => {
        if (b.ventas !== a.ventas) {
          return b.ventas - a.ventas
        }

        return b.montoTotal - a.montoTotal
      })

      return reply.send(successResponse(result))
    }
  )

  // GET /api/v1/reports/mermas
  fastify.get(
    '/mermas',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reports'],
        summary: 'Reporte de mermas y productos caducados',
        description:
          'Devuelve todos los movimientos de tipo MERMA y CADUCADO del tenant, con filtros opcionales de fecha y tipo',
        querystring: {
          type: 'object',
          properties: {
            fechaInicio: { type: 'string', format: 'date' },
            fechaFin: { type: 'string', format: 'date' },
            tipo: { type: 'string', enum: ['MERMA', 'CADUCADO'] },
          },
        },
      },
    },
    async (request: any, reply) => {
      const tenantId = request.tenantId
      const { fechaInicio, fechaFin, tipo } = request.query as {
        fechaInicio?: string
        fechaFin?: string
        tipo?: 'MERMA' | 'CADUCADO'
      }

      const where: any = {
        tenantId,
        tipo: tipo ? tipo : { in: ['MERMA', 'CADUCADO'] },
      }

      if (fechaInicio || fechaFin) {
        where.createdAt = {}
        if (fechaInicio) where.createdAt.gte = new Date(fechaInicio)
        if (fechaFin) {
          const end = new Date(fechaFin)
          end.setHours(23, 59, 59, 999)
          where.createdAt.lte = end
        }
      }

      const movimientos = await prisma.movimientoStock.findMany({
        where,
        include: {
          variante: {
            select: {
              id: true,
              sku: true,
              nombreVariante: true,
              imagenUrl: true,
              precioVenta: true,
              producto: {
                select: { id: true, nombre: true, marca: true },
              },
            },
          },
          usuario: {
            select: { id: true, nombre: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const resumen = movimientos.reduce(
        (acc, m) => {
          const key = m.tipo
          if (!acc[key]) {
            acc[key] = { tipo: key, cantidadTotal: 0, registros: 0 }
          }
          acc[key].cantidadTotal += Math.abs(m.cantidad)
          acc[key].registros += 1
          return acc
        },
        {} as Record<
          string,
          { tipo: string; cantidadTotal: number; registros: number }
        >
      )

      return reply.send(
        successResponse({
          movimientos,
          resumen: Object.values(resumen),
        })
      )
    }
  )

  // GET /api/v1/reports/archived-products
  fastify.get(
    '/archived-products',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reports'],
        summary: 'Reporte de productos dados de baja',
        description:
          'Devuelve todos los productos archivados/desactivados del tenant con información de variantes y último movimiento',
      },
    },
    async (request: any, reply) => {
      const tenantId = request.tenantId

      const productos = await prisma.producto.findMany({
        where: { tenantId, activo: false },
        include: {
          variantes: {
            select: {
              id: true,
              sku: true,
              nombreVariante: true,
              stockActual: true,
              precioVenta: true,
              activo: true,
            },
          },
          proveedor: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const totalVariantes = productos.reduce(
        (sum, p) => sum + p.variantes.length,
        0
      )

      return reply.send(
        successResponse({
          productos,
          resumen: {
            totalProductos: productos.length,
            totalVariantes,
          },
        })
      )
    }
  )

  // GET /api/v1/reports/dead-stock
  fastify.get(
    '/dead-stock',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const tenantId = request.tenantId
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      thirtyDaysAgo.setHours(0, 0, 0, 0)

      // Todas las variantes activas del tenant
      const allVariants = await prisma.varianteProducto.findMany({
        where: { tenantId, activo: true },
        include: {
          producto: { select: { nombre: true } },
          detalles: {
            where: {
              venta: {
                estado: 'COMPLETADA',
                createdAt: { gte: thirtyDaysAgo },
              },
            },
            select: { id: true },
          },
          movimientos: {
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { id: true },
          },
        },
      })

      // Filtrar variantes sin actividad reciente
      const deadStock = allVariants.filter(
        (v) => v.detalles.length === 0 && v.movimientos.length === 0
      )

      // CA02: Para cada variante sin movimiento, obtener la fecha del último movimiento
      const variantIds = deadStock.map((v) => v.id)

      const lastMovements = await prisma.movimientoStock.groupBy({
        by: ['varianteId'],
        where: { varianteId: { in: variantIds } },
        _max: { createdAt: true },
      })

      const lastSales = await prisma.detalleVenta.findMany({
        where: { varianteId: { in: variantIds } },
        select: {
          varianteId: true,
          venta: { select: { createdAt: true } },
        },
        orderBy: { venta: { createdAt: 'desc' } },
      })

      // Mapa varianteId → fecha último movimiento
      const lastMovementMap = new Map<string, Date | null>()

      for (const m of lastMovements) {
        lastMovementMap.set(m.varianteId, m._max.createdAt)
      }

      for (const d of lastSales) {
        if (!lastMovementMap.has(d.varianteId)) {
          lastMovementMap.set(d.varianteId, d.venta.createdAt)
        }
      }

      const data = deadStock.map((v) => ({
        varianteId: v.id,
        producto: v.producto.nombre,
        variante: v.nombreVariante,
        sku: v.sku,
        stockActual: v.stockActual,
        ultimoMovimiento: lastMovementMap.get(v.id) ?? null,
      }))

      // Resumen
      const resumen = {
        totalVariantes: data.length,
        stockTotal: data.reduce((sum, v) => sum + v.stockActual, 0),
      }

      return reply.send(successResponse(data, resumen))
    }
  )
}
