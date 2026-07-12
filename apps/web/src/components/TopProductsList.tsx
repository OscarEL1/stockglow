import { Package } from 'lucide-react'
import { type TopProductItem } from '../hooks/useReports'

interface TopProductsListProps {
  products: TopProductItem[]
  period: 'week' | 'month'
  onPeriodChange: (p: 'week' | 'month') => void
  isLoading?: boolean
}

export function TopProductsList({
  products,
  period,
  onPeriodChange,
  isLoading,
}: TopProductsListProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-[#2D2A32]">
            Top productos
          </h2>
          <p className="text-xs text-[#7A7480] mt-0.5">
            Más vendidos del período
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => onPeriodChange('week')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              period === 'week'
                ? 'bg-white text-[#2D2A32] shadow-sm'
                : 'text-[#7A7480] hover:text-[#2D2A32]'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => onPeriodChange('month')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              period === 'month'
                ? 'bg-white text-[#2D2A32] shadow-sm'
                : 'text-[#7A7480] hover:text-[#2D2A32]'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-gray-100" />
                <div className="h-2.5 w-1/3 rounded bg-gray-100" />
              </div>
              <div className="h-3 w-8 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-3">
            <Package className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-[#2D2A32]">
            Sin ventas registradas
          </p>
          <p className="text-xs text-[#7A7480] mt-1">
            {period === 'week' ? 'esta semana' : 'este mes'}
          </p>
        </div>
      )}

      {/* Product list */}
      {!isLoading && products.length > 0 && (
        <ol className="space-y-3">
          {products.map((product, index) => (
            <li key={product.id} className="flex items-center gap-3">
              {/* Rank */}
              <span className="text-xs font-bold text-[#7A7480] w-4 flex-shrink-0">
                {index + 1}
              </span>
              {/* Image */}
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                {product.imagenUrl ? (
                  <img
                    src={product.imagenUrl}
                    alt={product.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Name */}
              <p className="flex-1 text-sm font-medium text-[#2D2A32] truncate">
                {product.nombre}
              </p>
              {/* Units sold */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-pink-600">
                  {product.cantidadVendida}
                </p>
                <p className="text-[10px] text-[#7A7480]">uds.</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
