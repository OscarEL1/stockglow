import { z } from 'zod'

export const saleItemSchema = z.object({
  varianteId: z.string().uuid(),
  cantidad: z.number().int().positive(),
})

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  descuento: z.number().nonnegative().optional(),
})

export type SaleItem = z.infer<typeof saleItemSchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
