import { useState } from 'react'
import { useOrganization } from '@clerk/clerk-react'
import { useQueryClient } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { AlertsPanel } from '../components/AlertsPanel'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { useSalesMetrics } from '../hooks/useSalesMetrics'
import {
  useSalesByDay,
  useTopProducts,
  useEmployeesRanking,
} from '../hooks/useReports'
import { useAlerts } from '../hooks/useAlerts'
import { useStockWebSocket } from '../hooks/useStockWebSocket'
import { SalesChart } from '../components/SalesChart'
import { TopProductsList } from '../components/TopProductsList'
import { CategoryPieChart } from '../components/CategoryPieChart'
import { SalesMetricsCards } from '../components/SalesMetricsCards'
import { DashboardSummary } from '../components/DashboardSummary'
import { EmployeesRanking } from '../components/EmployeesRanking'
import { RefreshCcw, Bell, FileUp } from 'lucide-react'
import { ImportInventoryModal } from '../components/ImportInventoryModal'
import { useRole } from '../hooks/useRole'

export function Dashboard() {
  const { organization } = useOrganization()
  const queryClient = useQueryClient()

  useStockWebSocket(organization?.id ?? null, queryClient)

  const [isAlertsOpen, setIsAlertsOpen] = useState(false)

  const { data: summary, isLoading, isError } = useDashboardSummary()
  const { data: salesMetrics, isLoading: salesMetricsLoading } =
    useSalesMetrics()
  const { data: alerts = [] } = useAlerts()

  const { data: salesData, isLoading: salesLoading } = useSalesByDay()

  const [period, setPeriod] = useState<'week' | 'month'>('month')

  const { data: topProducts, isLoading: topLoading } = useTopProducts(period)

  const { isAdmin } = useRole()
  // El ranking expone el desempeño individual de cada empleada, por lo
  // que solo la dueña (org:admin) puede verlo, igual que el resto de
  // acciones sensibles del dashboard (ej. "Importar inventario").
  const canViewRanking = isAdmin

  const { data: employeesRanking = [], isLoading: rankingLoading } =
    useEmployeesRanking(canViewRanking)

  const [isImportOpen, setIsImportOpen] = useState(false)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    queryClient.invalidateQueries({ queryKey: ['sales-metrics'] })
    queryClient.invalidateQueries({ queryKey: ['salesByDay'] })
    queryClient.invalidateQueries({ queryKey: ['topProducts'] })
    queryClient.invalidateQueries({ queryKey: ['employeesRanking'] })
    queryClient.invalidateQueries({ queryKey: ['alerts'] })
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2D2A32]">
              Dashboard
            </h1>
            <p className="text-sm text-[#7A7480] mt-1">
              Resumen en tiempo real del estado de tu inventario
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E85D8C] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#D94B7D] md:w-auto"
              >
                <FileUp className="h-4 w-4" />
                Importar inventario
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAlertsOpen(true)}
              className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 md:w-auto"
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
              type="button"
              onClick={handleRefresh}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 md:w-auto"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Ventas por período (HU-072) */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#2D2A32]">
            Ventas por período
          </h2>
          <SalesMetricsCards
            metrics={salesMetrics}
            isLoading={salesMetricsLoading}
            totalValue={summary?.totalValue}
            isValueLoading={isLoading}
          />
        </div>

        {/* Resumen de inventario */}
        <DashboardSummary
          summary={summary}
          isLoading={isLoading}
          isError={isError}
          onRetry={handleRefresh}
        />

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

        {/* Category distribution + Ranking (ranking solo visible para la dueña, org:admin) */}
        <div className={canViewRanking ? 'grid gap-6 lg:grid-cols-3' : ''}>
          <div className={canViewRanking ? 'lg:col-span-2' : ''}>
            <CategoryPieChart />
          </div>

          {canViewRanking && (
            <div>
              <EmployeesRanking
                employees={employeesRanking}
                isLoading={rankingLoading}
              />
            </div>
          )}
        </div>
      </div>

      <ImportInventoryModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      <AlertsPanel
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />
    </Layout>
  )
}
