import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useSettings, useUpdateSettings } from '../hooks/useSettings'
import { useUploadImage } from '../hooks/useUploadImage'
import type { StoreSettings } from '../hooks/useSettings'
import { useCategories } from '../hooks/useCategories'
import {
  useCreateCategory,
  useDeleteCategory,
} from '../hooks/useManageCategories'

function LoadingState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
    </div>
  )
}

function ErrorState() {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h3 className="text-sm font-semibold text-red-700">
        No se pudo cargar la configuración
      </h3>
      <p className="mt-1 text-sm text-red-600">Intenta recargar la página.</p>
    </div>
  )
}

interface SettingsFormProps {
  settings: StoreSettings
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

function SettingsForm({ settings, onSuccess, onError }: SettingsFormProps) {
  const [nombre, setNombre] = useState(settings.nombre)
  const [nombreError, setNombreError] = useState('')

  const [currentLogoUrl, setCurrentLogoUrl] = useState(settings.logoUrl)
  const [logoRemoved, setLogoRemoved] = useState(false)
  const [showLogoInput, setShowLogoInput] = useState(!settings.logoUrl)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { uploadImage } = useUploadImage()
  const { mutate, isPending, error } = useUpdateSettings()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!nombre.trim()) {
      setNombreError('El nombre de la tienda es obligatorio')
      return
    }

    setNombreError('')

    let finalLogoUrl: string | null | undefined = undefined

    if (logoFile) {
      setUploadingLogo(true)
      try {
        finalLogoUrl = await uploadImage(logoFile)
      } catch {
        setUploadingLogo(false)
        setUploadError('Error al subir el logo. Intenta nuevamente.')
        return
      }
      setUploadingLogo(false)
    } else if (logoRemoved) {
      finalLogoUrl = null
    }

    mutate(
      { nombre: nombre.trim(), logoUrl: finalLogoUrl },
      {
        onSuccess: () => {
          onSuccess('Configuración guardada correctamente')
        },
        onError: (mutationError) => {
          onError(
            mutationError instanceof Error
              ? mutationError.message
              : 'No se pudo guardar la configuración'
          )
        },
      }
    )
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setUploadError(null)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleChangeLogoClick() {
    setShowLogoInput(true)
  }

  function handleRemoveLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoRemoved(true)
    setCurrentLogoUrl(null)
    setLogoFile(null)
    setLogoPreview(null)
    setUploadError(null)
    setShowLogoInput(true)
  }

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-2 block text-xs font-bold text-[#6F6875]">
          Nombre de la tienda
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            if (e.target.value.trim()) setNombreError('')
          }}
          className={`h-14 w-full rounded-2xl border bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:ring-4 ${
            nombreError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-[#F1DDE5] focus:border-[#E85D8C] focus:ring-[#E85D8C]/10'
          }`}
        />
        {nombreError && (
          <p className="mt-2 text-sm font-medium text-red-600">{nombreError}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold text-[#6F6875]">
          Logo de la tienda
        </label>

        {!showLogoInput && currentLogoUrl ? (
          <div className="flex items-center gap-4">
            <img
              src={currentLogoUrl}
              alt="Logo actual"
              className="h-20 w-20 rounded-xl border border-[#F1DDE5] object-cover"
            />

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleChangeLogoClick}
                className="rounded-xl border border-[#F1DDE5] bg-white px-4 py-2 text-xs font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9]"
              >
                Cambiar logo
              </button>

              <button
                type="button"
                onClick={handleRemoveLogo}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                Eliminar logo
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleLogoChange}
              className="w-full text-sm text-[#2D2A32] file:mr-4 file:rounded-2xl file:border-0 file:bg-[#F1DDE5] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#E85D8C] hover:file:bg-[#E85D8C] hover:file:text-white"
            />

            {logoPreview && (
              <img
                src={logoPreview}
                alt="Preview"
                className="mt-3 h-20 rounded-xl border border-[#F1DDE5] object-cover"
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

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          Error: {error.message}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || uploadingLogo}
          className="h-12 min-w-[170px] rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadingLogo
            ? 'Subiendo logo...'
            : isPending
              ? 'Guardando...'
              : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

function CategoriesSection({
  onSuccess,
  onError,
}: {
  onSuccess: (message: string) => void
  onError: (message: string) => void
}) {
  const [nombre, setNombre] = useState('')
  const { data: categories = [], isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!nombre.trim()) return

    createCategory.mutate(nombre.trim(), {
      onSuccess: () => {
        onSuccess('Categoría agregada correctamente')
        setNombre('')
      },
      onError: (error) => {
        onError(
          error instanceof Error
            ? error.message
            : 'No se pudo agregar la categoría'
        )
      },
    })
  }

  function handleDelete(categoria: string) {
    deleteCategory.mutate(categoria, {
      onSuccess: () => {
        onSuccess('Categoría eliminada correctamente')
      },
      onError: (error) => {
        onError(
          error instanceof Error
            ? error.message
            : 'No se pudo eliminar la categoría'
        )
      },
    })
  }

  return (
    <div className="mt-6 max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-[#2D2A32]">Categorías</h2>
      <p className="mt-1 text-sm text-[#7A7480]">
        Administra las categorías disponibles para tus productos.
      </p>

      <div className="mt-5">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            Aún no hay categorías registradas.
          </p>
        ) : (
          <ul className="space-y-2">
            {categories.map((categoria) => {
              const isDeleting =
                deleteCategory.isPending &&
                deleteCategory.variables === categoria

              return (
                <li
                  key={categoria}
                  className="flex items-center justify-between rounded-xl border border-[#F1DDE5] bg-[#FFF8F9] px-4 py-3"
                >
                  <span className="text-sm font-medium text-[#2D2A32]">
                    {categoria}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(categoria)}
                    disabled={isDeleting}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Eliminar categoría"
                    aria-label={`Eliminar categoría ${categoria}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-5 flex gap-3">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Labiales"
          className="h-12 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
        />
        <button
          type="submit"
          disabled={createCategory.isPending || !nombre.trim()}
          className="h-12 min-w-[170px] whitespace-nowrap rounded-2xl bg-[#E85D8C] px-5 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createCategory.isPending ? 'Agregando...' : 'Agregar categoría'}
        </button>
      </form>
    </div>
  )
}

export function Settings() {
  const { data: settings, isLoading, isError } = useSettings()
  const { toast, showToast, hideToast } = useToast()

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2A32]">Configuración</h1>
        <p className="mt-1 text-[#7A7480]">
          Personaliza el nombre, el logo y las categorías de tu tienda.
        </p>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState />}

      {settings && (
        <SettingsForm
          settings={settings}
          onSuccess={(message) => showToast(message, 'success')}
          onError={(message) => showToast(message, 'error')}
        />
      )}

      <CategoriesSection
        onSuccess={(message) => showToast(message, 'success')}
        onError={(message) => showToast(message, 'error')}
      />

      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </Layout>
  )
}
