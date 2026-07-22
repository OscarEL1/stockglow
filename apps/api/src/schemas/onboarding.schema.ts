import { z } from 'zod'
import { sanitizeText } from '../utils/sanitize.js'

export const onboardingStep1Schema = z.object({
  step: z.literal(1),
  nombreTienda: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .transform(sanitizeText),
})

export const onboardingStep2Schema = z.object({
  step: z.literal(2),
  nombre: z
    .string()
    .min(1, 'El nombre del producto es requerido')
    .transform(sanitizeText),
  marca: z
    .string()
    .min(1)
    .optional()
    .transform((value) => (value === undefined ? value : sanitizeText(value))),
  categoria: z
    .string()
    .min(1)
    .optional()
    .transform((value) => (value === undefined ? value : sanitizeText(value))),
})

export const onboardingStep3Schema = z.object({
  step: z.literal(3),
  productoId: z.string().uuid('ID de producto inválido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  nombreVariante: z
    .string()
    .min(1, 'El nombre de la variante es requerido')
    .transform(sanitizeText),
  precioVenta: z.number().positive('El precio debe ser mayor a 0'),
  stockActual: z.number().int().nonnegative('El stock no puede ser negativo'),
})

export const onboardingSchema = z.discriminatedUnion('step', [
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
])

export type OnboardingInput = z.infer<typeof onboardingSchema>
