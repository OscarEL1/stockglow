import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface CategoryDistributionItem {
  categoria: string
  totalValue: number
  totalVariants: number
}

export function useCategoryDistribution() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['category-distribution'],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        '/api/v1/dashboard/category-distribution'
      )
      return res.data as CategoryDistributionItem[]
    },
  })
}
