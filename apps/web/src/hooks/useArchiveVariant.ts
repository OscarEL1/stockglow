import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'
import type { Variant } from './useVariants'

interface ArchiveVariantResponse {
  success: boolean
  data: Variant
}

export function useArchiveVariant() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(
        getToken,
        `/api/v1/inventory/variants/${id}/archive`,
        {
          method: 'PATCH',
        }
      )

      return (response as ArchiveVariantResponse).data
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['variants'],
      })
    },
  })
}
