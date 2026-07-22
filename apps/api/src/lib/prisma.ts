import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

/*
 * HU-095 / CA01 (inyeccion SQL): este proyecto no usa $queryRaw,
 * $executeRaw ni sus variantes *Unsafe (verificado por grep en todo
 * apps/api/src). Todas las consultas pasan por el Query Builder de
 * Prisma (prisma.<modelo>.create/findMany/update/delete...), que
 * parametriza los valores automaticamente y no permite interpolacion
 * de strings en el SQL generado. No se requiere codigo adicional para
 * mitigar inyeccion SQL. Si en el futuro se agrega una query raw,
 * debe usar Prisma.sql`` (tagged template) o $queryRaw con parametros
 * tipados, nunca concatenacion/interpolacion directa de strings.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
