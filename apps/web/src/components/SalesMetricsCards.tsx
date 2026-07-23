import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { SalesMetrics, SalesPeriodMetric } from '../hooks/useSalesMetrics'

type Period = 'hoy' | 'semana' | 'mes'

interface Props {
  metrics: SalesMetrics | undefined
  isLoading: boolean
  totalValue: number | undefined
  isValueLoading: boolean
}

const PERIOD_CONFIG: Record<
  Period,
  { label: string; subtitle: string; icon: typeof Calendar }
> = {
  hoy: { label: 'Hoy', subtitle: 'Ventas del día', icon: Calendar },
  semana: {
    label: 'Esta semana',
    subtitle: 'Lunes a domingo',
    icon: CalendarDays,
  },
  mes: {
    label: 'Este mes',
    subtitle: 'Mes calendario actual',
    icon: CalendarRange,
  },
}

function SkeletonCard() {
  return (
    <div className="h-36 min-w-[210px] flex-1 animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" />
  )
}

export function SalesMetricsCards({
  metrics,
  isLoading,
  totalValue,
  isValueLoading,
}: Props) {
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)

  function handleClick(period: Period, data: SalesPeriodMetric) {
    setSelectedPeriod(period)
    const params = new URLSearchParams({
      periodo: period,
      desde: data.fechaInicio,
      hasta: data.fechaFin,
    })
    navigate(`/sales?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-6">
      {isLoading &&
        [...Array(3)].map((_, i) => (
          <SkeletonCard key={`period-skeleton-${i}`} />
        ))}

      {!isLoading &&
        metrics &&
        (Object.keys(PERIOD_CONFIG) as Period[]).map((period) => {
          const { label, subtitle, icon: Icon } = PERIOD_CONFIG[period]
          const data = metrics[period]
          const isActive = selectedPeriod === period

          // Solo la card "mes" tiene comparacion vs periodo anterior — el
          // mismo criterio visual que tenia la card "Ventas del Mes" en
          // useDashboardSummary (verde/rojo si hay dato de comparacion,
          // azul neutral si montoMesAnterior es 0, es decir sin datos).
          const mes = period === 'mes' ? metrics.mes : null
          const hasComparison = mes !== null && mes.montoMesAnterior > 0
          const isUp = hasComparison && mes!.montoTotal >= mes!.montoMesAnterior

          const theme =
            mes === null
              ? 'pink'
              : !hasComparison
                ? 'blue'
                : isUp
                  ? 'green'
                  : 'red'

          const CardIcon =
            mes !== null && hasComparison
              ? isUp
                ? TrendingUp
                : TrendingDown
              : Icon

          return (
            <button
              key={period}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleClick(period, data)}
              className={`relative min-w-[210px] flex-1 flex flex-col items-center overflow-hidden rounded-2xl border p-6 text-center shadow-sm transition hover:shadow-md ${
                isActive
                  ? 'border-[#E85D8C] bg-gradient-to-br from-[#FDE8F0] to-white ring-2 ring-[#E85D8C]/30'
                  : theme === 'green'
                    ? 'border-green-100 bg-gradient-to-br from-green-50/50 to-white'
                    : theme === 'red'
                      ? 'border-red-100 bg-gradient-to-br from-red-50/50 to-white'
                      : theme === 'blue'
                        ? 'border-blue-100 bg-gradient-to-br from-blue-50/50 to-white'
                        : 'border-pink-100 bg-gradient-to-br from-pink-50/50 to-white'
              }`}
            >
              <div
                className={`mb-3 rounded-xl p-3 ${
                  isActive
                    ? 'bg-[#E85D8C] text-white'
                    : theme === 'green'
                      ? 'bg-green-100/60 text-green-600'
                      : theme === 'red'
                        ? 'bg-red-100/60 text-red-600'
                        : theme === 'blue'
                          ? 'bg-blue-100/60 text-blue-600'
                          : 'bg-pink-100/60 text-pink-600'
                }`}
              >
                <CardIcon className="h-6 w-6" />
              </div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isActive
                    ? 'text-[#D94B7D]'
                    : theme === 'green'
                      ? 'text-green-600'
                      : theme === 'red'
                        ? 'text-red-600'
                        : theme === 'blue'
                          ? 'text-blue-600'
                          : 'text-pink-600'
                }`}
              >
                {label}
              </p>
              <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
                $
                {data.montoTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {mes !== null && hasComparison ? (
                <p
                  className={`mt-3 text-xs font-medium ${
                    isUp ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isUp ? '+' : ''}
                  {mes!.porcentajeCambio.toFixed(1)}% vs mes ant.
                </p>
              ) : (
                <p className="mt-3 text-xs text-[#7A7480]">
                  {data.numeroVentas}{' '}
                  {data.numeroVentas === 1 ? 'venta' : 'ventas'}
                  {mes === null && ` · ${subtitle}`}
                </p>
              )}
            </button>
          )
        })}

      {isValueLoading && <SkeletonCard />}

      {!isValueLoading && totalValue !== undefined && (
        <div className="relative min-w-[210px] flex-1 flex flex-col items-center overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6 text-center shadow-sm transition hover:shadow-md">
          <div className="mb-3 rounded-xl bg-indigo-100/60 p-3 text-indigo-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Valor total
          </p>
          <p className="mt-2 text-3xl font-bold text-[#2D2A32]">
            $
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-3 text-xs text-[#7A7480]">
            Valor total del inventario
          </p>
        </div>
      )}
    </div>
  )
}
