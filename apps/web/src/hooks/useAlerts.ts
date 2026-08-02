import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface Alert {
  id: string
  tipo: 'BAJO_STOCK' | 'CADUCIDAD_PROXIMA'
  leida: boolean
  createdAt: string
  fechaCaducidad?: string
  diasRestantes?: number
  sugerirPromocion?: boolean
  variante: {
    id: string
    nombreVariante: string
    sku: string
    stockActual: number
    stockMinimo: number
    producto: {
      nombre: string
      marca: string | null
      proveedor?: {
        id: string
        nombre: string
        telefono?: string | null
        email?: string | null
      } | null
    }
  }
}

export function useAlerts(includeRead = false, enabled = true) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['alerts', includeRead],
    queryFn: async () => {
      const res = await fetchWithAuth(
        getToken,
        `/api/v1/alerts${includeRead ? '?includeRead=true' : ''}`
      )
      return res.data as Alert[]
    },
    enabled,
  })

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await fetchWithAuth(getToken, `/api/v1/alerts/${id}/read`, {
        method: 'PATCH',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await fetchWithAuth(getToken, '/api/v1/alerts/mark-read', {
        method: 'PATCH',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  return {
    ...query,
    markAsRead,
    markAllAsRead,
  }
}
