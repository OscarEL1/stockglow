import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useSettings } from '../hooks/useSettings'
import {
  useCreateMultipleVariants,
  type VariantRowError,
} from '../hooks/useCreateMultipleVariants'

interface Props {
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

interface VariantFormRow {
  id: string
  sku: string
  nombreVariante: string
  precioVenta: string
  stockActual: string
  stockMinimo: string
  fechaCaducidad: string
  error: string | null
}

function createRow(stockMinimo = ''): VariantFormRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sku: '',
    nombreVariante: '',
    precioVenta: '',
    stockActual: '0',
    stockMinimo,
    fechaCaducidad: '',
    error: null,
  }
}

export function AddMultipleVariantsModal({
  onClose,
  onSuccess,
  onError,
}: Props) {
  const { data: products = [] } = useProducts()
  const { data: settings, isLoading: isLoadingSettings } = useSettings()
  const createMultipleVariants = useCreateMultipleVariants()

  const [productoId, setProductoId] = useState('')
  const [rows, setRows] = useState<VariantFormRow[]>([createRow()])
  const [summary, setSummary] = useState<string | null>(null)

  function updateRow(
    rowId: string,
    field: keyof Omit<VariantFormRow, 'id' | 'error'>,
    value: string
  ) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
              error: null,
            }
          : row
      )
    )

    setSummary(null)
  }

  function addRow() {
    if (rows.length >= 10) {
      onError('Solo puedes registrar hasta 10 variantes por operación')
      return
    }

    const defaultStockMinimo = settings
      ? String(settings.stockMinimoGlobal)
      : ''

    setRows((currentRows) => [...currentRows, createRow(defaultStockMinimo)])
  }

  function removeRow(rowId: string) {
    if (rows.length === 1) {
      onError('Debes conservar al menos una fila')
      return
    }

    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId))
  }

  function applyBackendErrors(errors: VariantRowError[]) {
    const errorsByRow = new Map(
      errors.map((error) => [error.fila - 1, error.message])
    )

    setRows((currentRows) =>
      currentRows.map((row, index) => ({
        ...row,
        error: errorsByRow.get(index) ?? null,
      }))
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!productoId) {
      onError('Selecciona el producto de las variantes')
      return
    }

    if (rows.length === 0 || rows.length > 10) {
      onError('Debes registrar entre 1 y 10 variantes')
      return
    }

    setSummary(null)

    try {
      const result = await createMultipleVariants.mutateAsync({
        productoId,

        variantes: rows.map((row) => ({
          sku: row.sku.trim(),
          nombreVariante: row.nombreVariante.trim(),
          precioVenta: Number(row.precioVenta),
          stockActual: Number(row.stockActual),

          stockMinimo:
            row.stockMinimo.trim() === '' ? undefined : Number(row.stockMinimo),

          fechaCaducidad:
            row.fechaCaducidad.trim() === '' ? undefined : row.fechaCaducidad,
        })),
      })

      if (result.totalErrores === 0) {
        onSuccess(
          `${result.totalCreadas} variante${
            result.totalCreadas === 1 ? '' : 's'
          } registrada${result.totalCreadas === 1 ? '' : 's'} correctamente`
        )

        onClose()
        return
      }

      applyBackendErrors(result.errores)

      setSummary(
        `${result.totalCreadas} creada${
          result.totalCreadas === 1 ? '' : 's'
        } y ${result.totalErrores} con error`
      )

      if (result.totalCreadas > 0) {
        onSuccess(
          `${result.totalCreadas} variante${
            result.totalCreadas === 1 ? '' : 's'
          } registrada${result.totalCreadas === 1 ? '' : 's'}`
        )
      }

      onError(
        `${result.totalErrores} fila${
          result.totalErrores === 1 ? '' : 's'
        } no pudo${result.totalErrores === 1 ? '' : 'ieron'} guardarse`
      )
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar las variantes'
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="multiple-variants-title"
    >
      <div className="max-h-[92vh] w-full max-w-[1180px] overflow-y-auto rounded-[28px] bg-white px-6 py-7 shadow-2xl sm:px-9">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              id="multiple-variants-title"
              className="text-2xl font-extrabold text-[#2D2A32]"
            >
              Agregar variantes múltiples
            </h2>

            <p className="mt-2 text-sm text-[#7A7480]">
              Registra hasta 10 tonos o presentaciones del mismo producto.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div
              className="rounded-2xl bg-[#FFF1F5] px-4 py-3 text-sm font-semibold text-[#C64270]"
              title={
                rows.length >= 10
                  ? 'Has alcanzado el límite máximo de 10 variantes por operación'
                  : `Puedes agregar hasta ${10 - rows.length} fila${10 - rows.length === 1 ? '' : 's'} más`
              }
            >
              {rows.length} de 10 filas
            </div>
            {rows.length >= 10 && (
              <p className="text-xs text-[#C64270]">
                Límite alcanzado
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="bulk-product"
              className="mb-2 block text-xs font-bold text-[#6F6875]"
            >
              Producto
            </label>

            <select
              id="bulk-product"
              value={productoId}
              onChange={(event) => {
                setProductoId(event.target.value)
                setSummary(null)
              }}
              className="h-12 w-full max-w-xl rounded-2xl border border-[#F1DDE5] bg-white px-4 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
              required
            >
              <option value="">Selecciona un producto</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nombre}
                  {product.marca ? ` — ${product.marca}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className={`rounded-2xl border p-4 ${
                  row.error
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-[#F1DDE5] bg-white'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#2D2A32]">
                    Variante {index + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Eliminar fila"
                    aria-label={`Eliminar fila ${index + 1}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                  <div className="xl:col-span-1">
                    <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                      SKU
                    </label>

                    <input
                      type="text"
                      value={row.sku}
                      onChange={(event) =>
                        updateRow(row.id, 'sku', event.target.value)
                      }
                      placeholder="LAB-ROS-001"
                      className="h-11 w-full rounded-xl border border-[#F1DDE5] px-3 text-sm outline-none focus:border-[#E85D8C] focus:ring-2 focus:ring-[#E85D8C]/10"
                      required
                    />
                  </div>

                  <div className="xl:col-span-1">
                    <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                      Variante / tono
                    </label>

                    <input
                      type="text"
                      value={row.nombreVariante}
                      onChange={(event) =>
                        updateRow(row.id, 'nombreVariante', event.target.value)
                      }
                      placeholder="Rosa Nude"
                      className="h-11 w-full rounded-xl border border-[#F1DDE5] px-3 text-sm outline-none focus:border-[#E85D8C] focus:ring-2 focus:ring-[#E85D8C]/10"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                      Precio
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.precioVenta}
                      onChange={(event) =>
                        updateRow(row.id, 'precioVenta', event.target.value)
                      }
                      placeholder="120"
                      className="h-11 w-full rounded-xl border border-[#F1DDE5] px-3 text-sm outline-none focus:border-[#E85D8C] focus:ring-2 focus:ring-[#E85D8C]/10"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                      Stock
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={row.stockActual}
                      onChange={(event) =>
                        updateRow(row.id, 'stockActual', event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#F1DDE5] px-3 text-sm outline-none focus:border-[#E85D8C] focus:ring-2 focus:ring-[#E85D8C]/10"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                      Stock mínimo
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={row.stockMinimo}
                      placeholder={
                        settings ? String(settings.stockMinimoGlobal) : 'Global'
                      }
                      onChange={(event) =>
                        updateRow(row.id, 'stockMinimo', event.target.value)
                      }
                      disabled={isLoadingSettings}
                      className="h-11 w-full rounded-xl border border-[#F1DDE5] px-3 text-sm outline-none focus:border-[#E85D8C] focus:ring-2 focus:ring-[#E85D8C]/10 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                      Caducidad
                    </label>

                    <input
                      type="date"
                      value={row.fechaCaducidad}
                      onChange={(event) =>
                        updateRow(row.id, 'fechaCaducidad', event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#F1DDE5] px-3 text-sm outline-none focus:border-[#E85D8C] focus:ring-2 focus:ring-[#E85D8C]/10"
                    />
                  </div>
                </div>

                {row.error && (
                  <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
                    Fila {index + 1}: {row.error}
                  </p>
                )}
              </div>
            ))}
          </div>

          {summary && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">
                Resultado: {summary}
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Las variantes correctas ya fueron registradas. Corrige las filas
                marcadas antes de volver a guardar.
              </p>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= 10}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#E85D8C] px-5 text-sm font-bold text-[#E85D8C] transition hover:bg-[#FFF1F5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Agregar fila
            </button>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={createMultipleVariants.isPending}
                className="h-12 min-w-[130px] rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9] disabled:opacity-50"
              >
                Cerrar
              </button>

              <button
                type="submit"
                disabled={
                  createMultipleVariants.isPending ||
                  !productoId ||
                  rows.length === 0
                }
                className="h-12 min-w-[190px] rounded-2xl bg-[#E85D8C] px-5 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMultipleVariants.isPending
                  ? 'Guardando variantes...'
                  : `Guardar ${rows.length} variante${
                      rows.length === 1 ? '' : 's'
                    }`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
