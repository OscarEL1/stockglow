import React, { useState } from 'react'

interface StepStoreProps {
  onNext: (data: { nombreTienda: string }) => void
  initialData?: string
  loading: boolean
}

export function StepStore({ onNext, initialData, loading }: StepStoreProps) {
  const [nombre, setNombre] = useState<string>(initialData || '')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nombre.trim()) return
    onNext({ nombreTienda: nombre })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#2D2A32] mb-2">
          Nombre de tu Tienda de Cosméticos
        </label>
        <input
          type="text"
          required
          value={nombre}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNombre(e.target.value)
          }
          className="mt-1 block w-full rounded-xl border border-gray-200 shadow-sm p-3 focus:border-[#E85D8C] focus:outline-none focus:ring-1 focus:ring-[#E85D8C] text-[#2D2A32]"
          placeholder="Ej. Glow Beauty Shop"
        />
        <p className="mt-2 text-xs text-[#7A7480]">
          Este nombre se mostrará en tus notas de venta y reportes.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#E85D8C] text-white py-3 rounded-xl hover:bg-[#d44f7a] font-medium transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Siguiente Paso'}
      </button>
    </form>
  )
}
