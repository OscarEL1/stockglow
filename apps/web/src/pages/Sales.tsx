import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { useVariants } from '../hooks/useVariants'
import { useSales } from '../hooks/useSales'
import type { Sale } from '../hooks/useSales'
import { useCreateSale } from '../hooks/useCreateSale'

interface SaleItemLocal {
  varianteId: string
  nombreVariante: string
  sku: string
  cantidad: number
  precioUnitario: number
  stockActual: number
}

const ESTADO_STYLES: Record<Sale['estado'], string> = {
  COMPLETADA: 'bg-green-100 text-green-700',
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  CANCELADA: 'bg-red-100 text-red-700',
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr))
}

export function Sales() {
  const { user } = useUser()
  const { data: variants = [] } = useVariants()
  const { data: sales = [], isLoading: loadingSales } = useSales()
  const createSale = useCreateSale()

  const [items, setItems] = useState<SaleItemLocal[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedIds = new Set(items.map((i) => i.varianteId))
  const availableVariants = variants.filter(
    (v) => !selectedIds.has(v.id) && v.stockActual > 0
  )

  const total = items.reduce(
    (sum, item) => sum + item.cantidad * item.precioUnitario,
    0
  )

  function handleSelectVariant(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (!id) return
    const variant = variants.find((v) => v.id === id)
    if (!variant) return

    setItems((prev) => [
      ...prev,
      {
        varianteId: variant.id,
        nombreVariante: variant.nombreVariante,
        sku: variant.sku,
        cantidad: 1,
        precioUnitario: parseFloat(variant.precioVenta),
        stockActual: variant.stockActual,
      },
    ])
    setSelectedVariantId('')
  }

  function handleIncrement(varianteId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.varianteId === varianteId && i.cantidad < i.stockActual
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      )
    )
  }

  function handleDecrement(varianteId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.varianteId === varianteId && i.cantidad > 1
          ? { ...i, cantidad: i.cantidad - 1 }
          : i
      )
    )
  }

  function handleRemove(varianteId: string) {
    setItems((prev) => prev.filter((i) => i.varianteId !== varianteId))
  }

  async function handleConfirm() {
    if (items.length === 0) return
    setError(null)
    try {
      await createSale.mutateAsync({
        items: items.map((i) => ({
          varianteId: i.varianteId,
          cantidad: i.cantidad,
        })),
      })
      setItems([])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al confirmar la venta'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-gray-900">StockGlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Inventario
              </Link>
              <Link to="/sales" className="text-sm font-medium text-blue-600">
                Ventas
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.firstName}</span>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Nueva venta */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva venta</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agregar variante
            </label>
            <select
              value={selectedVariantId}
              onChange={handleSelectVariant}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una variante...</option>
              {availableVariants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombreVariante} — {v.sku} (Stock: {v.stockActual})
                </option>
              ))}
            </select>
          </div>

          {items.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">
                      Variante
                    </th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">
                      SKU
                    </th>
                    <th className="px-4 py-2 text-center text-gray-600 font-medium">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-right text-gray-600 font-medium">
                      Precio unit.
                    </th>
                    <th className="px-4 py-2 text-right text-gray-600 font-medium">
                      Subtotal
                    </th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.varianteId}>
                      <td className="px-4 py-3 text-gray-900">
                        {item.nombreVariante}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDecrement(item.varianteId)}
                            disabled={item.cantidad <= 1}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => handleIncrement(item.varianteId)}
                            disabled={item.cantidad >= item.stockActual}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        ${item.precioUnitario.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ${(item.cantidad * item.precioUnitario).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemove(item.varianteId)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">
              No has agregado ninguna variante.
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900">
              Total: <span className="text-blue-600">${total.toFixed(2)}</span>
            </p>
            <div className="flex flex-col items-end gap-2">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleConfirm}
                disabled={items.length === 0 || createSale.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createSale.isPending && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Confirmar venta
              </button>
            </div>
          </div>
        </section>

        {/* Historial de ventas */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Historial de ventas
          </h2>

          {loadingSales ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : sales.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No hay ventas registradas
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right text-gray-600 font-medium">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ${parseFloat(sale.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${ESTADO_STYLES[sale.estado]}`}
                        >
                          {sale.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">
                        —
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
