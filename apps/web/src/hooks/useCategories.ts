import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export function useCategories() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        '/api/v1/inventory/products/categories'
      )
      return res.data as string[]
    },
  })
}
