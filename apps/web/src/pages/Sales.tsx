import { useState } from 'react'
import { useVariants } from '../hooks/useVariants'
import { useSales } from '../hooks/useSales'
import type { Sale } from '../hooks/useSales'
import { useCreateSale } from '../hooks/useCreateSale'
import { useCancelSale } from '../hooks/useCancelSale'
import { Layout } from '../components/Layout'
import { useOrganization } from '@clerk/clerk-react'
import { generateReceiptPDF } from '../lib/generateReceiptPDF'

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

const PAGE_SIZE = 20

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

function SaleDetailModal({
  sale,
  onClose,
}: {
  sale: Sale
  onClose: () => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const cancelSale = useCancelSale()
  const { organization } = useOrganization()

  async function handleConfirmCancel() {
    await cancelSale.mutateAsync(sale.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-detail-title"
    >
      <div className="w-full max-w-2xl rounded-[28px] bg-white px-8 py-7 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2
              id="sale-detail-title"
              className="text-xl font-bold text-[#2D2A32]"
            >
              Detalle de venta
            </h2>
            <p className="mt-1 text-sm text-[#7A7480]">
              {formatDate(sale.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Meta: estado + vendedor + total */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_STYLES[sale.estado]}`}
          >
            {sale.estado}
          </span>
          {sale.usuario && (
            <span className="text-sm text-[#7A7480]">
              Vendido por:{' '}
              <span className="font-medium text-[#2D2A32]">
                {sale.usuario.nombre}
              </span>
            </span>
          )}
          <span className="ml-auto text-lg font-bold text-[#2D2A32]">
            Total:{' '}
            <span className="text-[#E85D8C]">
              ${parseFloat(sale.total).toFixed(2)}
            </span>
          </span>
        </div>

        {/* Tabla de productos */}
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-pink-50/70">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Producto
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Variante
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  SKU
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Cantidad
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Precio unit.
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sale.detalles.map((d) => {
                const precio = parseFloat(d.precioUnitario)
                return (
                  <tr key={d.id} className="hover:bg-pink-50/40">
                    <td className="px-5 py-3">
                      {d.variante.imagenUrl ? (
                        <img
                          src={d.variante.imagenUrl}
                          alt={d.variante.nombreVariante}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18"
                            />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {d.variante.nombreVariante}
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-600">
                      {d.variante.sku}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-900">
                      {d.cantidad}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      ${precio.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      ${(d.cantidad * precio).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Confirmación de cancelación */}
        {showConfirm && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-3 text-sm font-medium text-red-700">
              ¿Estás seguro? El stock será restaurado automáticamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmCancel}
                disabled={cancelSale.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelSale.isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Confirmar cancelación
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={cancelSale.isPending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                No cancelar
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-3">
            {sale.estado === 'COMPLETADA' && !showConfirm && (
              <button
                onClick={() => setShowConfirm(true)}
                className="rounded-xl bg-red-500 px-6 py-2 text-sm font-bold text-white hover:bg-red-600"
              >
                Cancelar venta
              </button>
            )}
            {sale.estado === 'COMPLETADA' && (
              <button
                onClick={() =>
                  generateReceiptPDF(sale, organization?.name || 'Tienda')
                }
                className="rounded-xl bg-[#2D2A32] px-6 py-2 text-sm font-bold text-white hover:bg-black"
              >
                Imprimir ticket
              </button>
            )}
          </div>
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#F1DDE5] bg-white px-6 py-2 text-sm font-bold text-[#2D2A32] hover:bg-[#FFF8F9]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sales() {
  const { data: variants = [] } = useVariants()
  const { data: sales = [], isLoading: loadingSales } = useSales()
  const createSale = useCreateSale()

  const [items, setItems] = useState<SaleItemLocal[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [page, setPage] = useState(1)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const filteredSales = sales.filter((sale) => {
    if (!fechaInicio && !fechaFin) return true
    const fecha = new Date(sale.createdAt)
    if (fechaInicio) {
      const inicio = new Date(`${fechaInicio}T00:00:00`)
      if (fecha < inicio) return false
    }
    if (fechaFin) {
      const fin = new Date(`${fechaFin}T23:59:59`)
      if (fecha > fin) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE))
  const paginatedSales = filteredSales.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const selectedIds = new Set(items.map((i) => i.varianteId))
  const availableVariants = variants.filter((v) => {
    const notSelected = !selectedIds.has(v.id) && v.stockActual > 0
    if (!search.trim()) return notSelected
    const term = search.toLowerCase()
    return (
      notSelected &&
      (v.nombreVariante.toLowerCase().includes(term) ||
        v.sku.toLowerCase().includes(term) ||
        v.producto.nombre.toLowerCase().includes(term))
    )
  })

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
    setSearch('')
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
      setPage(1)
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

          <div className="mb-4 space-y-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Agregar variante
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o producto..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E85D8C]"
            />
            <select
              value={selectedVariantId}
              onChange={handleSelectVariant}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E85D8C]"
            >
              <option value="">Selecciona una variante...</option>
              {availableVariants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombreVariante} — {v.sku} · Stock: {v.stockActual}
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

          {/* Filtros de fecha */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Desde:
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E85D8C]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Hasta:
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E85D8C]"
              />
            </div>
            {(fechaInicio || fechaFin) && (
              <>
                <button
                  onClick={() => {
                    setFechaInicio('')
                    setFechaFin('')
                    setPage(1)
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-[#F1DDE5] hover:bg-[#FFF8F9]"
                >
                  Limpiar filtros
                </button>
                <span className="text-sm text-gray-500">
                  {filteredSales.length}{' '}
                  {filteredSales.length === 1
                    ? 'venta encontrada'
                    : 'ventas encontradas'}
                </span>
              </>
            )}
          </div>

          {loadingSales ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
            </div>
          ) : sales.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No hay ventas registradas
            </p>
          ) : filteredSales.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Sin ventas en este período
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-pink-50/70">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Vendedor
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="transition hover:bg-pink-50/40"
                      >
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
                        <td className="px-4 py-3 text-gray-700">
                          {sale.usuario?.nombre ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="text-xs font-medium text-[#E85D8C] hover:text-[#D94B7D]"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-500">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </Layout>
  )
}
