import { useState } from 'react'

interface StepProductData {
  nombre: string
  marca?: string
  categoria?: string
}

interface StepProductProps {
  onNext: (data: StepProductData) => void
  loading: boolean
}

export function StepProduct({ onNext, loading }: StepProductProps) {
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [nombreError, setNombreError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!nombre.trim()) {
      setNombreError('El nombre del producto es requerido')
      return
    }

    setNombreError('')

    onNext({
      nombre: nombre.trim(),
      marca: marca.trim() || undefined,
      categoria: categoria.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-bold mb-2">Agrega un producto</h2>

      <div>
        <label className="block text-sm font-semibold text-[#2D2A32] mb-2">
          Nombre del producto
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            if (e.target.value.trim()) setNombreError('')
          }}
          className={`mt-1 block w-full rounded-xl border p-3 shadow-sm focus:outline-none focus:ring-1 text-[#2D2A32] ${
            nombreError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
              : 'border-gray-200 focus:border-[#E85D8C] focus:ring-[#E85D8C]'
          }`}
          placeholder="Ej. Labial Mate"
        />
        {nombreError && (
          <p className="mt-2 text-xs text-red-600">{nombreError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#2D2A32] mb-2">
          Marca (opcional)
        </label>
        <input
          type="text"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-gray-200 shadow-sm p-3 focus:border-[#E85D8C] focus:outline-none focus:ring-1 focus:ring-[#E85D8C] text-[#2D2A32]"
          placeholder="Ej. Glow Beauty"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#2D2A32] mb-2">
          Categoría (opcional)
        </label>
        <input
          type="text"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-gray-200 shadow-sm p-3 focus:border-[#E85D8C] focus:outline-none focus:ring-1 focus:ring-[#E85D8C] text-[#2D2A32]"
          placeholder="Ej. Labiales"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#E85D8C] text-white py-3 rounded-xl hover:bg-[#d44f7a] font-medium transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Continuar'}
      </button>
    </form>
  )
}
