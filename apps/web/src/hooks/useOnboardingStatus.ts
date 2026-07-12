import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { fetchWithAuth } from '../lib/api'

export interface OnboardingStatus {
  wizardStep: number
  productoId: string | null
}

export function useOnboardingStatus() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const res = await fetchWithAuth(getToken, '/api/v1/onboarding/status')
      return res.data as OnboardingStatus
    },
  })
}
