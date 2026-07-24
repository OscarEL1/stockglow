import { z } from 'zod'
import { sanitizeText } from '../utils/sanitize.js'

export const paymentMethodSchema = z.enum([
  'EFECTIVO',
  'TARJETA',
  'TRANSFERENCIA',
])

export const saleItemSchema = z.object({
  varianteId: z.string().uuid(),
  cantidad: z.number().int().positive(),
})

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  descuento: z.number().nonnegative().optional(),
  metodoPago: paymentMethodSchema,
  notas: z
    .string()
    .max(500, 'La nota no puede exceder 500 caracteres')
    .optional()
    .nullable()
    .transform((v) => (v == null ? v : sanitizeText(v)))
})

export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type SaleItem = z.infer<typeof saleItemSchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
