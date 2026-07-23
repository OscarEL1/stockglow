import { useNavigate } from 'react-router-dom'
import { Package, CheckCircle2, AlertTriangle, PackageX } from 'lucide-react'
import type { DashboardSummary as DashboardSummaryData } from '../hooks/useDashboardSummary'

interface Props {
  summary: DashboardSummaryData | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function DashboardSummary({
  summary,
  isLoading,
  isError,
  onRetry,
}: Props) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-36 min-w-[168px] flex-1 animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <h3 className="text-sm font-semibold text-red-800">
          Error al cargar datos
        </h3>
        <p className="text-xs text-red-600 mt-1">
          No pudimos recuperar las estadísticas de tu inventario.
        </p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="flex flex-wrap gap-6">
      <div className="relative min-w-[168px] flex-1 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-sm transition hover:shadow-md flex flex-col items-center text-center">
        <div className="rounded-xl bg-blue-100/60 p-3 text-blue-600 mb-3">
          <Package className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Productos únicos
        </p>
        <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
          {summary.totalProducts}
        </p>
        <p className="mt-3 text-xs text-[#7A7480]">
          Productos base en catálogo
        </p>
      </div>

      <div className="relative min-w-[168px] flex-1 overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-6 shadow-sm transition hover:shadow-md flex flex-col items-center text-center">
        <div className="rounded-xl bg-purple-100/60 p-3 text-purple-600 mb-3">
          <Package className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
          Total de Variantes
        </p>
        <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
          {summary.totalVariants}
        </p>
        <p className="mt-3 text-xs text-[#7A7480]">
          Todas las variantes de los productos
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate('/inventory?status=disponible')}
        className="relative min-w-[168px] flex-1 flex flex-col items-center overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-50/50 to-white p-6 text-center shadow-sm transition hover:shadow-md"
      >
        <div className="mb-3 rounded-xl bg-green-100/60 p-3 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
          Disponibles
        </p>
        <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
          {summary.disponibles}
        </p>
        <p className="mt-3 text-xs text-[#7A7480]">
          Variantes con stock saludable
        </p>
      </button>

      <button
        type="button"
        onClick={() => navigate('/inventory?status=stock-bajo')}
        className="relative min-w-[168px] flex-1 flex flex-col items-center overflow-hidden rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50/50 to-white p-6 text-center shadow-sm transition hover:shadow-md"
      >
        <div className="mb-3 rounded-xl bg-yellow-100/60 p-3 text-yellow-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-yellow-700">
          Stock bajo
        </p>
        <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
          {summary.stockBajo}
        </p>
        <p className="mt-3 text-xs text-[#7A7480]">
          Variantes por debajo del mínimo
        </p>
      </button>

      <button
        type="button"
        onClick={() => navigate('/inventory?status=agotado')}
        className="relative min-w-[168px] flex-1 flex flex-col items-center overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/50 to-white p-6 text-center shadow-sm transition hover:shadow-md"
      >
        <div className="mb-3 rounded-xl bg-red-100/60 p-3 text-red-600">
          <PackageX className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
          Agotados
        </p>
        <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
          {summary.agotados}
        </p>
        <p className="mt-3 text-xs text-[#7A7480]">
          Variantes sin unidades disponibles
        </p>
      </button>
    </div>
  )
}
