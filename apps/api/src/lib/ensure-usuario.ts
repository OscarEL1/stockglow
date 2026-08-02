import { clerkClient } from '@clerk/fastify'
import { prisma } from './prisma.js'

/**
 * Asegura que exista un registro de usuario en la BD para el tenant dado.
 * Si no existe, lo crea usando los datos de Clerk.
 * Retorna el usuario (con solo `id`).
 */
export async function ensureUsuario(
  tenantId: string,
  clerkUserId: string,
  orgRole?: string
) {
  const existing = await prisma.usuario.findFirst({
    where: { tenantId, clerkUserId },
    select: { id: true },
  })

  if (existing) return existing

  await prisma.tenant.upsert({
    where: { id: tenantId },
    create: { id: tenantId, nombreTienda: 'Tienda' },
    update: {},
  })

  const clerkUser = await clerkClient.users.getUser(clerkUserId)
  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress ??
    `${clerkUserId}@placeholder.com`
  const nombre =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    'Usuario'

  return prisma.usuario.upsert({
    where: { clerkUserId },
    create: {
      tenantId,
      clerkUserId,
      nombre,
      email,
      rol: orgRole === 'org:admin' ? 'OWNER' : 'EMPLOYEE',
    },
    update: {},
    select: { id: true },
  })
}
