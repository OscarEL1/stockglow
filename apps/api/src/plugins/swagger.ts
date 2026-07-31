import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

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
        { name: 'inventory', description: 'Productos y variantes' },
        { name: 'sales', description: 'Ventas y cancelaciones' },
        { name: 'dashboard', description: 'Métricas y resumen del dashboard' },
        { name: 'alerts', description: 'Alertas de stock y caducidad' },
        { name: 'reports', description: 'Reportes y analytics' },
        { name: 'settings', description: 'Configuración de la tienda' },
        { name: 'onboarding', description: 'Wizard de bienvenida' },
        { name: 'upload', description: 'Subida de archivos' },
        { name: 'import', description: 'Importación masiva de inventario' },
      ],
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/api/v1/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })
})
