import { useState } from 'react'
import { useSuppliers, type Supplier } from '../hooks/useSuppliers'

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  supplierToEdit?: Supplier | null
}

export function AddSupplierModal({
  isOpen,
  onClose,
  supplierToEdit,
}: SupplierModalProps) {
  const { createSupplier, updateSupplier } = useSuppliers()

  const [formData, setFormData] = useState({
    nombre: supplierToEdit?.nombre || '',
    contacto: supplierToEdit?.contacto || '',
    telefono: supplierToEdit?.telefono || '',
    email: supplierToEdit?.email || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      if (supplierToEdit) {
        await updateSupplier({
          id: supplierToEdit.id,
          data: formData,
        })
      } else {
        await createSupplier(formData)
      }

      setFormData({ nombre: '', contacto: '', telefono: '', email: '' })
      onClose()
    } catch (error: unknown) {
      console.error('Error al guardar proveedor:', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar el proveedor'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-start justify-center px-0 py-4 md:items-center md:p-4">
        <div className="my-4 w-full max-w-[640px] rounded-none bg-white px-5 py-6 shadow-2xl md:rounded-[28px] md:px-10 md:py-9">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl font-extrabold leading-tight text-[#2D2A32] md:text-[30px]">
              {supplierToEdit ? 'Editar proveedor' : 'Agregar proveedor'}
            </h2>
            <p className="mt-2 text-sm text-[#7A7480]">
              {supplierToEdit
                ? 'Actualiza los datos del proveedor.'
                : 'Registra un nuevo proveedor en tu directorio.'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                  Nombre de la empresa / proveedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora Beauty"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                  Persona de contacto
                </label>
                <input
                  type="text"
                  placeholder="Ej. María López"
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="Ej. 5512345678"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="contacto@proveedor.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 md:flex-row md:justify-end md:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="h-12 w-full rounded-2xl border border-[#F1DDE5] bg-white px-6 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9] md:min-w-[150px] md:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.nombre.trim()}
                className="h-12 w-full rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50 md:min-w-[170px] md:w-auto"
              >
                {isSubmitting
                  ? 'Guardando...'
                  : supplierToEdit
                    ? 'Actualizar proveedor'
                    : 'Guardar proveedor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
