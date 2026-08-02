import { prisma } from './prisma.js'

/**
 * Asegura que exista un registro de usuario en la BD para el tenant dado.
 * Si no existe, lo crea con datos placeholder.
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

  const email = `user-${clerkUserId.slice(-8)}@stockglow.local`

  return prisma.usuario.upsert({
    where: { clerkUserId },
    create: {
      tenantId,
      clerkUserId,
      nombre: 'Usuario',
      email,
      rol: orgRole === 'org:admin' ? 'OWNER' : 'EMPLOYEE',
    },
    update: {},
    select: { id: true },
  })
}
