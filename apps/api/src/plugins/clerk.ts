import fp from 'fastify-plugin'
import { clerkPlugin, getAuth } from '@clerk/fastify'
import { env } from '../lib/env'
import { prisma } from '../lib/prisma'

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

    // Auto-crear tenant si no existe (ej. webhook no disparado)
    await prisma.tenant.upsert({
      where: { id: orgId },
      update: {},
      create: { id: orgId, nombreTienda: 'Mi tienda' },
    })

    // Buscar usuario por clerk_user_id
    let usuario = await prisma.usuario.findUnique({
      where: { clerkUserId: userId },
    })

    // Si no existe, puede ser porque el clerk_user_id cambió (dev vs prod)
    // Buscar el primer usuario del tenant y actualizar su clerk_user_id
    if (!usuario) {
      const tenantUser = await prisma.usuario.findFirst({
        where: { tenantId: orgId },
        orderBy: { createdAt: 'asc' },
      })
      if (tenantUser) {
        await prisma.usuario.update({
          where: { id: tenantUser.id },
          data: { clerkUserId: userId },
        })
        usuario = { ...tenantUser, clerkUserId: userId }
      }
    }

    // Si aún no existe, crear nuevo
    if (!usuario) {
      await prisma.usuario.create({
        data: {
          clerkUserId: userId,
          tenantId: orgId,
          nombre: 'Usuario',
          email: `${userId}@placeholder.com`,
          rol: orgRole === 'org:admin' ? 'OWNER' : 'EMPLOYEE',
        },
      })
    }

    request.tenantId = orgId
    request.userId = userId
    request.orgRole = orgRole ?? null
  })
})
