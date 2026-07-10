import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface StockMovement {
  id: string
  tipo: 'ENTRADA' | 'AJUSTE' | 'MERMA' | 'CADUCADO'
  cantidad: number
  motivo: string | null
  createdAt: string
  usuario: {
    nombre: string
    email: string
  }
}

export function useVariantMovements(variantId: string | null) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['variantMovements', variantId],
    queryFn: async () => {
      if (!variantId) return []
      const res = await fetchWithAuth(
        getToken,
        `/api/v1/inventory/variants/${variantId}/movements`
      )
      return res.data as StockMovement[]
    },
    enabled: !!variantId,
  })
}
