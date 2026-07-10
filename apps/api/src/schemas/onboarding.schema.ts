import { z } from 'zod'

export const onboardingSchema = z.object({
  step: z.number().min(1).max(3),

  // Paso 1: Datos de la Tienda
  nombreTienda: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .optional(),

  // Paso 2: Datos del Producto Base
  nombre: z.string().min(1, 'El nombre del producto es requerido').optional(),
  marca: z.string().min(1, 'La marca es requerida').optional(),
  categoria: z.string().min(1, 'La categoría es requerida').optional(),
  descripcion: z.string().optional().nullable(),

  // Paso 3: Datos de la Variante
  productoId: z.string().uuid('ID de producto inválido').optional(),
  sku: z.string().min(1, 'El SKU es requerido').optional(),
  nombreVariante: z
    .string()
    .min(1, 'El nombre de la variante es requerido')
    .optional(),
  precioVenta: z.number().positive('El precio debe ser mayor a 0').optional(),
  stockInicial: z
    .number()
    .int()
    .nonnegative('El stock no puede ser negativo')
    .optional(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
