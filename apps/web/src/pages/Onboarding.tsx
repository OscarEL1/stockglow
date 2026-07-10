// apps/web/src/pages/Onboarding.tsx
import { useState } from 'react'
import { StepStore } from '../components/onboarding/StepStore'
import { StepProduct } from '../components/onboarding/StepProduct'
import { StepVariant } from '../components/onboarding/StepVariant'
import { ProgressBar } from '../components/onboarding/ProgressBar' // 👈 import corregido

export default function Onboarding() {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProgressBar step={step} />
      {step === 1 && <StepStore onNext={() => setStep(2)} loading={false} />}
      {step === 2 && <StepProduct onNext={() => setStep(3)} loading={false} />}
      {step === 3 && (
        <StepVariant
          onFinish={() => {
            window.location.href = '/dashboard'
          }}
          loading={false}
        />
      )}
    </div>
  )
}
