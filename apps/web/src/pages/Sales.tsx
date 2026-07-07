import { useState } from 'react'
import { useVariants } from '../hooks/useVariants'
import { useSales } from '../hooks/useSales'
import type { Sale } from '../hooks/useSales'
import { useCreateSale } from '../hooks/useCreateSale'
import { Layout } from '../components/Layout'

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
    <Layout>
      <div className="space-y-8">
        {/* Nueva venta */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-bold text-[#2D2A32]">Nueva venta</h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Agregar variante
            </label>
            <select
              value={selectedVariantId}
              onChange={handleSelectVariant}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E85D8C]"
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
            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">
                      Variante
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">
                      SKU
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-600">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">
                      Precio unit.
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">
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
                            className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => handleIncrement(item.varianteId)}
                            disabled={item.cantidad >= item.stockActual}
                            className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
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
                          className="text-xs text-red-500 hover:text-red-700"
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
            <p className="mb-4 text-sm text-gray-400">
              No has agregado ninguna variante.
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900">
              Total: <span className="text-[#E85D8C]">${total.toFixed(2)}</span>
            </p>
            <div className="flex flex-col items-end gap-2">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleConfirm}
                disabled={items.length === 0 || createSale.isPending}
                className="flex items-center gap-2 rounded-lg bg-[#E85D8C] px-6 py-2 text-sm font-medium text-white hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createSale.isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Confirmar venta
              </button>
            </div>
          </div>
        </section>

        {/* Historial de ventas */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-bold text-[#2D2A32]">
            Historial de ventas
          </h2>

          {loadingSales ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
            </div>
          ) : sales.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No hay ventas registradas
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">
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
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${ESTADO_STYLES[sale.estado]}`}
                        >
                          {sale.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-400">
                        —
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
