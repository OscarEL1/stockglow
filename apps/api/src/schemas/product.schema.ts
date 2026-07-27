import { z } from 'zod'
import { sanitizeText } from '../utils/sanitize.js'

export const createProductSchema = z.object({
  nombre: z.string().min(1).max(150).transform(sanitizeText),
  marca: z
    .string()
    .max(50)
    .optional()
    .transform((value) => (value === undefined ? value : sanitizeText(value))),
  categoria: z
    .string()
    .max(50)
    .optional()
    .transform((value) => (value === undefined ? value : sanitizeText(value))),
  descripcion: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? value : sanitizeText(value))),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
