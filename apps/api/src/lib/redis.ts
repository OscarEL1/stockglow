import { Redis } from '@upstash/redis'
import { env } from './env.js'

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export async function acquireLock(
  key: string,
  ttlSeconds: number = 5
): Promise<boolean> {
  const result = await redis.set(key, '1', {
    nx: true,
    ex: ttlSeconds,
  })
  return result === 'OK'
}

export async function releaseLock(key: string): Promise<void> {
  await redis.del(key)
}

export function lockKey(tenantId: string, sku: string): string {
  return `lock:${tenantId}:${sku}`
}
