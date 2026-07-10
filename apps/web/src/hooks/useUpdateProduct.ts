import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'
import type { Product } from './useProducts'

interface UpdateProductData {
  nombre: string
  marca?: string
  categoria?: string
  descripcion?: string
}

interface UpdateProductVariables {
  id: string
  data: UpdateProductData
}

interface UpdateProductResponse {
  success: boolean
  data: Product
}

export function useUpdateProduct() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateProductVariables) => {
      const res = await fetchWithAuth(
        getToken,
        `/api/v1/inventory/products/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      )

      return (res as UpdateProductResponse).data
    },

    onSuccess: (updatedProduct) => {
      if (!updatedProduct?.id) {
        queryClient.invalidateQueries({
          queryKey: ['products'],
        })

        return
      }

      queryClient.setQueryData<Product[]>(['products'], (currentProducts) => {
        if (!Array.isArray(currentProducts)) {
          return currentProducts
        }

        return currentProducts.map((product) =>
          product.id === updatedProduct.id
            ? {
                ...product,
                ...updatedProduct,
                variantes: updatedProduct.variantes ?? product.variantes ?? [],
              }
            : product
        )
      })

      queryClient.invalidateQueries({
        queryKey: ['products'],
      })
    },
  })
}
