import { useState } from 'react'

interface StepVariantData {
  sku: string
  nombreVariante: string
  precioVenta: number
  stockActual: number
}

interface StepVariantProps {
  onFinish: (data: StepVariantData) => void
  loading: boolean
}

export function StepVariant({ onFinish, loading }: StepVariantProps) {
  const [sku, setSku] = useState('')
  const [nombreVariante, setNombreVariante] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stockActual, setStockActual] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const numericPrecio = Number(precioVenta)
    const numericStock = Number(stockActual)
    const nextErrors: Record<string, string> = {}

    if (!sku.trim()) nextErrors.sku = 'El SKU es requerido'
    if (!nombreVariante.trim())
      nextErrors.nombreVariante = 'El nombre de la variante es requerido'
    if (!precioVenta || Number.isNaN(numericPrecio) || numericPrecio <= 0)
      nextErrors.precioVenta = 'Ingresa un precio válido mayor que cero'
    if (!stockActual || Number.isNaN(numericStock) || numericStock < 0)
      nextErrors.stockActual = 'Ingresa una cantidad de stock válida'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})

    onFinish({
      sku: sku.trim(),
      nombreVariante: nombreVariante.trim(),
      precioVenta: numericPrecio,
      stockActual: numericStock,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-bold mb-2">Agrega una variante</h2>

      <div>
        <label className="block text-sm font-semibold text-[#2D2A32] mb-2">
          Código SKU
        </label>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className={`mt-1 block w-full rounded-xl border p-3 shadow-sm focus:outline-none focus:ring-1 text-[#2D2A32] ${
            errors.sku
              ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
              : 'border-gray-200 focus:border-[#E85D8C] focus:ring-[#E85D8C]'
          }`}
          placeholder="Ej. LAB-MATE-001"
        />
        {errors.sku && (
          <p className="mt-2 text-xs text-red-600">{errors.sku}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#2D2A32] mb-2">
          Variante / tono
        </label>
        <input
          type="text"
          value={nombreVariante}
          onChange={(e) => setNombreVariante(e.target.value)}
          className={`mt-1 block w-full rounded-xl border p-3 shadow-sm focus:outline-none focus:ring-1 text-[#2D2A32] ${
            errors.nombreVariante
              ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
              : 'border-gray-200 focus:border-[#E85D8C] focus:ring-[#E85D8C]'
          }`}
          placeholder="Ej. Rosa Nude"
        />
        {errors.nombreVariante && (
          <p className="mt-2 text-xs text-red-600">{errors.nombreVariante}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#2D2A32] mb-2">
            Precio
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            className={`mt-1 block w-full rounded-xl border p-3 shadow-sm focus:outline-none focus:ring-1 text-[#2D2A32] ${
              errors.precioVenta
                ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                : 'border-gray-200 focus:border-[#E85D8C] focus:ring-[#E85D8C]'
            }`}
            placeholder="120"
          />
          {errors.precioVenta && (
            <p className="mt-2 text-xs text-red-600">{errors.precioVenta}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#2D2A32] mb-2">
            Stock inicial
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={stockActual}
            onChange={(e) => setStockActual(e.target.value)}
            className={`mt-1 block w-full rounded-xl border p-3 shadow-sm focus:outline-none focus:ring-1 text-[#2D2A32] ${
              errors.stockActual
                ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                : 'border-gray-200 focus:border-[#E85D8C] focus:ring-[#E85D8C]'
            }`}
            placeholder="10"
          />
          {errors.stockActual && (
            <p className="mt-2 text-xs text-red-600">{errors.stockActual}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#E85D8C] text-white py-3 rounded-xl hover:bg-[#d44f7a] font-medium transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Finalizar'}
      </button>
    </form>
  )
}
