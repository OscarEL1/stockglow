import { useMutation } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'

export interface OnboardingPayload {
  step: number
  nombreTienda?: string
  nombre?: string
  marca?: string
  categoria?: string
  descripcion?: string
  productoId?: string
  sku?: string
  nombreVariante?: string
  precioVenta?: number
  stockInicial?: number
}

export function useOnboarding(getToken: () => Promise<string | null>) {
  return useMutation({
    mutationFn: async (data: OnboardingPayload) => {
      // aquí usamos fetchWithAuth en lugar de api
      return await fetchWithAuth(getToken, '/api/v1/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  })
}
