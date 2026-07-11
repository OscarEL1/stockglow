import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'
import type { Variant } from './useVariants'

interface UpdateVariantData {
  sku: string
  nombreVariante: string
  precioVenta: number
  stockMinimo: number
  fechaCaducidad: string | null
  imagenUrl?: string | null
}

interface UpdateVariantVariables {
  id: string
  data: UpdateVariantData
}

interface UpdateVariantResponse {
  success: boolean
  data: Variant
}

export function useUpdateVariant() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateVariantVariables) => {
      const response = await fetchWithAuth(
        getToken,
        `/api/v1/inventory/variants/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      )

      return (response as UpdateVariantResponse).data
    },

    onSuccess: (updatedVariant) => {
      if (!updatedVariant?.id) {
        queryClient.invalidateQueries({
          queryKey: ['variants'],
        })

        return
      }

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
    },
  })
}
