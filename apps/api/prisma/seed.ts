import { PrismaClient, Rol } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const kaprich = await prisma.tenant.upsert({
    where: { id: 'tenant-kaprich-001' },
    update: {},
    create: {
      id: 'tenant-kaprich-001',
      nombreTienda: 'Kaprich Estilista',
      planSuscripcion: 'basic',
    },
  })

  const beautycare = await prisma.tenant.upsert({
    where: { id: 'tenant-beautycare-002' },
    update: {},
    create: {
      id: 'tenant-beautycare-002',
      nombreTienda: 'BeautyCare',
      planSuscripcion: 'basic',
    },
  })

  await prisma.usuario.upsert({
    where: { clerkUserId: 'clerk-sadai-001' },
    update: {},
    create: {
      tenantId: kaprich.id,
      clerkUserId: 'clerk-sadai-001',
      nombre: 'Sadai Sanchez',
      email: 'sadai@kaprich.com',
      rol: Rol.OWNER,
    },
  })

  const labial = await prisma.producto.create({
    data: {
      tenantId: kaprich.id,
      nombre: 'Labial Matte',
      marca: 'LOreal',
      categoria: 'Labiales',
    },
  })

  await prisma.varianteProducto.create({
    data: {
      tenantId: kaprich.id,
      productoId: labial.id,
      sku: 'LAB-MATTE-04',
      nombreVariante: 'Fucsia Intenso',
      precioVenta: 120.0,
      stockActual: 10,
      stockMinimo: 3,
    },
  })

  const base = await prisma.producto.create({
    data: {
      tenantId: beautycare.id,
      nombre: 'Base Liquida',
      marca: 'Maybelline',
      categoria: 'Bases',
    },
  })

  await prisma.varianteProducto.create({
    data: {
      tenantId: beautycare.id,
      productoId: base.id,
      sku: 'BASE-LIQ-220',
      nombreVariante: 'Tono 220 Natural Beige',
      precioVenta: 185.0,
      stockActual: 5,
      stockMinimo: 2,
    },
  })

  console.log('Seed completado.')
  console.log(`Tenant 1: ${kaprich.nombreTienda}`)
  console.log(`Tenant 2: ${beautycare.nombreTienda}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
