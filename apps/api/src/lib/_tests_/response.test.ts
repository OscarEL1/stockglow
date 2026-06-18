import { describe, it, expect } from 'vitest'
import { successResponse, errorResponse } from '../response.js'

describe('successResponse', () => {
  it('debe retornar success true con data y meta', () => {
    const result = successResponse({ id: '123' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ id: '123' })
    expect(result.meta.version).toBe('v1')
    expect(result.meta.timestamp).toBeDefined()
  })
})

describe('errorResponse', () => {
  it('debe retornar success false con codigo y mensaje', () => {
    const result = errorResponse('NOT_FOUND', 'Recurso no encontrado', 404)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('NOT_FOUND')
    expect(result.error.statusCode).toBe(404)
  })
})

describe('AppError status codes', () => {
  it('401 para token invalido', () => {
    const result = errorResponse('UNAUTHORIZED', 'Token invalido', 401)
    expect(result.error.statusCode).toBe(401)
  })

  it('403 para sin permiso', () => {
    const result = errorResponse('FORBIDDEN', 'Sin permiso', 403)
    expect(result.error.statusCode).toBe(403)
  })

  it('409 para stock insuficiente', () => {
    const result = errorResponse('INSUFFICIENT_STOCK', 'Sin stock', 409)
    expect(result.error.statusCode).toBe(409)
  })

  it('422 para datos invalidos', () => {
    const result = errorResponse('VALIDATION_ERROR', 'Datos invalidos', 422)
    expect(result.error.statusCode).toBe(422)
  })
})
