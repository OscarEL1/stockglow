import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'
import type { PaymentMethod } from './useSales'

export interface SaleItem {
  varianteId: string
  cantidad: number
}

export interface CreateSaleData {
  items: SaleItem[]
  descuento?: number
  metodoPago: PaymentMethod
  notas?: string | null
}

export function useCreateSale() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSaleData) => {
      const res = await fetchWithAuth(getToken, '/api/v1/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      return res.data
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['variants'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      ])
    },
  })
}
