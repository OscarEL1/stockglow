import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface SaleItem {
  varianteId: string
  cantidad: number
}

export function useCreateSale() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { items: SaleItem[] }) => {
      const res = await fetchWithAuth(getToken, '/api/v1/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['variants'] })
    },
  })
}
