import fp from 'fastify-plugin'
import fastifyWebsocket from '@fastify/websocket'
import type { WebSocket } from 'ws'
import { env } from '../lib/env.js'

// Mapa global para rastrear conexiones activas agrupadas por tenantId
const tenantConnections = new Map<string, Set<WebSocket>>()

/**
 * Limpia y elimina sockets cerrados o con errores del mapa de conexiones
 */
function cleanup(tenantId: string, socket: WebSocket) {
  const set = tenantConnections.get(tenantId)
  set?.delete(socket)
  if (set && set.size === 0) {
    tenantConnections.delete(tenantId)
  }
}

export const websocketPlugin = fp(async (fastify) => {
  const allowedOrigin = env.FRONTEND_URL.replace(/\/$/, '')

  // 1. Registro del plugin con configuración de seguridad y manejo de errores
  await fastify.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB
      // Validador de origen estricto para evitar bloqueos proxy en infraestructura cloud
      verifyClient: (info, next) => {
        const origin = info.req.headers.origin
        if (
          !origin ||
          origin === allowedOrigin ||
          origin.includes('localhost')
        ) {
          return next(true)
        }
        return next(false, 401, 'Unauthorized WS Origin')
      },
    },
    // Captura los errores lanzados en los hooks previos (como preHandler) evitando cierres abruptos
    errorHandler: function (error: any, conn, request, reply) {
      fastify.log.error(
        { err: error },
        'Error capturado en el handshake del WebSocket'
      )

      reply.code(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'WEBSOCKET_HANDSHAKE_ERROR',
          message: error.message || 'Error interno en la conexión del servidor',
          statusCode: error.statusCode || 500,
        },
      })
    },
  })

  // 2. Definición del Endpoint de WebSockets
  fastify.get(
    '/api/v1/ws/:tenantId',
    {
      websocket: true,
      preHandler: [
        async (request: any, reply: any) => {
          const queryToken = (request.query as any).token
          if (queryToken) {
            request.headers['authorization'] = `Bearer ${queryToken}`
            request.raw.headers['authorization'] = `Bearer ${queryToken}`
          }
          if (!request.headers['authorization']) {
            return reply.status(401).send({
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Token requerido',
                statusCode: 401,
              },
            })
          }
        },
        fastify.authenticate,
        async (request: any, reply: any) => {
          if ((request.params as any).tenantId !== request.tenantId) {
            return reply.status(403).send({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'No tienes acceso a este tenant',
                statusCode: 403,
              },
            })
          }
        },
      ],
    },
    (connection, request: any) => {
      const { tenantId } = request.params
      const socket = connection as unknown as WebSocket

      // Inicialización del Set para el tenant si es la primera conexión
      if (!tenantConnections.has(tenantId)) {
        tenantConnections.set(tenantId, new Set<WebSocket>())
      }
      tenantConnections.get(tenantId)!.add(socket)

      fastify.log.info({ tenantId }, `WebSocket conectado exitosamente`)

      // Evento de Cierre
      socket.on('close', () => {
        cleanup(tenantId, socket)
        fastify.log.info({ tenantId }, `WebSocket desconectado`)
      })

      // Evento de Error en la comunicación distribuida
      socket.on('error', (err: Error) => {
        fastify.log.error(
          { tenantId, err },
          'Excepción crítica en el túnel del WebSocket'
        )
        cleanup(tenantId, socket)
      })

      // Envío de feedback de éxito inicial
      socket.send(
        JSON.stringify({
          event: 'connected',
          data: { tenantId, timestamp: new Date().toISOString() },
        })
      )
    }
  )
})

/**
 * Emite un evento en tiempo real a todos los clientes activos bajo un tenant específico
 */
export function emitToTenant(tenantId: string, event: string, data: unknown) {
  const connections = tenantConnections.get(tenantId)
  if (!connections || connections.size === 0) return

  const message = JSON.stringify({ event, data })
  const deadSockets: WebSocket[] = []

  for (const socket of connections) {
    if (socket.readyState === 1) {
      // 1 === WebSocket.OPEN
      try {
        socket.send(message)
      } catch {
        deadSockets.push(socket)
      }
    } else {
      deadSockets.push(socket)
    }
  }

  // Purga de sockets rotos o inactivos que fallaron durante la difusión
  for (const socket of deadSockets) {
    connections.delete(socket)
  }
  if (connections.size === 0) {
    tenantConnections.delete(tenantId)
  }
}
