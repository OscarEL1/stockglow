import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import type { FastifyRequest } from 'fastify'
import { env } from '../lib/env.js'

type RateLimitBucket = 'sales' | 'auth' | 'import' | 'default'

/*
 * Limites por minuto y por IP. 'auth' cubre /api/v1/auth (si llega a
 * existir) y /api/v1/onboarding, que hoy es el endpoint post-login mas
 * sensible ya que Clerk maneja el login/registro fuera de este backend.
 */
const RATE_LIMIT_MAX: Record<RateLimitBucket, number> = {
  default: 100,
  sales: 30,
  auth: 10,
  import: 5,
}

function getPath(request: FastifyRequest): string {
  return request.url.split('?')[0] ?? request.url
}

function getRateLimitBucket(request: FastifyRequest): RateLimitBucket {
  if (request.method !== 'POST') {
    return 'default'
  }

  const path = getPath(request)

  if (path.startsWith('/api/v1/sales')) {
    return 'sales'
  }

  if (
    path.startsWith('/api/v1/auth') ||
    path.startsWith('/api/v1/onboarding')
  ) {
    return 'auth'
  }

  if (path.startsWith('/api/v1/inventory/import')) {
    return 'import'
  }

  return 'default'
}

function isExemptFromRateLimit(request: FastifyRequest): boolean {
  if (request.method !== 'GET') {
    return false
  }

  const path = getPath(request)

  return path === '/api/v1/health' || path.startsWith('/api/v1/docs')
}

export const security = fp(async (fastify) => {
  fastify.addHook('onRequest', async (request: any) => {
    if (request.url.includes('/api/v1/ws/') && (request.query as any)?.token) {
      const token = (request.query as any).token
      request.headers.authorization = `Bearer ${token}`
      request.raw.headers.authorization = `Bearer ${token}`
    }
  })

  await fastify.register(helmet)

  await fastify.register(cors, {
    origin: (origin, cb) => {
      const base = env.FRONTEND_URL.replace(/\/$/, '')
      const allowed = [
        base,
        base.replace('https://', 'https://www.'),
        base.replace('https://www.', 'https://'),
      ]
      if (!origin || allowed.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })

  await fastify.register(rateLimit, {
    max: (request) => RATE_LIMIT_MAX[getRateLimitBucket(request)],
    timeWindow: '1 minute',
    allowList: (request) => isExemptFromRateLimit(request),
    // Cada bucket cuenta aparte por IP, para que el consumo de un
    // endpoint sensible no comparta cupo con el limite global.
    keyGenerator: (request) => `${request.ip}:${getRateLimitBucket(request)}`,
    errorResponseBuilder: (_request, context) => {
      const retryAfter = Math.ceil(context.ttl / 1000)

      const error = new Error(
        `Has excedido el limite de peticiones. Intenta de nuevo en ${retryAfter} segundos.`
      ) as Error & { statusCode: number; retryAfter: number }

      error.statusCode = context.statusCode
      error.retryAfter = retryAfter

      return error
    },
  })
})
