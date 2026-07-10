import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'

export async function alertRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const todasLasVariantes = await prisma.varianteProducto.findMany({
        where: { tenantId: request.tenantId },
        include: { producto: true },
      })

      const alertasFormateadas: any[] = []
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      console.log(`--- REVISANDO ALERTAS PARA TENANT: ${request.tenantId} ---`)
      console.log(`Total de variantes encontradas: ${todasLasVariantes.length}`)

      todasLasVariantes.forEach((v) => {
        // 1. LÓGICA DE STOCK BAJO
        const actual = v.stockActual ?? 0
        const minimo = v.stockMinimo ?? 0
        if (actual <= minimo || actual === 0) {
          alertasFormateadas.push({
            id: `auto-stock-${v.id}`,
            tipo: 'BAJO_STOCK',
            createdAt: v.updatedAt.toISOString(),
            variante: {
              id: v.id,
              sku: v.sku,
              nombreVariante: v.nombreVariante || 'Estándar',
              stockActual: v.stockActual,
              stockMinimo: v.stockMinimo,
              producto: {
                nombre: v.producto.nombre,
                marca: v.producto.marca || null,
              },
            },
          })
        }

        // 2. LÓGICA DE CADUCIDAD REFORZADA (CA01)
        // Imprimimos en la consola lo que viene de la BD para ver por qué no entra
        console.log(
          `Producto: ${v.producto.nombre} | SKU: ${v.sku} | fechaCaducidad en BD:`,
          v.fechaCaducidad
        )

        if (v.fechaCaducidad) {
          const fechaCaducidadUTC = new Date(v.fechaCaducidad)
          const utcCaducidad = Date.UTC(
            fechaCaducidadUTC.getUTCFullYear(),
            fechaCaducidadUTC.getUTCMonth(),
            fechaCaducidadUTC.getUTCDate()
          )
          const utcHoy = Date.UTC(
            hoy.getUTCFullYear(),
            hoy.getUTCMonth(),
            hoy.getUTCDate()
          )

          const milisegundosPorDia = 1000 * 60 * 60 * 24
          const diasRestantes = Math.floor(
            (utcCaducidad - utcHoy) / milisegundosPorDia
          )

          console.log(
            `-> Días restantes calculados para ${v.producto.nombre}: ${diasRestantes}`
          )

          if (diasRestantes <= 30) {
            alertasFormateadas.push({
              id: `auto-caducidad-${v.id}`,
              tipo: 'CADUCIDAD_PROXIMA',
              createdAt: v.updatedAt.toISOString(),
              diasRestantes,
              fechaCaducidad: v.fechaCaducidad.toISOString(),
              variante: {
                id: v.id,
                sku: v.sku,
                nombreVariante: v.nombreVariante || 'Estándar',
                stockActual: v.stockActual,
                stockMinimo: v.stockMinimo,
                producto: {
                  nombre: v.producto.nombre,
                  marca: v.producto.marca || null,
                },
              },
            })
          }
        }
      })

      // Ordenar urgencias primero
      alertasFormateadas.sort((a, b) => {
        if (a.tipo === 'CADUCIDAD_PROXIMA' && b.tipo === 'CADUCIDAD_PROXIMA') {
          return a.diasRestantes - b.diasRestantes
        }
        if (a.tipo === 'CADUCIDAD_PROXIMA' && b.tipo !== 'CADUCIDAD_PROXIMA')
          return -1
        if (a.tipo !== 'CADUCIDAD_PROXIMA' && b.tipo === 'CADUCIDAD_PROXIMA')
          return 1
        return 0
      })

      return reply.send(successResponse(alertasFormateadas))
    }
  )

  fastify.patch(
    '/:id/read',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      return reply.send(successResponse({ id: request.params.id, leida: true }))
    }
  )
}
