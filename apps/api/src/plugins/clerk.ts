import fp from 'fastify-plugin'
import { clerkPlugin, getAuth } from '@clerk/fastify'
import { env } from '../lib/env'

export const clerkAuth = fp(async (fastify) => {
  fastify.register(clerkPlugin, {
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  })

  fastify.decorate('authenticate', async (request: any, reply: any) => {
    const { userId, orgId } = getAuth(request)
    if (!userId || !orgId) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'Unauthorized',
          message: 'Token JWT ausente o invalido',
          statusCode: 401,
        },
      })
    }
    request.tenantId = orgId
    request.userId = userId
  })
})
