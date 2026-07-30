import { z } from 'zod'
import { sanitizeText } from '../utils/sanitize.js'

export const createVariantSchema = z.object({
  productoId: z.string().uuid(),
  sku: z.string().trim().min(1).max(50),
  nombreVariante: z.string().min(1).max(100).transform(sanitizeText),
  imagenUrl: z.string().url().nullable().optional(),
  precioVenta: z.number().positive(),
  costoUnitario: z.number().positive().nullable().optional(),
  stockActual: z.number().int().min(0).default(0),
  stockMinimo: z.number().int().min(0).optional(),
  fechaCaducidad: z.string().date().nullable().optional(),
})

export const updateVariantSchema = createVariantSchema.partial().omit({
  productoId: true,
  stockActual: true,
})

export const adjustStockSchema = z.object({
  cantidad: z.number().int(),
  tipo: z.enum(['ENTRADA', 'AJUSTE', 'MERMA', 'CADUCADO']),
  motivo: z
    .string()
    .max(255)
    .optional()
    .transform((value) => (value === undefined ? value : sanitizeText(value))),
})

export const bulkVariantItemSchema = createVariantSchema.omit({
  productoId: true,
})

export const createBulkVariantsSchema = z.object({
  productoId: z.string().uuid(),

  variantes: z
    .array(z.unknown())
    .min(1, 'Debes agregar al menos una variante')
    .max(10, 'Solo puedes registrar hasta 10 variantes por operación'),
})

export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>
export type AdjustStockInput = z.infer<typeof adjustStockSchema>
export type BulkVariantItemInput = z.infer<typeof bulkVariantItemSchema>
export type CreateBulkVariantsInput = z.infer<typeof createBulkVariantsSchema>
