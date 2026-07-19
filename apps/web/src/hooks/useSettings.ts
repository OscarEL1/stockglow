import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface StoreSettings {
  nombre: string
  logoUrl: string | null
  umbralDiasCaducidad: number
  stockMinimoGlobal: number
}

export interface UpdateSettingsData {
  nombre?: string
  logoUrl?: string | null
  umbralDiasCaducidad?: number
  stockMinimoGlobal?: number
}

export function useSettings() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/settings')
      return res.data as StoreSettings
    },
  })
}

export function useUpdateSettings() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateSettingsData) => {
      const res = await fetchWithAuth(getToken, '/api/v1/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      return res.data as StoreSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
