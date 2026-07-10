import { useVariantMovements } from '../hooks/useVariantMovements'
import {
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  AlertTriangle,
} from 'lucide-react'

interface VariantHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  variantId: string | null
  variantName?: string
}

export function VariantHistoryModal({
  isOpen,
  onClose,
  variantId,
  variantName,
}: VariantHistoryModalProps) {
  const { data: movements, isLoading, isError } = useVariantMovements(variantId)

  if (!isOpen) return null

  const getMovementIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return <ArrowDownToLine className="h-5 w-5 text-green-500" />
      case 'MERMA':
        return <ArrowUpFromLine className="h-5 w-5 text-red-500" />
      case 'CADUCADO':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'AJUSTE':
      default:
        return <RefreshCcw className="h-5 w-5 text-blue-500" />
    }
  }

  const getMovementLabel = (tipo: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Historial de movimientos
            {variantName && (
              <span className="ml-2 text-pink-600 font-normal">
                ({variantName})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto bg-gray-50/50 p-6">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
              Error al cargar el historial. Intenta nuevamente.
            </div>
          )}

          {!isLoading && !isError && movements?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-3">
                <RefreshCcw className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-900">
                Sin movimientos registrados
              </p>
              <p className="mt-1 text-sm text-gray-500">
                No hay actividad en el inventario para esta variante.
              </p>
            </div>
          )}

          {!isLoading && !isError && movements && movements.length > 0 && (
            <div className="space-y-4">
              {movements.map((mov) => (
                <div
                  key={mov.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-gray-50 p-2 border border-gray-100">
                      {getMovementIcon(mov.tipo)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {getMovementLabel(mov.tipo)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {mov.motivo || 'Sin motivo especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-1">
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          mov.cantidad > 0
                            ? 'text-green-600'
                            : mov.cantidad < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {mov.cantidad > 0 ? '+' : mov.cantidad < 0 ? '-' : ''}
                        {Math.abs(mov.cantidad)} unid.
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>
                        {new Date(mov.createdAt).toLocaleDateString()}{' '}
                        {new Date(mov.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="mt-0.5">{mov.usuario.nombre}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
