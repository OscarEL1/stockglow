import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

interface CreateProductData {
  nombre: string
  marca?: string
  categoria?: string
}

export function useCreateProduct() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const res = await fetchWithAuth(getToken, '/api/v1/inventory/products', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] })
    },
  })
}
