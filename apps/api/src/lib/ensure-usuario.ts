import { clerkClient } from '@clerk/fastify'
import { prisma } from './prisma.js'

/**
 * Asegura que exista un registro de usuario en la BD para el tenant dado.
 * Si no existe, lo crea. Si Clerk falla, crea un registro con datos placeholder.
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

  let nombre = 'Usuario'
  let email = `${clerkUserId.slice(-8)}@placeholder.stockglow`

  try {
    const clerkUser = await clerkClient.users.getUser(clerkUserId)
    email =
      clerkUser.emailAddresses?.[0]?.emailAddress ?? email
    nombre =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      nombre
  } catch {
    // Clerk no disponible o usuario no encontrado, usar datos placeholder
  }

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
