import { useEffect, useState } from 'react'
import { useUpdateVariant } from '../hooks/useUpdateVariant'
import { useUploadImage } from '../hooks/useUploadImage'
import type { Variant } from '../hooks/useVariants'

interface Props {
  variant: Variant
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

function formatDateForInput(value: string | null) {
  if (!value) return ''

  return value.slice(0, 10)
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'No se pudo actualizar la variante'
  }

  const normalizedMessage = error.message.toLowerCase()

  if (
    normalizedMessage.includes('sku') &&
    (normalizedMessage.includes('exist') ||
      normalizedMessage.includes('duplic'))
  ) {
    return 'El código SKU ya está registrado en otra variante'
  }

  return error.message
}

export function EditVariantModal({
  variant,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [sku, setSku] = useState(variant.sku ?? '')
  const [nombreVariante, setNombreVariante] = useState(
    variant.nombreVariante ?? ''
  )
  const [precioVenta, setPrecioVenta] = useState(variant.precioVenta ?? '')
  const [stockMinimo, setStockMinimo] = useState(
    String(variant.stockMinimo ?? 0)
  )
  const [fechaCaducidad, setFechaCaducidad] = useState(
    formatDateForInput(variant.fechaCaducidad)
  )

  const [currentImageUrl, setCurrentImageUrl] = useState(variant.imagenUrl)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [showImageInput, setShowImageInput] = useState(!variant.imagenUrl)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { uploadImage } = useUploadImage()

  const [skuError, setSkuError] = useState('')
  const [nombreError, setNombreError] = useState('')
  const [precioError, setPrecioError] = useState('')

  const { mutate, isPending, error } = useUpdateVariant()

  function validateForm() {
    let isValid = true

    setSkuError('')
    setNombreError('')
    setPrecioError('')

    if (!sku.trim()) {
      setSkuError('El código SKU es obligatorio')
      isValid = false
    }

    if (!nombreVariante.trim()) {
      setNombreError('El nombre de la variante es obligatorio')
      isValid = false
    }

    const numericPrice = Number(precioVenta)

    if (!precioVenta || Number.isNaN(numericPrice) || numericPrice <= 0) {
      setPrecioError('Ingresa un precio válido mayor que cero')
      isValid = false
    }

    return isValid
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateForm()) return

    const expirationDate = fechaCaducidad || null

    let finalImagenUrl: string | null | undefined = undefined

    if (imageFile) {
      setUploadingImage(true)
      try {
        finalImagenUrl = await uploadImage(imageFile)
      } catch {
        setUploadingImage(false)
        setUploadError('Error al subir la imagen. Intenta nuevamente.')
        return
      }
      setUploadingImage(false)
    } else if (imageRemoved) {
      finalImagenUrl = null
    }

    mutate(
      {
        id: variant.id,
        data: {
          sku: sku.trim(),
          nombreVariante: nombreVariante.trim(),
          precioVenta: Number(precioVenta),
          stockMinimo: Number(stockMinimo),
          fechaCaducidad: expirationDate,
          imagenUrl: finalImagenUrl,
        },
      },
      {
        onSuccess: () => {
          onSuccess('Variante actualizada correctamente')
          onClose()
        },

        onError: (mutationError) => {
          const message = getErrorMessage(mutationError)

          if (
            message.toLowerCase().includes('sku') ||
            message.toLowerCase().includes('código')
          ) {
            setSkuError(message)
          }

          onError(message)
        },
      }
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

  function handleChangeImageClick() {
    setShowImageInput(true)
  }

  function handleRemoveImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageRemoved(true)
    setCurrentImageUrl(null)
    setImageFile(null)
    setImagePreview(null)
    setUploadError(null)
    setShowImageInput(true)
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
      aria-labelledby="edit-variant-title"
    >
      <div className="w-full max-w-[760px] rounded-[28px] bg-white px-10 py-9 shadow-2xl">
        <div className="mb-8">
          <h2
            id="edit-variant-title"
            className="text-[30px] font-extrabold leading-tight text-[#2D2A32]"
          >
            Editar variante
          </h2>

          <p className="mt-2 text-sm text-[#7A7480]">
            Actualiza el código, nombre, precio, stock mínimo y caducidad.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="edit-variant-name"
                className="mb-2 block text-xs font-bold text-[#6F6875]"
              >
                Variante / tono
              </label>

              <input
                id="edit-variant-name"
                type="text"
                value={nombreVariante}
                onChange={(e) => {
                  setNombreVariante(e.target.value)

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

            <div>
              <label
                htmlFor="edit-variant-sku"
                className="mb-2 block text-xs font-bold text-[#6F6875]"
              >
                Código SKU
              </label>

              <input
                id="edit-variant-sku"
                type="text"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value)

                  if (e.target.value.trim()) {
                    setSkuError('')
                  }
                }}
                className={`h-14 w-full rounded-2xl border bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:ring-4 ${
                  skuError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#F1DDE5] focus:border-[#E85D8C] focus:ring-[#E85D8C]/10'
                }`}
              />

              {skuError && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {skuError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-variant-price"
                className="mb-2 block text-xs font-bold text-[#6F6875]"
              >
                Precio
              </label>

              <input
                id="edit-variant-price"
                type="number"
                value={precioVenta}
                onChange={(e) => {
                  setPrecioVenta(e.target.value)

                  if (Number(e.target.value) > 0) {
                    setPrecioError('')
                  }
                }}
                min="0.01"
                step="0.01"
                className={`h-14 w-full rounded-2xl border bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:ring-4 ${
                  precioError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#F1DDE5] focus:border-[#E85D8C] focus:ring-[#E85D8C]/10'
                }`}
              />

              {precioError && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {precioError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-variant-minimum-stock"
                className="mb-2 block text-xs font-bold text-[#6F6875]"
              >
                Cantidad mínima
              </label>

              <input
                id="edit-variant-minimum-stock"
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                min="0"
                step="1"
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
              />

              <p className="mt-2 text-[11px] text-[#8F8795]">
                Cantidad utilizada para marcar bajo stock.
              </p>
            </div>

            <div>
              <label
                htmlFor="edit-variant-expiration"
                className="mb-2 block text-xs font-bold text-[#6F6875]"
              >
                Fecha de caducidad
              </label>

              <input
                id="edit-variant-expiration"
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

              {!showImageInput && currentImageUrl ? (
                <div className="flex items-center gap-4">
                  <img
                    src={currentImageUrl}
                    alt="Imagen actual"
                    className="h-24 w-24 rounded-xl border border-[#F1DDE5] object-cover"
                  />

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleChangeImageClick}
                      className="rounded-xl border border-[#F1DDE5] bg-white px-4 py-2 text-xs font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9]"
                    >
                      Cambiar imagen
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                    >
                      Eliminar imagen
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                      className="mt-3 h-24 rounded-xl border border-[#F1DDE5] object-cover"
                    />
                  )}

                  <p className="mt-1 text-[11px] text-[#8F8795]">
                    JPG, PNG o WebP. Tamaño máximo: 5MB.
                  </p>

                  {uploadError && (
                    <p className="mt-1 text-sm text-red-600">{uploadError}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {error && !skuError && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              Error: {error.message}
            </p>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending || uploadingImage}
              className="h-12 min-w-[150px] rounded-2xl border border-[#F1DDE5] bg-white px-6 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending || uploadingImage}
              className="h-12 min-w-[170px] rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingImage
                ? 'Subiendo imagen...'
                : isPending
                  ? 'Guardando...'
                  : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
