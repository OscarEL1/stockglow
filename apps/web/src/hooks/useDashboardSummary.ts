import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface DashboardSummary {
  totalProducts: number
  totalVariants: number
  totalValue: number
  totalAlerts: number
  totalVentasHoy: number
  disponibles: number
  stockBajo: number
  agotados: number
}

export function useDashboardSummary() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/dashboard/summary')
      return res.data as DashboardSummary
    },
  })
}
