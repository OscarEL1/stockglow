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
