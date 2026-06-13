import fp from 'fastify-plugin'
import fastifyWebsocket from '@fastify/websocket'

// Map de conexiones por tenant: tenantId -> Set de sockets activos
const tenantConnections = new Map<string, Set<any>>()

export const websocketPlugin = fp(async (fastify) => {
  await fastify.register(fastifyWebsocket)

  // Ruta de conexion WebSocket por tenant
  fastify.get(
    '/api/v1/ws/:tenantId',
    {
      websocket: true,
    },
    (socket, request: any) => {
      const { tenantId } = request.params

      // Registrar conexion del tenant
      if (!tenantConnections.has(tenantId)) {
        tenantConnections.set(tenantId, new Set())
      }
      tenantConnections.get(tenantId)!.add(socket)

      fastify.log.info(`WebSocket conectado — tenant: ${tenantId}`)

      socket.on('close', () => {
        tenantConnections.get(tenantId)?.delete(socket)
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

// Funcion para emitir eventos a todos los clientes de un tenant
export function emitToTenant(tenantId: string, event: string, data: unknown) {
  const connections = tenantConnections.get(tenantId)
  if (!connections || connections.size === 0) return

  const message = JSON.stringify({ event, data })
  for (const socket of connections) {
    if (socket.readyState === 1) {
      socket.send(message)
    }
  }
}
