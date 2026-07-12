import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { StepStore } from '../components/onboarding/StepStore'
import { StepProduct } from '../components/onboarding/StepProduct'
import { StepVariant } from '../components/onboarding/StepVariant'
import { ProgressBar } from '../components/onboarding/ProgressBar'
import { useOnboarding } from '../hooks/useOnboarding'
import { useOnboardingStatus } from '../hooks/useOnboardingStatus'

export default function Onboarding() {
  const { getToken } = useAuth()
  const { mutate, isPending } = useOnboarding(getToken)
  const { data: status, isLoading: statusLoading } = useOnboardingStatus()

  const [stepOverride, setStepOverride] = useState<1 | 2 | 3 | null>(null)
  const [productoIdOverride, setProductoIdOverride] = useState<string | null>(
    null
  )

  const resumeStep = Math.min(Math.max(status?.wizardStep ?? 1, 1), 3) as
    | 1
    | 2
    | 3
  const step = stepOverride ?? resumeStep
  const productoId = productoIdOverride ?? status?.productoId ?? null

  if (statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
      </div>
    )
  }

  const onboardingCompleto = (status?.wizardStep ?? 1) >= 3 && !stepOverride

  if (onboardingCompleto) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProgressBar step={step} />

      {step === 1 && (
        <StepStore
          loading={isPending}
          onNext={(data) => {
            mutate(
              { step: 1, nombreTienda: data.nombreTienda },
              { onSuccess: () => setStepOverride(2) }
            )
          }}
        />
      )}

      {step === 2 && (
        <StepProduct
          loading={isPending}
          onNext={(data) => {
            mutate(
              { step: 2, ...data },
              {
                onSuccess: (response) => {
                  setProductoIdOverride(response.data.producto?.id ?? null)
                  setStepOverride(3)
                },
              }
            )
          }}
        />
      )}

      {step === 3 && (
        <StepVariant
          loading={isPending}
          onFinish={(data) => {
            if (!productoId) return

            mutate(
              { step: 3, productoId, ...data },
              {
                onSuccess: () => {
                  window.location.href = '/dashboard'
                },
              }
            )
          }}
        />
      )}
    </div>
  )
}
