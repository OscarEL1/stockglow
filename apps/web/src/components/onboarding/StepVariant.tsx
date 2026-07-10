// apps/web/src/components/onboarding/StepVariant.tsx
import { useAuth } from '@clerk/clerk-react'
import { useOnboarding } from '../../hooks/useOnboarding'

export function StepVariant({
  onFinish,
  loading,
}: {
  onFinish: () => void
  loading: boolean
}) {
  const { getToken } = useAuth()
  const { mutate } = useOnboarding(getToken) // 👈 ahora sí recibe el argumento

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Agrega una variante</h2>
      <button
        className="px-4 py-2 bg-pink-500 text-white rounded"
        onClick={() => {
          mutate({ step: 3 })
          onFinish()
        }}
        disabled={loading}
      >
        Finalizar
      </button>
    </div>
  )
}
