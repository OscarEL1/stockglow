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
    nombreVariante: string
    sku: string
    stockActual?: number
    producto: {
      nombre: string
    }
  }
}

export function useAlerts(enabled = true) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/alerts')
      return res.data as Alert[]
    },
    enabled,
  })

  const markAsRead = useMutation({
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
  }
}
