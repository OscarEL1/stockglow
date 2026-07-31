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

export function useEmployeesRanking(enabled = true) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['employeesRanking'],
    enabled,
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        '/api/v1/reports/employees-ranking'
      )

      return res.data as EmployeeRankingItem[]
    },
  })
}

export interface MermasFilters {
  fechaInicio?: string
  fechaFin?: string
  tipo?: 'MERMA' | 'CADUCADO'
}

export interface MovimientoMerma {
  id: string
  tipo: string
  cantidad: number
  motivo: string | null
  createdAt: string
  variante: {
    id: string
    sku: string
    nombreVariante: string
    imagenUrl: string | null
    precioVenta: number
    producto: {
      id: string
      nombre: string
      marca: string | null
    }
  }
  usuario: {
    id: string
    nombre: string
    email: string
  }
}

export interface MermasReport {
  movimientos: MovimientoMerma[]
  resumen: { tipo: string; cantidadTotal: number; registros: number }[]
}

export interface ArchivedProduct {
  id: string
  nombre: string
  marca: string | null
  categoria: string | null
  descripcion: string | null
  createdAt: string
  variantes: {
    id: string
    sku: string
    nombreVariante: string
    stockActual: number
    precioVenta: number
    activo: boolean
  }[]
  proveedor: { id: string; nombre: string } | null
}

export interface ArchivedProductsReport {
  productos: ArchivedProduct[]
  resumen: { totalProductos: number; totalVariantes: number }
}

export function useMermasReport(filters: MermasFilters = {}) {
  const { getToken } = useAuth()

  const params = new URLSearchParams()
  if (filters.fechaInicio) params.set('fechaInicio', filters.fechaInicio)
  if (filters.fechaFin) params.set('fechaFin', filters.fechaFin)
  if (filters.tipo) params.set('tipo', filters.tipo)

  const query = params.toString() ? `?${params.toString()}` : ''

  return useQuery({
    queryKey: ['mermasReport', filters],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        `/api/v1/reports/mermas${query}`
      )
      return res.data as MermasReport
    },
  })
}

export function useArchivedProductsReport() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['archivedProductsReport'],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        '/api/v1/reports/archived-products'
      )
      return res.data as ArchivedProductsReport
    },
  })
}

export interface DeadStockItem {
  varianteId: string
  producto: string
  variante: string
  sku: string
  stockActual: number
  ultimoMovimiento: string | null
}

export interface DeadStockMeta {
  totalVariantes: number
  stockTotal: number
}

export interface DeadStockResponse {
  items: DeadStockItem[]
  meta: DeadStockMeta
}

export function useDeadStockReport() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['deadStockReport'],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        '/api/v1/reports/dead-stock'
      )

      return {
        items: res.data as DeadStockItem[],
        meta: (res.meta as DeadStockMeta) ?? {
          totalVariantes: 0,
          stockTotal: 0,
        },
      }
    },
  })
}
