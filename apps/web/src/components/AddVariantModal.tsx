import { useEffect, useState } from 'react'
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
  const [fechaCaducidad, setFechaCaducidad] = useState('')
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

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-variant-title"
    >
      <div className="w-full max-w-[760px] rounded-[28px] bg-white px-10 py-9 shadow-2xl">
        <div className="mb-8">
          <h2
            id="add-variant-title"
            className="text-[30px] font-extrabold leading-tight text-[#2D2A32]"
          >
            Agregar variante
          </h2>
          <p className="mt-2 text-sm text-[#7A7480]">
            Crea un SKU específico con tono, precio, stock y caducidad.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Producto
              </label>
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
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
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Variante / tono
              </label>
              <input
                type="text"
                value={nombreVariante}
                onChange={(e) => setNombreVariante(e.target.value)}
                placeholder="Rosa Nude"
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Código del producto
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="LAB-ROS-001"
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                  Precio
                </label>
                <input
                  type="number"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="120"
                  min="0"
                  step="0.01"
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                  Cantidad disponible
                </label>
                <input
                  type="number"
                  value={stockActual}
                  onChange={(e) => setStockActual(e.target.value)}
                  min="0"
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                />
                <p className="mt-2 text-[11px] leading-tight text-[#8F8795]">
                  Número de piezas que tienes actualmente.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Cantidad mínima
              </label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                min="0"
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
              />
              <p className="mt-2 text-[11px] text-[#8F8795]">
                Cantidad mínima para bajo stock.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Fecha de caducidad
              </label>
              <input
                type="date"
                value={fechaCaducidad}
                onChange={(e) => setFechaCaducidad(e.target.value)}
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
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
              <p className="mt-1 text-[11px] text-[#8F8795]">
                JPG, PNG o WebP. Tamaño máximo: 5MB.
              </p>
              {uploadError && (
                <p className="mt-1 text-sm text-red-600">{uploadError}</p>
              )}
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
