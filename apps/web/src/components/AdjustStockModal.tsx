import { useState } from 'react'
import { useAdjustStock, type StockMovementType } from '../hooks/useAdjustStock'
import type { Variant } from '../hooks/useVariants'

interface Props {
  variant: Variant
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'No se pudo ajustar el stock'
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('insufficient') ||
    message.includes('negativo') ||
    message.includes('stock')
  ) {
    return 'La cantidad no puede dejar el stock negativo'
  }

  return error.message
}

export function AdjustStockModal({
  variant,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [tipo, setTipo] = useState<StockMovementType>('ENTRADA')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [cantidadError, setCantidadError] = useState('')

  const { mutate, isPending, error } = useAdjustStock()

  const stockActual = Number(variant.stockActual)

  function getSignedQuantity() {
    const value = Number(cantidad)

    if (tipo === 'MERMA' || tipo === 'CADUCADO') {
      return -Math.abs(value)
    }
    return value
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const numericQuantity = Number(cantidad)

    if (!cantidad || Number.isNaN(numericQuantity) || numericQuantity <= 0) {
      setCantidadError('Ingresa una cantidad válida mayor que cero')
      return
    }

    const signedQuantity = getSignedQuantity()

    const resultingStock =
      tipo === 'AJUSTE' ? signedQuantity : stockActual + signedQuantity

    if (resultingStock < 0) {
      setCantidadError('La cantidad no puede dejar el stock negativo')
      return
    }

    setCantidadError('')

    mutate(
      {
        id: variant.id,
        data: {
          cantidad: signedQuantity,
          tipo,
          motivo: motivo.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess('Stock ajustado correctamente')
          onClose()
        },
        onError: (mutationError) => {
          const message = getErrorMessage(mutationError)
          setCantidadError(message)
          onError(message)
        },
      }
    )
  }

  const signedQuantity = cantidad ? getSignedQuantity() : 0
  const resultingStock =
    tipo === 'AJUSTE' ? signedQuantity : stockActual + signedQuantity

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-stock-title"
    >
      <div className="mx-auto w-full max-w-[620px] rounded-[28px] bg-white px-6 py-7 shadow-2xl sm:px-10 sm:py-9">
        <div className="mb-6">
          <h2
            id="adjust-stock-title"
            className="text-[30px] font-extrabold leading-tight text-[#2D2A32]"
          >
            Ajustar stock
          </h2>

          <p className="mt-2 text-sm text-[#7A7480]">
            {variant.producto.nombre} — {variant.nombreVariante}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FFF8F9] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8F8795]">
                Stock actual
              </p>

              <p className="mt-1 text-2xl font-extrabold text-[#2D2A32]">
                {stockActual}
              </p>
            </div>

            <div>
              <label
                htmlFor="movement-type"
                className="mb-2 block text-xs font-bold text-[#6F6875]"
              >
                Tipo de movimiento
              </label>

              <select
                id="movement-type"
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as StockMovementType)
                }
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="AJUSTE">Ajuste</option>
                <option value="MERMA">Merma</option>
                <option value="CADUCADO">Caducado</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="movement-quantity"
                className="mb-2 block text-xs font-bold text-[#6F6875]"
              >
                Cantidad
              </label>

              <input
                id="movement-quantity"
                type="number"
                value={cantidad}
                onChange={(event) => {
                  setCantidad(event.target.value)

                  if (Number(event.target.value) > 0) {
                    setCantidadError('')
                  }
                }}
                min="1"
                step="1"
                placeholder="Ej. 5"
                className={`h-14 w-full rounded-2xl border bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:ring-4 ${
                  cantidadError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#F1DDE5] focus:border-[#E85D8C] focus:ring-[#E85D8C]/10'
                }`}
              />

              {cantidadError && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {cantidadError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="movement-reason"
                className="mb-2 block text-xs font-bold text-[#6F6875]"
              >
                Motivo
              </label>

              <textarea
                id="movement-reason"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Ej. Conteo físico, producto dañado o robo"
                className="min-h-[110px] w-full resize-none rounded-2xl border border-[#F1DDE5] bg-white px-5 py-4 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
              />
            </div>

            <div className="rounded-2xl border border-[#F1DDE5] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8F8795]">
                Stock resultante
              </p>

              <p
                className={`mt-1 text-2xl font-extrabold ${
                  resultingStock < 0 ? 'text-red-600' : 'text-[#2D2A32]'
                }`}
              >
                {resultingStock}
              </p>
            </div>
          </div>

          {error && !cantidadError && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              Error: {error.message}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-12 w-full rounded-2xl border border-[#F1DDE5] bg-white px-6 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[150px]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[170px]"
            >
              {isPending ? 'Guardando...' : 'Guardar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
