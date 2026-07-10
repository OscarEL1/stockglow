import 'dotenv/config'
import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import { env } from './lib/env.js'
import { security } from './plugins/security.js'
import { clerkAuth } from './plugins/clerk.js'
import { errorHandler } from './plugins/error-handler.js'
import { swaggerDocs } from './plugins/swagger.js'
import { websocketPlugin } from './plugins/websocket.js'
import { healthRoutes } from './routes/v1/health.js'
import { productRoutes } from './routes/v1/products.js'
import { variantRoutes } from './routes/v1/variants.js'
import { saleRoutes } from './routes/v1/sales.js'
import { uploadRoutes } from './routes/v1/upload.js'
import { webhookRoutes } from './routes/v1/webhooks.js'
import { dashboardRoutes } from './routes/v1/dashboard.js'
import { alertRoutes } from './routes/v1/alerts.js'

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
  trustProxy: true,
})

fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'buffer' },
  (req, body, done) => {
    try {
      ;(req as any).rawBody = body.toString()
      const parsed = body.length > 0 ? JSON.parse(body.toString()) : {}
      done(null, parsed)
    } catch (err: any) {
      done(err)
    }
  }
)

await fastify.register(security)
await fastify.register(clerkAuth)
await fastify.register(errorHandler)
await fastify.register(swaggerDocs)
await fastify.register(websocketPlugin)
await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

await fastify.register(healthRoutes, { prefix: '/api/v1' })
await fastify.register(productRoutes, { prefix: '/api/v1/inventory/products' })
await fastify.register(variantRoutes, { prefix: '/api/v1/inventory/variants' })
await fastify.register(saleRoutes, { prefix: '/api/v1/sales' })
await fastify.register(uploadRoutes, { prefix: '/api/v1/upload' })
await fastify.register(webhookRoutes, { prefix: '/api/v1/webhooks' })
await fastify.register(dashboardRoutes, { prefix: '/api/v1/dashboard' })
await fastify.register(alertRoutes, { prefix: '/api/v1/alerts' })

try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`Server running on port ${env.PORT}`)
  if (env.NODE_ENV === 'development') {
    console.log(`Docs disponibles en http://localhost:${env.PORT}/api/v1/docs`)
    console.log(
      `WebSocket endpoint: ws://localhost:${env.PORT}/api/v1/ws/{tenantId}`
    )
  }
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
