import { prisma } from './prisma.js'

/**
 * Asegura que exista un registro de usuario en la BD para el tenant dado.
 * Si no existe, lo crea. Si el nombre es placeholder, intenta actualizarlo.
 */
export async function ensureUsuario(
  tenantId: string,
  clerkUserId: string,
  orgRole?: string
) {
  const existing = await prisma.usuario.findFirst({
    where: { tenantId, clerkUserId },
    select: { id: true, nombre: true },
  })

  if (existing) return { id: existing.id }

  await prisma.tenant.upsert({
    where: { id: tenantId },
    create: { id: tenantId, nombreTienda: 'Tienda' },
    update: {},
  })

  const email = `user-${clerkUserId.slice(-8)}@stockglow.local`

  const user = await prisma.usuario.upsert({
    where: { clerkUserId },
    create: {
      tenantId,
      clerkUserId,
      nombre: 'Usuario',
      email,
      rol: orgRole === 'org:admin' ? 'OWNER' : 'EMPLOYEE',
    },
    update: {},
    select: { id: true, nombre: true },
  })

  if (user.nombre === 'Usuario') {
    try {
      const { clerkClient } = await import('@clerk/fastify')
      const clerkUser = await clerkClient.users.getUser(clerkUserId)
      const nombre =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
        null
      if (nombre) {
        await prisma.usuario.update({
          where: { clerkUserId },
          data: { nombre },
        })
        return { id: user.id }
      }
    } catch {
      // Clerk no disponible, mantener nombre placeholder
    }
  }

  return { id: user.id }
}
