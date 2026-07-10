import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import { type SalesByDayItem } from '../hooks/useReports'

interface SalesChartProps {
  data: SalesByDayItem[]
  isLoading?: boolean
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-pink-100 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs text-[#7A7480] mb-1">{label}</p>
        <p className="text-base font-bold text-pink-600">
          $
          {Number(payload[0].value).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    )
  }
  return null
}

export function SalesChart({ data, isLoading }: SalesChartProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[#2D2A32]">
          Ventas de los últimos 7 días
        </h2>
        <p className="text-xs text-[#7A7480] mt-0.5">
          Total de ventas completadas por día
        </p>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
      )}

      {/* Chart */}
      {!isLoading && (
        <ResponsiveContainer width="100%" height={224}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#7A7480' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#7A7480' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
              }
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fce7f3' }} />
            <Bar
              dataKey="total"
              fill="#ec4899"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Zero state message */}
      {!isLoading && data.every((d) => d.total === 0) && (
        <p className="text-center text-xs text-[#7A7480] mt-4">
          No hay ventas completadas en los últimos 7 días.
        </p>
      )}
    </div>
  )
}
