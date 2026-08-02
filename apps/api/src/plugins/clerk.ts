import fp from 'fastify-plugin'
import { clerkPlugin, getAuth, clerkClient } from '@clerk/fastify'
import { env } from '../lib/env'
import { prisma } from '../lib/prisma.js'

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

    // Auto-create tenant if it doesn't exist
    await prisma.tenant.upsert({
      where: { id: orgId },
      create: {
        id: orgId,
        nombreTienda: 'Tenant',
      },
      update: {},
    })

    // Auto-create usuario if it doesn't exist
    const existingUser = await prisma.usuario.findFirst({
      where: {
        tenantId: orgId,
        clerkUserId: userId,
      },
    })

    if (!existingUser) {
      const clerkUser = await clerkClient.users.getUser(userId)
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? `${userId}@placeholder.com`
      const nombre = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Usuario'

      await prisma.usuario.upsert({
        where: { clerkUserId: userId },
        create: {
          tenantId: orgId,
          clerkUserId: userId,
          nombre,
          email,
          rol: orgRole === 'org:admin' ? 'OWNER' : 'EMPLOYEE',
        },
        update: {
          nombre,
        },
      })
    }
  })
})
