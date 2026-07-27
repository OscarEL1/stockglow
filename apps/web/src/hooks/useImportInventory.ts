import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface ImportRowError {
  fila: number
  campo: string
  valor: string
  motivo: string
}

export interface ImportInventoryResult {
  archivo: string
  totalFilas: number
  filasImportadas: number
  filasFallidas: number
  productosCreados: number
  variantesCreadas: number
  errores: ImportRowError[]
  columnasEsperadas: string[]
}

interface ImportInventoryResponse {
  success: boolean
  data: ImportInventoryResult
}

export function useImportInventory() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = (await fetchWithAuth(
        getToken,
        '/api/v1/inventory/import',
        {
          method: 'POST',
          body: formData,
        }
      )) as ImportInventoryResponse

      return response.data
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['variants'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      ])
    },
  })
}
