import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface Variant {
  id: string
  productoId: string
  sku: string
  nombreVariante: string
  precioVenta: string
  stockActual: number
  stockMinimo: number
  imagenUrl: string | null
  fechaCaducidad: string | null
  updatedAt: string
  producto: {
    nombre: string
    marca: string | null
  }
}

export function useVariants(categoria?: string) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['variants', categoria],
    queryFn: async () => {
      const url =
        categoria && categoria !== 'Todas'
          ? `/api/v1/inventory/variants?categoria=${encodeURIComponent(categoria)}`
          : '/api/v1/inventory/variants'
      const res = await fetchWithAuth(getToken, url)
      return res.data as Variant[]
    },
  })
}
