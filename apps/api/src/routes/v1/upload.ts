import type { FastifyInstance } from 'fastify'
import { uploadImage } from '../../lib/cloudinary.js'
import { successResponse, errorResponse } from '../../lib/response.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/image',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['upload'],
        summary: 'Subir imagen a Cloudinary',
        description:
          'Recibe una imagen (JPG, PNG o WebP) y la sube a Cloudinary. Tamaño máximo: 5 MB.',
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          201: {
            description: 'Imagen subida correctamente',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  url: { type: 'string', format: 'uri' },
                  publicId: { type: 'string' },
                },
              },
            },
          },
          400: {
            description: 'Archivo no proporcionado',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  statusCode: { type: 'number' },
                },
              },
            },
          },
          422: {
            description: 'Tipo de archivo no permitido',
          },
          413: {
            description: 'Archivo supera el tamaño máximo',
          },
        },
      },
    },
    async (request: any, reply) => {
      const data = await request.file()

      if (!data) {
        return reply
          .status(400)
          .send(
            errorResponse(
              'MISSING_FILE',
              'No se ha proporcionado ningún archivo de imagen',
              400
            )
          )
      }

      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        for await (const _chunk of data.file) {
          // descartar stream para evitar request colgada
        }
        return reply
          .status(422)
          .send(
            errorResponse(
              'INVALID_FILE_TYPE',
              'Solo se permiten imágenes JPG, PNG o WebP',
              422
            )
          )
      }

      const chunks: Buffer[] = []
      for await (const chunk of data.file) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)

      if (buffer.length > MAX_FILE_SIZE) {
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

      const { url, publicId } = await uploadImage(buffer)

      return reply.status(201).send(successResponse({ url, publicId }))
    }
  )
}
