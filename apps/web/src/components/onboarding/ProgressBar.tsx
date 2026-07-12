// apps/web/src/components/onboarding/ProgressBar.tsx
export function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`flex-1 h-2 mx-1 rounded ${
            s <= step ? 'bg-pink-500' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  )
}
