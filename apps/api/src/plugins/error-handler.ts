import fp from 'fastify-plugin'
import { AppError } from '../lib/errors.js'
import { errorResponse } from '../lib/response.js'

export const errorHandler = fp(async (fastify) => {
  // Rutas no encontradas
  fastify.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .send(errorResponse('NOT_FOUND', 'Ruta no encontrada', 404))
  })

  fastify.setErrorHandler((error, request, reply) => {
    const requestId = request.id

    // Error de negocio conocido
    if (error instanceof AppError) {
      fastify.log.warn({ requestId, code: error.code }, error.message)
      return reply
        .status(error.statusCode)
        .send(errorResponse(error.code, error.message, error.statusCode))
    }

    // Error de validacion Zod via Fastify
    if (error.validation) {
      fastify.log.warn(
        { requestId, validation: error.validation },
        'Validation error'
      )
      return reply
        .status(422)
        .send(
          errorResponse(
            'VALIDATION_ERROR',
            'Los datos enviados no tienen el formato correcto',
            422
          )
        )
    }

    // Error de archivo muy grande
    if (error.statusCode === 413) {
      return reply
        .status(413)
        .send(
          errorResponse(
            'FILE_TOO_LARGE',
            'La imagen no puede superar los 5MB',
            413
          )
        )
    }

    // Error de rate limit
    if (error.statusCode === 429) {
      return reply
        .status(429)
        .send(
          errorResponse(
            'RATE_LIMIT_EXCEEDED',
            'Demasiadas solicitudes, intenta mas tarde',
            429
          )
        )
    }

    // Error inesperado — nunca exponer detalles al cliente
    fastify.log.error({ requestId, err: error }, 'Unexpected error')
    return reply
      .status(500)
      .send(errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500))
  })
})
