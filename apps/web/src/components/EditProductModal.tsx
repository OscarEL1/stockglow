import { useState } from 'react'
import { useUpdateProduct } from '../hooks/useUpdateProduct'
import type { Product } from '../hooks/useProducts'

interface Props {
  product: Product
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function EditProductModal({
  product,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [nombre, setNombre] = useState(product.nombre ?? '')
  const [marca, setMarca] = useState(product.marca ?? '')
  const [categoria, setCategoria] = useState(product.categoria ?? '')
  const [descripcion, setDescripcion] = useState(product.descripcion ?? '')
  const [nombreError, setNombreError] = useState('')

  const { mutate, isPending, error } = useUpdateProduct()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!nombre.trim()) {
      setNombreError('El nombre del producto es obligatorio')
      return
    }

    setNombreError('')

    mutate(
      {
        id: product.id,
        data: {
          nombre: nombre.trim(),
          marca: marca.trim(),
          categoria: categoria.trim(),
          descripcion: descripcion.trim(),
        },
      },
      {
        onSuccess: () => {
          onSuccess('Producto actualizado correctamente')
          onClose()
        },
        onError: (mutationError) => {
          onError(
            mutationError instanceof Error
              ? mutationError.message
              : 'No se pudo actualizar el producto'
          )
        },
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-product-title"
    >
      <div className="w-full max-w-[640px] rounded-[28px] bg-white px-10 py-9 shadow-2xl">
        <div className="mb-8">
          <h2
            id="edit-product-title"
            className="text-[30px] font-extrabold leading-tight text-[#2D2A32]"
          >
            Editar producto
          </h2>

          <p className="mt-2 text-sm text-[#7A7480]">
            Actualiza la información general del producto.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Nombre del producto
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)

                  if (e.target.value.trim()) {
                    setNombreError('')
                  }
                }}
                className={`h-14 w-full rounded-2xl border bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:ring-4 ${
                  nombreError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#F1DDE5] focus:border-[#E85D8C] focus:ring-[#E85D8C]/10'
                }`}
              />

              {nombreError && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {nombreError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                  Marca
                </label>

                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                  Categoría
                </label>

                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Descripción
              </label>

              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="min-h-[120px] w-full resize-none rounded-2xl border border-[#F1DDE5] bg-white px-5 py-4 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              Error: {error.message}
            </p>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-12 min-w-[150px] rounded-2xl border border-[#F1DDE5] bg-white px-6 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9] disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="h-12 min-w-[170px] rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
