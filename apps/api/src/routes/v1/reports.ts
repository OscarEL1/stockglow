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
  fastify.get(
    '/sales-metrics',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reports'],
        summary: 'Métricas de ventas por periodo',
        description:
          'Retorna métricas de ventas para hoy, esta semana y este mes. Incluye comparación con el mes anterior.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Métricas de ventas',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  hoy: {
                    type: 'object',
                    properties: {
                      numeroVentas: { type: 'number' },
                      montoTotal: { type: 'number' },
                      fechaInicio: { type: 'string' },
                      fechaFin: { type: 'string' },
                    },
                  },
                  semana: {
                    type: 'object',
                    properties: {
                      numeroVentas: { type: 'number' },
                      montoTotal: { type: 'number' },
                      fechaInicio: { type: 'string' },
                      fechaFin: { type: 'string' },
                    },
                  },
                  mes: {
                    type: 'object',
                    properties: {
                      numeroVentas: { type: 'number' },
                      montoTotal: { type: 'number' },
                      fechaInicio: { type: 'string' },
                      fechaFin: { type: 'string' },
                      montoMesAnterior: { type: 'number' },
                      porcentajeCambio: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
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

  fastify.get(
    '/sales-by-day',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reports'],
        summary: 'Ventas por día (últimos 7 días)',
        description:
          'Retorna el total de ventas completadas por día durante los últimos 7 días.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Ventas diarias',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', description: 'Fecha YYYY-MM-DD' },
                    label: { type: 'string', description: 'Fecha legible' },
                    total: { type: 'number', description: 'Monto total del día' },
                  },
                },
              },
            },
          },
        },
      },
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

  fastify.get(
    '/top-products',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reports'],
        summary: 'Productos más vendidos',
        description:
          'Retorna los 5 productos con más unidades vendidas en el periodo indicado (semana o mes).',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['week', 'month'],
              description: 'Periodo de análisis',
              default: 'month',
            },
          },
        },
        response: {
          200: {
            description: 'Top productos',
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
                    imagenUrl: { type: 'string', nullable: true },
                    cantidadVendida: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
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

  fastify.get(
    '/employees-ranking',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['reports'],
        summary: 'Ranking de empleadas por ventas',
        description:
          'Retorna el ranking de empleadas ordenado por número de ventas en el mes actual. Solo accesible para administradores (org:admin).',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Ranking de empleadas',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    usuarioId: { type: 'string' },
                    nombre: { type: 'string' },
                    ventas: { type: 'number' },
                    montoTotal: { type: 'number' },
                  },
                },
              },
            },
          },
          403: {
            description: 'No tiene permisos de administrador',
          },
        },
      },
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
}
