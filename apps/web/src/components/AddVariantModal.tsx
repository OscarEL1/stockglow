import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useCreateVariant } from '../hooks/useCreateVariant'
import { useUploadImage } from '../hooks/useUploadImage'

interface Props {
  onClose: () => void
}

export function AddVariantModal({ onClose }: Props) {
  const { data: products } = useProducts()
  const { mutate, isPending, error } = useCreateVariant()

  const [productoId, setProductoId] = useState('')
  const [sku, setSku] = useState('')
  const [nombreVariante, setNombreVariante] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stockActual, setStockActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('5')
  const [imagenUrl, setImagenUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { uploadImage } = useUploadImage()
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productoId || !sku.trim() || !nombreVariante.trim() || !precioVenta)
      return

    let urlFinal = imagenUrl

    if (imageFile) {
      setUploadingImage(true)
      try {
        urlFinal = await uploadImage(imageFile)
        setImagenUrl(urlFinal)
      } catch {
        setUploadingImage(false)
        setUploadError('Error al subir la imagen. Intenta nuevamente.')
        return
      }
      setUploadingImage(false)
    }

    mutate(
      {
        productoId,
        sku: sku.trim(),
        nombreVariante: nombreVariante.trim(),
        precioVenta: Number(precioVenta),
        stockActual: Number(stockActual),
        stockMinimo: Number(stockMinimo),
        imagenUrl: urlFinal || undefined,
      },
      { onSuccess: onClose }
    )
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setUploadError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-variant-title"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2
          id="add-variant-title"
          className="text-lg font-semibold text-gray-900 mb-4"
        >
          Agregar variante
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto *
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un producto</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.marca ? `— ${p.marca}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="LAB-MATTE-04"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre / Tono *
            </label>
            <input
              type="text"
              value={nombreVariante}
              onChange={(e) => setNombreVariante(e.target.value)}
              placeholder="Fucsia Intenso"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio *
              </label>
              <input
                type="number"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                placeholder="120"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock min
              </label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Imagen del Producto
              </label>
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleImageChange}
                className="w-full text-sm text-[#2D2A32] file:mr-4 file:rounded-2xl file:border-0 file:bg-[#F1DDE5] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#E85D8C] hover:file:bg-[#E85D8C] hover:file:text-white"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-3 h-24 rounded-xl object-cover border border-[#F1DDE5]"
                />
              )}
              {uploadError && (
                <p className="mt-1 text-[11px] text-[#8F8795]">
                  JPG, PNG o WebP. Tamaño máximo: 5MB.
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">Error: {error.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isPending ||
                uploadingImage ||
                !productoId ||
                !sku.trim() ||
                !nombreVariante.trim() ||
                !precioVenta
              }
              className="h-12 min-w-[170px] rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingImage
                ? 'Subiendo imagen...'
                : isPending
                  ? 'Guardando...'
                  : 'Guardar variante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
