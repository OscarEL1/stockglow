import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from '../lib/env.js'

export const swaggerDocs = fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'StockGlow API',
        description: 'SaaS de gestión de inventario para tiendas de cosméticos',
        version: 'v1',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Servidor de desarrollo',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT de Clerk con tenant_id y rol',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'health', description: 'Estado del servidor' },
        { name: 'inventory', description: 'Gestión de productos y variantes' },
        { name: 'sales', description: 'Procesamiento de ventas' },
      ],
    },
  })

  if (env.NODE_ENV === 'development') {
    await fastify.register(swaggerUi, {
      routePrefix: '/api/v1/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    })
  }
})
