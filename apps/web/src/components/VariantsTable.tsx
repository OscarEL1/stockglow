import { useMemo, useState } from 'react'
import { useVariants, type Variant } from '../hooks/useVariants'
import { useCategories } from '../hooks/useCategories'
import { History, Pencil, Trash2 } from 'lucide-react'
import { VariantHistoryModal } from './VariantHistoryModal'
import { EditVariantModal } from './EditVariantModal'

type StockStatus = 'available' | 'low_stock' | 'out_of_stock'

function getStockStatus(stock: number, minimo: number): StockStatus {
  if (stock === 0) return 'out_of_stock'
  if (stock <= minimo) return 'low_stock'
  return 'available'
}

function StockBadge({ stock, minimo }: { stock: number; minimo: number }) {
  const status = getStockStatus(stock, minimo)

  const styles = {
    available: 'bg-green-100 text-green-700',
    low_stock: 'bg-yellow-100 text-yellow-800',
    out_of_stock: 'bg-red-100 text-red-700',
  }

  const labels = {
    available: 'Disponible',
    low_stock: 'Stock bajo',
    out_of_stock: 'Agotado',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
        <p className="text-sm text-gray-500">Cargando inventario...</p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <h3 className="text-sm font-semibold text-red-700">
        No se pudo cargar el inventario
      </h3>
      <p className="mt-1 text-sm text-red-600">
        {message || 'Ocurrió un error al consultar las variantes.'}
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-pink-200 bg-white p-10 text-center">
      <h3 className="text-base font-semibold text-gray-900">
        Aún no hay variantes registradas
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        Agrega tu primer producto para comenzar a controlar tu inventario.
      </p>
    </div>
  )
}

interface Props {
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function VariantsTable({ onSuccess, onError }: Props) {
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)

  const { data: categories = [] } = useCategories()
  const {
    data: variants = [],
    isLoading,
    isError,
    error,
  } = useVariants(categoria)
  const [historyVariant, setHistoryVariant] = useState<{
    id: string
    name: string
  } | null>(null)

  const filteredVariants = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return variants

    return variants.filter((variant) => {
      const productName = variant.producto?.nombre?.toLowerCase() || ''
      const brand = variant.producto?.marca?.toLowerCase() || ''
      const variantName = variant.nombreVariante?.toLowerCase() || ''
      const sku = variant.sku?.toLowerCase() || ''

      return (
        productName.includes(term) ||
        brand.includes(term) ||
        variantName.includes(term) ||
        sku.includes(term)
      )
    })
  }, [variants, search])

  if (isLoading) {
    return <LoadingState />
  }

  if (isError) {
    return <ErrorState message={error?.message} />
  }

  if (!variants || variants.length === 0) {
    return <EmptyState />
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row md:items-center">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto, SKU o tono..."
            className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 md:w-48"
          >
            <option value="Todas">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500">
          {filteredVariants.length} variante
          {filteredVariants.length !== 1 ? 's' : ''} encontrada
          {filteredVariants.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredVariants.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No se encontraron variantes con esa búsqueda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-pink-50/70">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Variante
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredVariants.map((variant) => {
                  const stockActual = Number(variant.stockActual)
                  const stockMinimo = Number(variant.stockMinimo)
                  const precioVenta = Number(variant.precioVenta)

                  return (
                    <tr
                      key={variant.id}
                      className="transition hover:bg-pink-50/40"
                    >
                      <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-gray-900">
                          {variant.producto.nombre}
                        </div>

                        {variant.producto.marca && (
                          <div className="mt-1 text-sm text-gray-500">
                            {variant.producto.marca}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-900">
                        {variant.nombreVariante}
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-mono text-sm text-slate-700">
                          {variant.sku}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm font-medium text-gray-900">
                        ${precioVenta.toFixed(2)}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                        {stockActual}
                      </td>

                      <td className="px-6 py-5">
                        <StockBadge stock={stockActual} minimo={stockMinimo} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVariant(variant)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pink-200 bg-white text-pink-600 shadow-sm transition hover:border-pink-400 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                            title="Editar variante"
                            aria-label={`Editar ${variant.nombreVariante}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setHistoryVariant({
                                id: variant.id,
                                name: `${variant.producto.nombre} - ${variant.nombreVariante}`,
                              })
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                            title="Ver historial de movimientos"
                            aria-label={`Ver historial de ${variant.nombreVariante}`}
                          >
                            <History className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              console.log('Eliminar variante:', variant.id)
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 shadow-sm transition hover:border-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            title="Eliminar variante"
                            aria-label={`Eliminar ${variant.nombreVariante}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedVariant && (
        <EditVariantModal
          key={selectedVariant.id}
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      <VariantHistoryModal
        isOpen={!!historyVariant}
        onClose={() => setHistoryVariant(null)}
        variantId={historyVariant?.id || null}
        variantName={historyVariant?.name}
      />
    </section>
  )
}
