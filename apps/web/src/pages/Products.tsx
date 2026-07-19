import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useProducts, type Product } from '../hooks/useProducts'
import { useRole } from '../hooks/useRole'
import { AddProductModal } from '../components/AddProductModal'
import { EditProductModal } from '../components/EditProductModal'
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { useDeleteProduct } from '../hooks/useDeleteProduct'

export function Products() {
  const { data: products = [], isLoading, error } = useProducts()
  const { isAdmin } = useRole()
  const { toast, showToast, hideToast } = useToast()

  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()

  function handleConfirmDelete() {
    if (!productToDelete) return

    deleteProduct(productToDelete.id, {
      onSuccess: (response) => {
        const deletedVariants =
          response.data?.variantesEliminadas ??
          productToDelete.variantes?.length ??
          0

        showToast(
          `Producto eliminado correctamente. ${deletedVariants} variante${
            deletedVariants === 1 ? '' : 's'
          } eliminada${deletedVariants === 1 ? '' : 's'}.`,
          'success'
        )

        setProductToDelete(null)
      },

      onError: (mutationError) => {
        showToast(
          mutationError instanceof Error
            ? mutationError.message
            : 'No se pudo eliminar el producto',
          'error'
        )

        setProductToDelete(null)
      },
    })
  }

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

                            <button
                              type="button"
                              onClick={() => setProductToDelete(product)}
                              title="Eliminar producto"
                              aria-label={`Eliminar ${product.nombre}`}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-500 transition hover:border-red-500 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                            >
                              <Trash2 size={17} />
                            </button>
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

      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
        >
          <div className="w-full max-w-[520px] rounded-[28px] bg-white px-8 py-8 shadow-2xl sm:px-10 sm:py-9">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              <div>
                <h2
                  id="delete-product-title"
                  className="text-xl font-extrabold leading-tight text-[#2D2A32]"
                >
                  Eliminar producto
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#7A7480]">
                  ¿Estás seguro de que deseas eliminar{' '}
                  <span className="font-semibold text-[#2D2A32]">
                    {productToDelete.nombre}
                  </span>
                  ?
                </p>

                <p className="mt-2 text-sm leading-6 text-[#7A7480]">
                  También se eliminarán sus{' '}
                  <span className="font-semibold text-[#2D2A32]">
                    {productToDelete.variantes?.length ?? 0} variante
                    {(productToDelete.variantes?.length ?? 0) === 1 ? '' : 's'}
                  </span>
                  .
                </p>

                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium leading-5 text-red-700">
                    Esta acción no se puede deshacer. Los productos con
                    historial de ventas no pueden eliminarse.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="h-12 min-w-[130px] rounded-2xl border border-[#F1DDE5] bg-white px-6 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="h-12 min-w-[170px] rounded-2xl bg-red-600 px-6 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </Layout>
  )
}
