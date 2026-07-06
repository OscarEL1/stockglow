import fp from 'fastify-plugin'
import fastifyWebsocket from '@fastify/websocket'
import type { WebSocket } from 'ws'
import { Errors } from '../lib/errors.js'

const tenantConnections = new Map<string, Set<WebSocket>>()

function cleanup(tenantId: string, socket: WebSocket) {
  const set = tenantConnections.get(tenantId)
  set?.delete(socket)
  if (set && set.size === 0) {
    tenantConnections.delete(tenantId)
  }
}

export const websocketPlugin = fp(async (fastify) => {
  await fastify.register(fastifyWebsocket)

  fastify.get(
    '/api/v1/ws/:tenantId',
    {
      websocket: true,
      preHandler: [
        async (request: any, reply: any) => {
          const queryToken = (request.query as { token?: string }).token
          if (queryToken) {
            request.headers.authorization = `Bearer ${queryToken}`
          }
          if (!request.headers.authorization) {
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
        async (request: any) => {
          if (request.params.tenantId !== request.tenantId) {
            throw Errors.FORBIDDEN()
          }
        },
      ],
    },
    (connection, request: any) => {
      const { tenantId } = request.params
      const socket = connection as unknown as WebSocket

      if (!tenantConnections.has(tenantId)) {
        tenantConnections.set(tenantId, new Set<WebSocket>())
      }
      tenantConnections.get(tenantId)!.add(socket)

      fastify.log.info(`WebSocket conectado — tenant: ${tenantId}`)

      socket.on('close', () => {
        cleanup(tenantId, socket)
        fastify.log.info(`WebSocket desconectado — tenant: ${tenantId}`)
      })

      socket.on('error', (err: Error) => {
        fastify.log.error({ tenantId, err }, 'WebSocket error')
        cleanup(tenantId, socket)
      })

      socket.send(
        JSON.stringify({
          event: 'connected',
          data: { tenantId, timestamp: new Date().toISOString() },
        })
      )
    }
  )
})

export function emitToTenant(tenantId: string, event: string, data: unknown) {
  const connections = tenantConnections.get(tenantId)
  if (!connections || connections.size === 0) return

  const message = JSON.stringify({ event, data })
  const deadSockets: WebSocket[] = []

  for (const socket of connections) {
    if (socket.readyState === 1) {
      try {
        socket.send(message)
      } catch (err) {
        deadSockets.push(socket)
      }
    } else {
      deadSockets.push(socket)
    }
  }

  for (const socket of deadSockets) {
    connections.delete(socket)
  }
  if (connections.size === 0) {
    tenantConnections.delete(tenantId)
  }
}
