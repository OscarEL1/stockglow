import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'

export interface SaleDetalle {
  id: string
  varianteId: string
  cantidad: number
  precioUnitario: string
  variante: {
    nombreVariante: string
    sku: string
    imagenUrl?: string
  }
}

export interface Sale {
  id: string
  total: string
  descuento?: number
  notas?: string | null
  metodoPago: PaymentMethod
  estado: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA'
  createdAt: string
  usuarioId: string
  usuario?: {
    nombre: string
    rol?: string
  }
  detalles: SaleDetalle[]
}

export function useSales() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/sales')
      return res.data as Sale[]
    },
  })
}

export interface EmployeeClosing {
  usuarioId: string
  nombre: string
  transacciones: number
  total: number
}

export interface DailyClosingData {
  fecha: string
  empleadas: EmployeeClosing[]
  totalGeneral: number
  totalTransacciones: number
  sinVentas: boolean
}

export function useDailyClosing(fecha?: string) {
  const { getToken } = useAuth()

  const params = fecha ? `?fecha=${fecha}` : ''

  return useQuery({
    queryKey: ['dailyClosing', fecha],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        `/api/v1/sales/daily-closing${params}`
      )
      return res.data as DailyClosingData
    },
  })
}
