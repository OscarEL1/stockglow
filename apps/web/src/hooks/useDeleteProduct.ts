import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

interface DeleteProductResponse {
  data: {
    id: string
    nombre: string
    variantesEliminadas: number
    message: string
  }
}

export function useDeleteProduct() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      return fetchWithAuth(
        getToken,
        `/api/v1/inventory/products/${productId}`,
        {
          method: 'DELETE',
        }
      ) as Promise<DeleteProductResponse>
    },

    onSuccess: async () => {
      /*
       * Products actualiza la pantalla de productos.
       * Variants actualiza la pantalla de inventario.
       */
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['products'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['variants'],
        }),
      ])
    },
  })
}
