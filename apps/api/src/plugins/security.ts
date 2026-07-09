import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { env } from '../lib/env.js'

export const security = fp(async (fastify) => {
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
