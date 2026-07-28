import { useState } from 'react'
import { X } from 'lucide-react'
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

  // Inicializamos el estado directamente desde las props
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-[#2D2A32]">
            {supplierToEdit ? 'Editar Proveedor' : 'Agregar Proveedor'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A32]">
              Nombre de la Empresa / Proveedor *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Distribuidora Beauty"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E85D8C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A32]">
              Persona de Contacto
            </label>
            <input
              type="text"
              placeholder="Ej. María López"
              value={formData.contacto}
              onChange={(e) =>
                setFormData({ ...formData, contacto: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E85D8C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A32]">
              Teléfono
            </label>
            <input
              type="tel"
              placeholder="Ej. 5512345678"
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E85D8C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2A32]">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="contacto@proveedor.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E85D8C]"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#E85D8C] px-4 py-2 text-sm font-medium text-white hover:bg-[#d44c79] disabled:opacity-50"
            >
              {isSubmitting
                ? 'Guardando...'
                : supplierToEdit
                  ? 'Actualizar Proveedor'
                  : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
