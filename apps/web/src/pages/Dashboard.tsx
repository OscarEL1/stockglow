import { Layout } from '../components/Layout'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { Package, DollarSign, AlertTriangle, RefreshCcw } from 'lucide-react'

export function Dashboard() {
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary()

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2D2A32]">
              Dashboard
            </h1>
            <p className="text-sm text-[#7A7480] mt-1">
              Resumen en tiempo real del estado de tu inventario
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
            <h3 className="text-sm font-semibold text-red-800">
              Error al cargar datos
            </h3>
            <p className="text-xs text-red-600 mt-1">
              No pudimos recuperar las estadísticas de tu inventario.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !isError && summary && (
          <div className="grid gap-6 md:grid-cols-4">
            {/* Card 1: Unique Products */}
            <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/50 to-white p-6 shadow-sm transition hover:shadow-md flex flex-col items-center text-center">
              <div className="rounded-xl bg-pink-100/60 p-3 text-pink-600 mb-3">
                <Package className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-pink-600">
                Productos únicos
              </p>
              <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
                {summary.totalProducts}
              </p>
              <p className="mt-3 text-xs text-[#7A7480]">
                Productos base en catálogo
              </p>
            </div>

            {/* Card 2: Total Variants */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-6 shadow-sm transition hover:shadow-md flex flex-col items-center text-center">
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

            {/* Card 3: Total Inventory Value */}
            <div className="relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-50/50 to-white p-6 shadow-sm transition hover:shadow-md flex flex-col items-center text-center">
              <div className="rounded-xl bg-green-100/60 p-3 text-green-600 mb-3">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                Valor total
              </p>
              <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
                $
                {Number(summary.totalValue).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-3 text-xs text-[#7A7480]">
                Valor total del inventario
              </p>
            </div>

            {/* Card 4: Active Alerts */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm transition hover:shadow-md flex flex-col items-center text-center ${
                summary.totalAlerts > 0
                  ? 'border-yellow-200 bg-gradient-to-br from-yellow-50/40 to-white'
                  : 'border-gray-100 bg-gradient-to-br from-gray-50/50 to-white'
              }`}
            >
              <div
                className={`rounded-xl p-3 mb-3 ${
                  summary.totalAlerts > 0
                    ? 'bg-yellow-100/70 text-yellow-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  summary.totalAlerts > 0 ? 'text-yellow-700' : 'text-gray-500'
                }`}
              >
                Alertas activas
              </p>
              <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
                {summary.totalAlerts}
              </p>
              <p className="mt-3 text-xs text-[#7A7480]">
                Variantes con stock bajo
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
