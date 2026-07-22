import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface SalesPeriodMetric {
  numeroVentas: number
  montoTotal: number
  fechaInicio: string
  fechaFin: string
}

export interface SalesMetrics {
  hoy: SalesPeriodMetric
  semana: SalesPeriodMetric
  mes: SalesPeriodMetric
}

export function useSalesMetrics() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['sales-metrics'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/reports/sales-metrics')
      return res.data as SalesMetrics
    },
  })
}
