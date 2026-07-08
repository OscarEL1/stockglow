import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { env } from '../lib/env.js'

export const security = fp(async (fastify) => {
  await fastify.register(helmet)

  const allowedOrigin = env.FRONTEND_URL.replace(/\/$/, '') // Remove trailing slash if present

  await fastify.register(cors, {
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })
})
