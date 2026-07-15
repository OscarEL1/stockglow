import { useEffect } from 'react'
import type { Variant } from '../hooks/useVariants'
import { useVariantMovements } from '../hooks/useVariantMovements'
import {
  X,
  ImageIcon,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  Package,
} from 'lucide-react'

interface Props {
  variant: Variant
  onClose: () => void
}

const DIAS_ALERTA_CADUCIDAD = 30

function parseDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)

  return new Date(year, month - 1, day)
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha de caducidad'

  return parseDate(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getExpirationInfo(fechaCaducidad: string | null) {
  if (!fechaCaducidad) {
    return {
      label: 'Sin fecha de caducidad',
      className: 'border-gray-200 bg-gray-50 text-gray-600',
      showAlert: false,
    }
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const caducidad = parseDate(fechaCaducidad)
  caducidad.setHours(0, 0, 0, 0)

  const diasRestantes = Math.floor(
    (caducidad.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diasRestantes < 0) {
    return {
      label: `Caducado — ${formatDate(fechaCaducidad)}`,
      className: 'border-red-200 bg-red-50 text-red-700',
      showAlert: true,
    }
  }

  if (diasRestantes <= DIAS_ALERTA_CADUCIDAD) {
    return {
      label: `${formatDate(fechaCaducidad)} — vence en ${diasRestantes} día${
        diasRestantes === 1 ? '' : 's'
      }`,
      className: 'border-orange-200 bg-orange-50 text-orange-700',
      showAlert: true,
    }
  }

  return {
    label: formatDate(fechaCaducidad),
    className: 'border-gray-200 bg-white text-gray-700',
    showAlert: false,
  }
}

function getStockInfo(stockActual: number, stockMinimo: number) {
  if (stockActual === 0) {
    return {
      label: 'Agotado',
      className: 'bg-red-100 text-red-700',
    }
  }

  if (stockActual <= stockMinimo) {
    return {
      label: 'Stock bajo',
      className: 'bg-yellow-100 text-yellow-800',
    }
  }

  return {
    label: 'Disponible',
    className: 'bg-green-100 text-green-700',
  }
}

function getMovementIcon(tipo: string) {
  switch (tipo) {
    case 'ENTRADA':
      return <ArrowDownToLine className="h-4 w-4 text-green-500" />

    case 'MERMA':
      return <ArrowUpFromLine className="h-4 w-4 text-red-500" />

    case 'CADUCADO':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />

    case 'AJUSTE':
    default:
      return <RefreshCcw className="h-4 w-4 text-blue-500" />
  }
}

function getMovementLabel(tipo: string) {
  switch (tipo) {
    case 'ENTRADA':
      return 'Entrada'

    case 'MERMA':
      return 'Merma'

    case 'CADUCADO':
      return 'Caducado'

    case 'AJUSTE':
      return 'Ajuste'

    default:
      return tipo
  }
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | number
  mono?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#F1DDE5] bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8F8795]">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-sm font-semibold text-[#2D2A32] ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export function VariantDetailModal({ variant, onClose }: Props) {
  const {
    data: movements = [],
    isLoading,
    isError,
  } = useVariantMovements(variant.id)

  const stockActual = Number(variant.stockActual)
  const stockMinimo = Number(variant.stockMinimo)
  const precioVenta = Number(variant.precioVenta)

  const stockInfo = getStockInfo(stockActual, stockMinimo)
  const expirationInfo = getExpirationInfo(variant.fechaCaducidad)
  const recentMovements = movements.slice(0, 5)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="variant-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5 md:px-8">
          <div>
            <h2
              id="variant-detail-title"
              className="text-2xl font-extrabold text-[#2D2A32]"
            >
              Detalle de variante
            </h2>

            <p className="mt-1 text-sm text-[#7A7480]">
              Consulta la información completa sin modificarla.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar detalle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <div>
              {variant.imagenUrl ? (
                <img
                  src={variant.imagenUrl}
                  alt={`${variant.producto.nombre} - ${variant.nombreVariante}`}
                  className="h-72 w-full rounded-3xl border border-[#F1DDE5] object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-72 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#F1DDE5] bg-pink-50/40">
                  <ImageIcon className="h-12 w-12 text-[#D9B4C7]" />

                  <p className="mt-3 text-sm font-medium text-[#8F8795]">
                    Sin imagen registrada
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="mb-5">
                <p className="text-sm font-semibold text-[#E85D8C]">
                  {variant.producto.marca || 'Marca no especificada'}
                </p>

                <h3 className="mt-1 text-3xl font-extrabold text-[#2D2A32]">
                  {variant.producto.nombre}
                </h3>

                <p className="mt-2 text-lg text-[#6F6875]">
                  {variant.nombreVariante}
                </p>
              </div>

              <div className="mb-5 flex flex-wrap gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${stockInfo.className}`}
                >
                  {stockInfo.label}
                </span>

                <span className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
                  SKU: {variant.sku}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Precio de venta"
                  value={`$${precioVenta.toFixed(2)}`}
                />

                <DetailItem
                  label="Stock actual"
                  value={`${stockActual} unidades`}
                />

                <DetailItem
                  label="Stock mínimo"
                  value={`${stockMinimo} unidades`}
                />

                <DetailItem
                  label="Última actualización"
                  value={formatDateTime(variant.updatedAt)}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-base font-bold text-[#2D2A32]">
              Fecha de caducidad
            </h3>

            <div
              className={`flex items-center gap-3 rounded-2xl border p-4 ${expirationInfo.className}`}
            >
              {expirationInfo.showAlert && (
                <AlertTriangle className="h-5 w-5 shrink-0" />
              )}

              <span className="text-sm font-semibold">
                {expirationInfo.label}
              </span>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#2D2A32]">
                  Movimientos recientes
                </h3>

                <p className="mt-1 text-sm text-[#8F8795]">
                  Últimos movimientos registrados para esta variante.
                </p>
              </div>

              <Package className="h-5 w-5 text-[#E85D8C]" />
            </div>

            {isLoading && (
              <div className="flex justify-center rounded-2xl border border-gray-100 bg-gray-50 py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
              </div>
            )}

            {isError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                No se pudieron cargar los movimientos recientes.
              </div>
            )}

            {!isLoading && !isError && recentMovements.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <RefreshCcw className="mx-auto h-6 w-6 text-gray-400" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  Sin movimientos registrados
                </p>
              </div>
            )}

            {!isLoading && !isError && recentMovements.length > 0 && (
              <div className="space-y-3">
                {recentMovements.map((movement) => {
                  const cantidad = Number(movement.cantidad)

                  return (
                    <div
                      key={movement.id}
                      className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-gray-100 bg-gray-50 p-2">
                          {getMovementIcon(movement.tipo)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {getMovementLabel(movement.tipo)}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            {movement.motivo || 'Sin motivo especificado'}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p
                          className={`text-sm font-bold ${
                            cantidad > 0
                              ? 'text-green-600'
                              : cantidad < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                          }`}
                        >
                          {cantidad > 0 ? '+' : cantidad < 0 ? '-' : ''}
                          {Math.abs(cantidad)} unid.
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDateTime(movement.createdAt)}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          {movement.usuario?.nombre || 'Usuario no disponible'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400">
            <p>ID de variante: {variant.id}</p>
            <p className="mt-1">ID de producto: {variant.productoId}</p>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end border-t border-gray-100 bg-white px-6 py-4 md:px-8">
          <button
            type="button"
            onClick={onClose}
            className="h-12 min-w-36 rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
