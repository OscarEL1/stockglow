import 'dotenv/config'
import Fastify from 'fastify'
import { env } from './lib/env.js'
import { security } from './plugins/security.js'
import { clerkAuth } from './plugins/clerk.js'
import { errorHandler } from './plugins/error-handler.js'
import { swaggerDocs } from './plugins/swagger.js'
import { healthRoutes } from './routes/v1/health.js'
import { productRoutes } from './routes/v1/products.js'
import { variantRoutes } from './routes/v1/variants.js'
import { saleRoutes } from './routes/v1/sales.js'

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

await fastify.register(security)
await fastify.register(clerkAuth)
await fastify.register(errorHandler)
await fastify.register(swaggerDocs)

await fastify.register(healthRoutes, { prefix: '/api/v1' })
await fastify.register(productRoutes, { prefix: '/api/v1/inventory/products' })
await fastify.register(variantRoutes, { prefix: '/api/v1/inventory/variants' })
await fastify.register(saleRoutes, { prefix: '/api/v1/sales' })

try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`Server running on port ${env.PORT}`)
  if (env.NODE_ENV === 'development') {
    console.log(`Docs disponibles en http://localhost:${env.PORT}/api/v1/docs`)
  }
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
