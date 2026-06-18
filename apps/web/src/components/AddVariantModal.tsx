import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useCreateVariant } from '../hooks/useCreateVariant'

interface Props {
  onClose: () => void
}

export function AddVariantModal({ onClose }: Props) {
  const { data: products } = useProducts()
  const { mutate, isPending, error } = useCreateVariant()

  const [productoId, setProductoId] = useState('')
  const [sku, setSku] = useState('')
  const [nombreVariante, setNombreVariante] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stockActual, setStockActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('5')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productoId || !sku.trim() || !nombreVariante.trim() || !precioVenta) return

    mutate(
      {
        productoId,
        sku: sku.trim(),
        nombreVariante: nombreVariante.trim(),
        precioVenta: Number(precioVenta),
        stockActual: Number(stockActual),
        stockMinimo: Number(stockMinimo),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-variant-title"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2
          id="add-variant-title"
          className="text-lg font-semibold text-gray-900 mb-4"
        >
          Agregar variante
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto *
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un producto</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.marca ? `— ${p.marca}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="LAB-MATTE-04"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre / Tono *
            </label>
            <input
              type="text"
              value={nombreVariante}
              onChange={(e) => setNombreVariante(e.target.value)}
              placeholder="Fucsia Intenso"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio *
              </label>
              <input
                type="number"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                placeholder="120"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock min
              </label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">Error: {error.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar variante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
