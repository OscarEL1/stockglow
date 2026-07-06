import { useState } from 'react'
import { useCreateProduct } from '../hooks/useCreateProduct'

interface Props {
  onClose: () => void
  onSuccess: (message: string) => void
}

export function AddProductModal({ onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const { mutate, isPending, error } = useCreateProduct()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return

    mutate(
      {
        nombre: nombre.trim(),
        marca: marca.trim() || undefined,
        categoria: categoria.trim() || undefined,
      },
      {
        onSuccess: () => {
          onSuccess('Producto guardado correctamente')
        },
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
    >
      <div className="w-full max-w-[640px] rounded-[28px] bg-white px-10 py-9 shadow-2xl">
        <div className="mb-8">
          <h2
            id="add-product-title"
            className="text-[30px] font-extrabold leading-tight text-[#2D2A32]"
          >
            Agregar producto
          </h2>
          <p className="mt-2 text-sm text-[#7A7480]">
            Registra el producto base. Las variantes se agregan después.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Nombre del producto
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Labial Velvet"
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                required
              />
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
                  placeholder="Glow Beauty"
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
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
                  placeholder="Labiales"
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
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
                placeholder="Descripción corta del producto..."
                className="min-h-[120px] w-full resize-none rounded-2xl border border-[#F1DDE5] bg-white px-5 py-4 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
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
              className="h-12 min-w-[150px] rounded-2xl border border-[#F1DDE5] bg-white px-6 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending || !nombre.trim()}
              className="h-12 min-w-[170px] rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
