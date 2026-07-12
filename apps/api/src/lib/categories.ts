import { prisma } from './prisma.js'

export async function getTenantCategories(tenantId: string) {
  const [categorias, productos] = await Promise.all([
    prisma.categoria.findMany({
      where: { tenantId },
      select: { nombre: true },
    }),
    prisma.producto.findMany({
      where: { tenantId, categoria: { not: null } },
      select: { categoria: true },
      distinct: ['categoria'],
    }),
  ])

  const nombres = new Set<string>()
  for (const c of categorias) nombres.add(c.nombre)
  for (const p of productos) {
    if (p.categoria) nombres.add(p.categoria)
  }

  return Array.from(nombres).sort()
}
