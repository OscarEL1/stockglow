import { z } from 'zod'

export const createProductSchema = z.object({
  nombre: z.string().min(1).max(150),
  marca: z.string().max(50).optional(),
  categoria: z.string().max(50).optional(),
  descripcion: z.string().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
