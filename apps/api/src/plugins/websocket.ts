import fp from 'fastify-plugin'
import fastifyWebsocket from '@fastify/websocket'

const tenantConnections = new Map<string, Set<any>>()

export const websocketPlugin = fp(async (fastify) => {
  await fastify.register(fastifyWebsocket)

  fastify.get(
    '/api/v1/ws/:tenantId',
    {
      websocket: true,
    },
    (connection, request: any) => {
      const { tenantId } = request.params
      const socket = connection.socket

      // Registrar conexion del tenant
      if (!tenantConnections.has(tenantId)) {
        tenantConnections.set(tenantId, new Set())
      }
      tenantConnections.get(tenantId)!.add(socket)

      fastify.log.info(`WebSocket conectado — tenant: ${tenantId}`)

      socket.on('close', () => {
        const set = tenantConnections.get(tenantId)
        set?.delete(socket)
        // Limpiar el tenant del Map si no quedan conexiones
        if (set && set.size === 0) {
          tenantConnections.delete(tenantId)
        }
        fastify.log.info(`WebSocket desconectado — tenant: ${tenantId}`)
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
        // Socket falló — marcarlo para purgar
        deadSockets.push(socket)
      }
    } else {
      // Socket no está abierto — purgar
      deadSockets.push(socket)
    }
  }

  // Purgar sockets muertos
  for (const socket of deadSockets) {
    connections.delete(socket)
  }
  if (connections.size === 0) {
    tenantConnections.delete(tenantId)
  }
}
