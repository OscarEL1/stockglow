import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useProducts, type Product } from '../hooks/useProducts'
import { useRole } from '../hooks/useRole'
import { AddProductModal } from '../components/AddProductModal'
import { EditProductModal } from '../components/EditProductModal'
import { Pencil } from 'lucide-react'

export function Products() {
  const { data: products = [], isLoading, error } = useProducts()
  const { isAdmin } = useRole()
  const { toast, showToast, hideToast } = useToast()

  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase()

    if (!term) return true

    return (
      product.nombre.toLowerCase().includes(term) ||
      product.marca?.toLowerCase().includes(term) ||
      product.categoria?.toLowerCase().includes(term)
    )
  })

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A32]">Productos</h1>

          <p className="mt-1 text-[#7A7480]">
            Consulta y edita los productos registrados
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="h-12 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10 sm:min-w-[300px]"
          />

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowProductModal(true)}
              className="h-12 whitespace-nowrap rounded-2xl bg-[#E85D8C] px-5 text-sm font-bold text-white transition hover:bg-[#D94B7D]"
            >
              + Agregar producto
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-[#F1DDE5] bg-white p-8 text-center">
          <p className="text-sm text-[#7A7480]">Cargando productos...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-600">
            {error instanceof Error
              ? error.message
              : 'No se pudieron cargar los productos'}
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-2xl border border-[#F1DDE5] bg-white shadow-sm">
          <div className="border-b border-[#F1DDE5] px-6 py-5">
            <h2 className="text-lg font-bold text-[#2D2A32]">
              Lista de productos
            </h2>

            <p className="mt-1 text-sm text-[#7A7480]">
              {filteredProducts.length} producto
              {filteredProducts.length === 1 ? '' : 's'}
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-semibold text-[#2D2A32]">
                No se encontraron productos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#F1DDE5]">
                <thead className="bg-[#FFF8F9]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-[#6F6875]">
                      Nombre
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-[#6F6875]">
                      Marca
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-[#6F6875]">
                      Categoría
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-[#6F6875]">
                      Variantes
                    </th>

                    {isAdmin && (
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase text-[#6F6875]">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F1DDE5]">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-[#FFFAFB]"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#2D2A32]">
                          {product.nombre}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-[#6F6875]">
                        {product.marca || 'Sin marca'}
                      </td>

                      <td className="px-6 py-4">
                        {product.categoria ? (
                          <span className="rounded-full bg-[#FCE8EF] px-3 py-1 text-xs font-bold text-[#C64270]">
                            {product.categoria}
                          </span>
                        ) : (
                          <span className="text-sm text-[#9B95A1]">
                            Sin categoría
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#6F6875]">
                        {product.variantes?.length ?? 0}
                      </td>

                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(product)}
                              title="Editar producto"
                              aria-label={`Editar ${product.nombre}`}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F1DDE5] text-[#E85D8C] transition hover:border-[#E85D8C] hover:bg-[#FFF1F5]"
                            >
                              <Pencil size={17} />
                            </button>

                            {/* TODO: HU-012 — Eliminar producto */}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedProduct && (
        <EditProductModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={(message) => showToast(message, 'success')}
          onError={(message) => showToast(message, 'error')}
        />
      )}

      {showProductModal && (
        <AddProductModal
          onClose={() => setShowProductModal(false)}
          onSuccess={(message) => {
            showToast(message, 'success')
            setShowProductModal(false)
          }}
        />
      )}

      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </Layout>
  )
}
