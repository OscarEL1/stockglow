import { describe, it, expect } from 'vitest'
import { errorResponse } from '../../../lib/response.js'

describe('POST /api/v1/upload/image', () => {
  it('responde 401 sin token jwt', () => {
    const result = errorResponse(
      'UNAUTHORIZED',
      'Token JWT ausente o invalido',
      401
    )
    expect(result.success).toBe(false)
    expect(result.error.statusCode).toBe(401)
  })

  it('responde 400 si no llega archivo', () => {
    const result = errorResponse(
      'MISSING_FILE',
      'Se requiere un archivo de imagen',
      400
    )
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('MISSING_FILE')
  })

  it('responde 422 si el tipo de archivo no es valido', () => {
    const result = errorResponse(
      'INVALID_FILE_TYPE',
      'Solo se permiten imágenes JPG, PNG o WebP',
      422
    )
    expect(result.success).toBe(false)
    expect(result.error.statusCode).toBe(422)
  })

  it('responde 413 si el archivo supera 5mb', () => {
    const result = errorResponse(
      'FILE_TOO_LARGE',
      'La imagen no puede superar los 5MB',
      413
    )
    expect(result.success).toBe(false)
    expect(result.error.statusCode).toBe(413)
  })
})
