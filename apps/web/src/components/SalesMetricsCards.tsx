import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import type { SalesMetrics, SalesPeriodMetric } from '../hooks/useSalesMetrics'

type Period = 'hoy' | 'semana' | 'mes'

interface Props {
  metrics: SalesMetrics | undefined
  isLoading: boolean
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

export function SalesMetricsCards({ metrics, isLoading }: Props) {
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

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          />
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {(Object.keys(PERIOD_CONFIG) as Period[]).map((period) => {
        const { label, subtitle, icon: Icon } = PERIOD_CONFIG[period]
        const data = metrics[period]
        const isActive = selectedPeriod === period

        return (
          <button
            key={period}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleClick(period, data)}
            className={`relative flex flex-col items-center overflow-hidden rounded-2xl border p-6 text-center shadow-sm transition hover:shadow-md ${
              isActive
                ? 'border-[#E85D8C] bg-gradient-to-br from-[#FDE8F0] to-white ring-2 ring-[#E85D8C]/30'
                : 'border-pink-100 bg-gradient-to-br from-pink-50/50 to-white'
            }`}
          >
            <div
              className={`mb-3 rounded-xl p-3 ${
                isActive
                  ? 'bg-[#E85D8C] text-white'
                  : 'bg-pink-100/60 text-pink-600'
              }`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                isActive ? 'text-[#D94B7D]' : 'text-pink-600'
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
            <p className="mt-3 text-xs text-[#7A7480]">
              {data.numeroVentas} {data.numeroVentas === 1 ? 'venta' : 'ventas'}{' '}
              · {subtitle}
            </p>
          </button>
        )
      })}
    </div>
  )
}
