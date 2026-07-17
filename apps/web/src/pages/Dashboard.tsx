import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganization } from '@clerk/clerk-react'
import { useQueryClient } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { AlertsPanel } from '../components/AlertsPanel'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { useSalesByDay, useTopProducts } from '../hooks/useReports'
import { useAlerts } from '../hooks/useAlerts'
import { useStockWebSocket } from '../hooks/useStockWebSocket'
import { SalesChart } from '../components/SalesChart'
import { TopProductsList } from '../components/TopProductsList'
import { CategoryPieChart } from '../components/CategoryPieChart'
import {
  Package,
  DollarSign,
  AlertTriangle,
  RefreshCcw,
  Bell,
  CheckCircle2,
  PackageX,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

export function Dashboard() {
  const navigate = useNavigate()
  const { organization } = useOrganization()
  const queryClient = useQueryClient()
  useStockWebSocket(organization?.id ?? null, queryClient)

  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const { data: summary, isLoading, isError } = useDashboardSummary()
  const { data: alerts = [] } = useAlerts()
  const { data: salesData, isLoading: salesLoading } = useSalesByDay()
  const [period, setPeriod] = useState<'week' | 'month'>('month')
  const { data: topProducts, isLoading: topLoading } = useTopProducts(period)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    queryClient.invalidateQueries({ queryKey: ['salesByDay'] })
    queryClient.invalidateQueries({ queryKey: ['topProducts'] })
    queryClient.invalidateQueries({ queryKey: ['alerts'] })
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2D2A32]">
              Dashboard
            </h1>
            <p className="text-sm text-[#7A7480] mt-1">
              Resumen en tiempo real del estado de tu inventario
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAlertsOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Bell className="h-4 w-4" />
              Alertas
              {alerts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {alerts.length > 9 ? '9+' : alerts.length}
                </span>
              )}
            </button>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Summary cards loading skeleton */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
            <h3 className="text-sm font-semibold text-red-800">
              Error al cargar datos
            </h3>
            <p className="text-xs text-red-600 mt-1">
              No pudimos recuperar las estadísticas de tu inventario.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Summary cards */}
        {!isLoading && !isError && summary && (
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {/* Card 0: Ventas de Hoy */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-sm transition hover:shadow-md flex flex-col items-center text-center">
              <div className="rounded-xl bg-blue-100/60 p-3 text-blue-600 mb-3">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Ventas de Hoy
              </p>
              <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
                $
                {Number(summary.totalVentasHoy).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-3 text-xs text-[#7A7480]">
                Ingresos acumulados hoy
              </p>
            </div>

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

            {/* Card 4: Ventas del Mes (HU-068) */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm transition hover:shadow-md flex flex-col items-center text-center ${
                summary.totalVentasMesAnterior > 0
                  ? summary.totalVentasMesActual >=
                    summary.totalVentasMesAnterior
                    ? 'border-green-100 bg-gradient-to-br from-green-50/50 to-white'
                    : 'border-red-100 bg-gradient-to-br from-red-50/50 to-white'
                  : 'border-blue-100 bg-gradient-to-br from-blue-50/50 to-white'
              }`}
            >
              <div
                className={`rounded-xl p-3 mb-3 ${
                  summary.totalVentasMesAnterior > 0
                    ? summary.totalVentasMesActual >=
                      summary.totalVentasMesAnterior
                      ? 'bg-green-100/60 text-green-600'
                      : 'bg-red-100/60 text-red-600'
                    : 'bg-blue-100/60 text-blue-600'
                }`}
              >
                {summary.totalVentasMesAnterior > 0 ? (
                  summary.totalVentasMesActual >=
                  summary.totalVentasMesAnterior ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )
                ) : (
                  <DollarSign className="h-6 w-6" />
                )}
              </div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  summary.totalVentasMesAnterior > 0
                    ? summary.totalVentasMesActual >=
                      summary.totalVentasMesAnterior
                      ? 'text-green-600'
                      : 'text-red-600'
                    : 'text-blue-600'
                }`}
              >
                Ventas del Mes
              </p>
              <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
                $
                {Number(summary.totalVentasMesActual).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
              {summary.totalVentasMesAnterior > 0 && (
                <p
                  className={`mt-3 text-xs font-medium ${
                    summary.totalVentasMesActual >=
                    summary.totalVentasMesAnterior
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {summary.totalVentasMesActual >=
                  summary.totalVentasMesAnterior
                    ? '+'
                    : ''}
                  {(
                    ((summary.totalVentasMesActual -
                      summary.totalVentasMesAnterior) /
                      summary.totalVentasMesAnterior) *
                    100
                  ).toFixed(1)}
                  % vs mes ant.
                </p>
              )}
              {summary.totalVentasMesAnterior === 0 && (
                <p className="mt-3 text-xs text-[#7A7480]">
                  Ingresos de este mes
                </p>
              )}
            </div>
          </div>
        )}

        {/* Inventory status summary cards */}
        {!isLoading && !isError && summary && (
          <div className="grid gap-6 md:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate('/inventory?status=disponible')}
              className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-50/50 to-white p-6 text-center shadow-sm transition hover:shadow-md"
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
              className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50/50 to-white p-6 text-center shadow-sm transition hover:shadow-md"
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
              className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/50 to-white p-6 text-center shadow-sm transition hover:shadow-md"
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
        )}

        {/* Reports: Sales chart + Top products */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart data={salesData ?? []} isLoading={salesLoading} />
          </div>
          <div className="lg:col-span-1">
            <TopProductsList
              products={topProducts ?? []}
              period={period}
              onPeriodChange={setPeriod}
              isLoading={topLoading}
            />
          </div>
        </div>

        {/* Category distribution pie chart */}
        <CategoryPieChart />
      </div>

      <AlertsPanel
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />
    </Layout>
  )
}
