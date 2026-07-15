import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface SaleDetalle {
  id: string
  varianteId: string
  cantidad: number
  precioUnitario: string
  variante: { nombreVariante: string; sku: string; imagenUrl?: string }
}

export interface Sale {
  id: string
  total: string
  descuento?: number
  estado: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA'
  createdAt: string
  usuarioId: string
  usuario?: { nombre: string; rol?: string }
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
