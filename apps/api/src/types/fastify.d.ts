import '@fastify/jwt'
import 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }

  interface FastifyRequest {
    tenantId: string
    userId: string
  }
}
