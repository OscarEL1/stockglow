import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface MultipleVariantItem {
  sku: string
  nombreVariante: string
  precioVenta: number
  stockActual: number
  stockMinimo?: number
  fechaCaducidad?: string
}

export interface CreateMultipleVariantsData {
  productoId: string
  variantes: MultipleVariantItem[]
}

export interface CreatedVariantResult {
  fila: number
  id: string
  sku: string
  nombreVariante: string
}

export interface VariantRowError {
  fila: number
  sku: string
  code: string
  message: string
  campo?: string
}

export interface CreateMultipleVariantsResult {
  creadas: CreatedVariantResult[]
  errores: VariantRowError[]
  totalSolicitadas: number
  totalCreadas: number
  totalErrores: number
}

export function useCreateMultipleVariants() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMultipleVariantsData) => {
      const response = await fetchWithAuth(
        getToken,
        '/api/v1/inventory/variants/bulk',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )

      return response.data as CreateMultipleVariantsResult
    },

    onSuccess: async (result) => {
      if (result.totalCreadas === 0) return

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['variants'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['products'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['dashboard-summary'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['alerts'],
        }),
      ])
    },
  })
}
