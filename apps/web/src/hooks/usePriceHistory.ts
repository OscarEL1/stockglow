import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface PriceHistoryEntry {
  id: string
  varianteId: string
  precioAnterior: string
  precioNuevo: string
  createdAt: string
}

export function usePriceHistory(varianteId: string) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['price-history', varianteId],
    queryFn: async () => {
      const url = `/api/v1/inventory/variants/${varianteId}/price-history`
      const res = await fetchWithAuth(getToken, url)
      return res.data as PriceHistoryEntry[]
    },
  })
}
