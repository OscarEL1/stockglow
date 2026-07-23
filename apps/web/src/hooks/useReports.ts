import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface SalesByDayItem {
  date: string
  label: string
  total: number
}

export interface TopProductItem {
  id: string
  nombre: string
  imagenUrl: string | null
  cantidadVendida: number
}

export interface EmployeeRankingItem {
  usuarioId: string
  nombre: string
  ventas: number
  montoTotal: number
}

export function useSalesByDay() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['salesByDay'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/reports/sales-by-day')

      return res.data as SalesByDayItem[]
    },
  })
}

export function useTopProducts(period: 'week' | 'month' = 'month') {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['topProducts', period],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        `/api/v1/reports/top-products?period=${period}`
      )

      return res.data as TopProductItem[]
    },
  })
}

export function useEmployeesRanking() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['employeesRanking'],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        '/api/v1/reports/employees-ranking'
      )

      return res.data as EmployeeRankingItem[]
    },
  })
}
