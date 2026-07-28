import { z } from 'zod'

export const createSupplierSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(150),
  telefono: z.string().max(30).optional().nullable(),
  correo: z.string().email('Correo inválido').max(100).optional().nullable(),
})

export const updateSupplierSchema = createSupplierSchema.partial()

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
