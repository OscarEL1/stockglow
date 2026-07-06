import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { errorHandler } from '../error-handler.js'
import { AppError } from '../../lib/errors.js'

/**
 * Construye un servidor Fastify mínimo con el plugin errorHandler registrado
 * y una ruta auxiliar que simula el escenario indicado por `scenario`.
 */
async function buildApp(
  scenario: 'appError' | 'validationError' | 'unexpectedError'
) {
  const app = Fastify({ logger: false })

  await app.register(errorHandler)

  if (scenario === 'appError') {
    app.get('/test/app-error', async () => {
      throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado', 404)
    })
  }

  if (scenario === 'validationError') {
    app.post(
      '/test/validation',
      {
        schema: {
          body: {
            type: 'object',
            required: ['nombre'],
            properties: {
              nombre: { type: 'string' },
            },
          },
        },
      },
      async () => ({ ok: true })
    )
  }

  if (scenario === 'unexpectedError') {
    app.get('/test/crash', async () => {
      throw new Error('Algo explotó internamente: secret-key=abc123')
    })
  }

  return app
}

// ─── CA01 ────────────────────────────────────────────────────────────────────
describe('CA01 — AppError retorna formato estándar de error', () => {
  it('debe retornar success:false con {code, message, statusCode}', async () => {
    const app = await buildApp('appError')

    const response = await app.inject({
      method: 'GET',
      url: '/test/app-error',
    })

    expect(response.statusCode).toBe(404)

    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND')
    expect(body.error.message).toBe('Producto no encontrado')
    expect(body.error.statusCode).toBe(404)
  })

  it('no debe incluir campo "data" en una respuesta de error', async () => {
    const app = await buildApp('appError')

    const response = await app.inject({
      method: 'GET',
      url: '/test/app-error',
    })

    const body = JSON.parse(response.body)
    expect(body.data).toBeUndefined()
  })
})

// ─── CA02 ────────────────────────────────────────────────────────────────────
describe('CA02 — Error de validación retorna 422', () => {
  it('debe retornar 422 cuando el body no cumple el schema', async () => {
    const app = await buildApp('validationError')

    const response = await app.inject({
      method: 'POST',
      url: '/test/validation',
      payload: {}, // falta el campo requerido "nombre"
    })

    expect(response.statusCode).toBe(422)

    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.statusCode).toBe(422)
  })
})

// ─── CA03 ────────────────────────────────────────────────────────────────────
describe('CA03 — Error inesperado retorna 500 sin exponer detalles', () => {
  it('debe retornar 500 con mensaje genérico', async () => {
    const app = await buildApp('unexpectedError')

    const response = await app.inject({
      method: 'GET',
      url: '/test/crash',
    })

    expect(response.statusCode).toBe(500)

    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.statusCode).toBe(500)
  })

  it('no debe exponer el stack trace ni detalles internos al cliente', async () => {
    const app = await buildApp('unexpectedError')

    const response = await app.inject({
      method: 'GET',
      url: '/test/crash',
    })

    const body = JSON.parse(response.body)
    const bodyStr = JSON.stringify(body)

    // El mensaje de error original contiene "secret-key=abc123", no debe aparecer
    expect(bodyStr).not.toContain('secret-key')
    expect(bodyStr).not.toContain('stack')
    expect(bodyStr).not.toContain('explotó')
  })
})

// ─── 404 Handler ─────────────────────────────────────────────────────────────
describe('Ruta no encontrada — 404 con formato estándar', () => {
  it('debe retornar 404 con formato {success:false, error:{code, message, statusCode}}', async () => {
    const app = await buildApp('appError') // cualquier escenario sirve

    const response = await app.inject({
      method: 'GET',
      url: '/ruta-que-no-existe',
    })

    expect(response.statusCode).toBe(404)

    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
    expect(body.error.statusCode).toBe(404)
  })
})
