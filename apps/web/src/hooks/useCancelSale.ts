import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export function useCancelSale() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (saleId: string) => {
      const res = await fetchWithAuth(
        getToken,
        `/api/v1/sales/${saleId}/cancel`,
        { method: 'PATCH' }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['variants'] })
    },
  })
}
