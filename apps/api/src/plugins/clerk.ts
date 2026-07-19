import fp from 'fastify-plugin'
import { clerkPlugin, getAuth } from '@clerk/fastify'
import { env } from '../lib/env'

export const clerkAuth = fp(async (fastify) => {
  fastify.register(clerkPlugin, {
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  })

  fastify.decorate('authenticate', async (request: any, reply: any) => {
    const auth = getAuth(request)

    const { userId, orgId, orgRole } = auth

    if (!userId || !orgId) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token JWT ausente o inválido',
          statusCode: 401,
        },
      })
    }

    request.tenantId = orgId
    request.userId = userId
    request.orgRole = orgRole ?? null
  })
})
