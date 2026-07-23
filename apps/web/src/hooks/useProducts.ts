import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export type ProductStatus = 'active' | 'archived'

export interface ProductVariant {
  id: string
  productoId: string
  sku: string
  nombreVariante: string
  imagenUrl: string | null
  precioVenta: string
  stockActual: number
  stockMinimo: number
  fechaCaducidad: string | null
  updatedAt: string
}

export interface Product {
  id: string
  nombre: string
  marca: string | null
  categoria: string | null
  descripcion: string | null
  activo: boolean
  createdAt: string
  variantes: ProductVariant[]
}

export function useProducts(status: ProductStatus = 'active') {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['products', status],

    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        `/api/v1/inventory/products?status=${status}`
      )

      return res.data as Product[]
    },
  })
}
