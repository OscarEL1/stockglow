import fp from 'fastify-plugin'
import fastifyWebsocket from '@fastify/websocket'
import { Errors } from '../lib/errors.js'

const tenantConnections = new Map<string, Set<any>>()

function cleanup(tenantId: string, socket: any) {
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
      const socket = connection.socket

      if (!tenantConnections.has(tenantId)) {
        tenantConnections.set(tenantId, new Set())
      }
      tenantConnections.get(tenantId)!.add(socket)

      fastify.log.info(`WebSocket conectado — tenant: ${tenantId}`)

      socket.on('close', () => {
        cleanup(tenantId, socket)
        fastify.log.info(`WebSocket desconectado — tenant: ${tenantId}`)
      })

      socket.on('error', (err: Error) => {
        fastify.log.error(
          `WebSocket error — tenant: ${tenantId} — ${err.message}`
        )
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
  const deadSockets: any[] = []

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
