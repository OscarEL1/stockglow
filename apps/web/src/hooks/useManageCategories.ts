import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export function useCreateCategory() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (nombre: string) => {
      const res = await fetchWithAuth(getToken, '/api/v1/settings/categories', {
        method: 'POST',
        body: JSON.stringify({ nombre }),
      })
      return res.data as { id: string; nombre: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (nombre: string) => {
      await fetchWithAuth(
        getToken,
        `/api/v1/settings/categories/${encodeURIComponent(nombre)}`,
        { method: 'DELETE' }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['variants'] })
    },
  })
}
