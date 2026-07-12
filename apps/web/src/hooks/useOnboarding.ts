import { useMutation } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'

export interface OnboardingPayload {
  step: number
  nombreTienda?: string
  nombre?: string
  marca?: string
  categoria?: string
  productoId?: string
  sku?: string
  nombreVariante?: string
  precioVenta?: number
  stockActual?: number
}

export interface OnboardingResponse {
  success: boolean
  data: {
    step: number
    producto?: { id: string }
    variante?: { id: string }
  }
}

export function useOnboarding(getToken: () => Promise<string | null>) {
  return useMutation({
    mutationFn: async (data: OnboardingPayload) => {
      const response = await fetchWithAuth(getToken, '/api/v1/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      return response as OnboardingResponse
    },
  })
}
