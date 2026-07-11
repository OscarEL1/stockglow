import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

interface CreateVariantData {
  productoId: string
  sku: string
  nombreVariante: string
  precioVenta: number
  stockActual: number
  stockMinimo: number
  imagenUrl?: string
  fechaCaducidad?: string
}

export function useCreateVariant() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateVariantData) => {
      const res = await fetchWithAuth(getToken, '/api/v1/inventory/variants', {
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
