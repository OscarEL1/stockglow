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

    // [DEV ONLY FIX] Auto-crear Tenant y Usuario para desarrollo local
    // ya que los webhooks no se ejecutan en localhost sin ngrok
    const { prisma } = await import('../lib/prisma.js')
    await prisma.tenant.upsert({
      where: { id: orgId },
      update: {},
      create: {
        id: orgId,
        nombreTienda: 'Mi Tienda Local',
        planSuscripcion: 'basic',
      },
    })

    await prisma.usuario.upsert({
      where: { clerkUserId: userId },
      update: {},
      create: {
        tenantId: orgId,
        clerkUserId: userId,
        nombre: 'Usuario de Pruebas',
        email: 'dev@test.com',
        rol: 'OWNER',
      },
    })

    request.tenantId = orgId
    request.userId = userId
  })
})
