import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface Variant {
  id: string
  sku: string
  nombreVariante: string
  precioVenta: string
  stockActual: number
  stockMinimo: number
  imagenUrl: string | null
  producto: {
    nombre: string
    marca: string | null
  }
}

export function useVariants() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['variants'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/inventory/variants')
      return res.data as Variant[]
    },
  })
}
