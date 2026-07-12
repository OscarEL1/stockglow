import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from 'recharts'
import type {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent'
import { useCategoryDistribution } from '../hooks/useCategoryDistribution'

const COLORS = [
  '#E85D8C',
  '#7C5CBF',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
  '#F97316',
]

function CustomTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-xl border border-pink-100 bg-white px-4 py-3 shadow-lg">
        <p className="mb-1 text-sm font-bold text-gray-900">{data.categoria}</p>
        <p className="text-xs text-gray-600">
          Variantes:{' '}
          <span className="font-semibold text-gray-900">
            {data.totalVariants}
          </span>
        </p>
        <p className="text-xs text-gray-600">
          Valor:{' '}
          <span className="font-semibold text-[#E85D8C]">
            $
            {Number(data.totalValue).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </p>
      </div>
    )
  }
  return null
}

function LoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
        <p className="text-sm text-gray-500">Cargando distribución...</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-pink-200 bg-white p-6">
      <p className="text-sm text-gray-400">
        No hay datos de inventario para mostrar.
      </p>
    </div>
  )
}

export function CategoryPieChart() {
  const { data = [], isLoading } = useCategoryDistribution()

  if (isLoading) return <LoadingState />
  if (data.length === 0) return <EmptyState />

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-[#2D2A32]">
          Distribución por categoría
        </h3>
        <p className="mt-0.5 text-xs text-[#7A7480]">
          Valor de inventario según tipo de producto
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="totalValue"
            nameKey="categoria"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
