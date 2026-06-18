import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface Product {
  id: string
  nombre: string
  marca: string | null
  categoria: string | null
}

export function useProducts() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/inventory/products')
      return res.data as Product[]
    },
  })
}
