import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'
import type { Variant } from './useVariants'

export type StockMovementType = 'ENTRADA' | 'AJUSTE' | 'MERMA' | 'CADUCADO'

interface AdjustStockData {
  cantidad: number
  tipo: StockMovementType
  motivo?: string
}

interface AdjustStockVariables {
  id: string
  data: AdjustStockData
}

interface AdjustStockResponse {
  success: boolean
  data: Variant
}

export function useAdjustStock() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: AdjustStockVariables) => {
      const response = await fetchWithAuth(
        getToken,
        `/api/v1/inventory/variants/${id}/stock`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      )

      return (response as AdjustStockResponse).data
    },

    onSuccess: (updatedVariant) => {
      queryClient.setQueryData<Variant[]>(['variants'], (currentVariants) => {
        if (!Array.isArray(currentVariants)) {
          return currentVariants
        }

        return currentVariants.map((variant) =>
          variant.id === updatedVariant.id
            ? {
                ...variant,
                ...updatedVariant,
                producto: updatedVariant.producto ?? variant.producto,
              }
            : variant
        )
      })

      queryClient.invalidateQueries({
        queryKey: ['variants'],
      })

      queryClient.invalidateQueries({
        queryKey: ['variant-movements', updatedVariant.id],
      })
    },
  })
}
