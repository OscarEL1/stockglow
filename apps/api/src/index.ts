import 'dotenv/config'
import Fastify from 'fastify'
import { env } from './lib/env.js'
import { clerkAuth } from './plugins/clerk.js'
import { security } from './plugins/security.js'
import { healthRoutes } from './routes/v1/health.js'

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

await fastify.register(security)
await fastify.register(clerkAuth)
await fastify.register(healthRoutes, { prefix: '/api/v1' })

try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`Server running on port ${env.PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
