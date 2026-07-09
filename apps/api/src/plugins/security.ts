import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { env } from '../lib/env.js'

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
    max: 100,
    timeWindow: '1 minute',
  })
})
