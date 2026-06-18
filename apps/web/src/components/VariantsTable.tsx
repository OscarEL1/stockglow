import { useVariants } from '../hooks/useVariants'

function StockBadge({ stock, minimo }: { stock: number; minimo: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Agotado
      </span>
    )
  }
  if (stock <= minimo) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Stock bajo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Disponible
    </span>
  )
}

export function VariantsTable() {
  const { data: variants, isLoading, isError, error } = useVariants()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        Error al cargar el inventario: {error?.message}
      </div>
    )
  }

  if (!variants || variants.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
        No hay variantes registradas. Agrega tu primer producto.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Producto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Variante
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Precio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {variants.map((variant) => (
            <tr key={variant.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {variant.producto.nombre}
                </div>
                {variant.producto.marca && (
                  <div className="text-sm text-gray-500">
                    {variant.producto.marca}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {variant.nombreVariante}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-mono text-sm text-gray-600">
                  {variant.sku}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${Number(variant.precioVenta).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {variant.stockActual}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StockBadge
                  stock={variant.stockActual}
                  minimo={variant.stockMinimo}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
