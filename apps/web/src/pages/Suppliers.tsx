import { useState } from 'react'
import { Layout } from '../components/Layout'
import { AddSupplierModal } from '../components/AddSupplierModal'
import { useSuppliers, type Supplier } from '../hooks/useSuppliers'
import { Pencil, Trash2, Plus } from 'lucide-react'

export function Suppliers() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null)

  const { suppliers, isLoading, deleteSupplier } = useSuppliers()

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setSupplierToEdit(null)
    setIsModalOpen(true)
  }

  // Abrir modal para editar
  const handleOpenEdit = (supplier: Supplier) => {
    setSupplierToEdit(supplier)
    setIsModalOpen(true)
  }

  // Eliminar proveedor con confirmación
  const handleDelete = async (id: string, nombre: string) => {
    if (
      confirm(`¿Estás seguro de que deseas eliminar al proveedor "${nombre}"?`)
    ) {
      try {
        await deleteSupplier(id)
      } catch (error: unknown) {
        console.error('Error al eliminar proveedor:', error)
        alert('No se pudo eliminar el proveedor.')
      }
    }
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A32]">Proveedores</h1>
            <p className="text-sm text-[#7A7480]">
              Administra el directorio de tus proveedores
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[#E85D8C] px-4 py-2 text-sm font-medium text-white hover:bg-[#d44c79] transition-colors"
          >
            <Plus size={18} />
            Nuevo Proveedor
          </button>
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">
              Cargando proveedores...
            </p>
          ) : suppliers && suppliers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#2D2A32]">
                <thead className="border-b border-gray-100 text-xs text-[#7A7480]">
                  <tr>
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Contacto</th>
                    <th className="pb-3">Teléfono</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-[#FFF8F9]">
                      <td className="py-3 font-medium">{sup.nombre}</td>
                      <td className="py-3 text-gray-600">
                        {sup.contacto || '-'}
                      </td>
                      <td className="py-3 text-gray-600">
                        {sup.telefono || '-'}
                      </td>
                      <td className="py-3 text-gray-600">{sup.email || '-'}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(sup)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#E85D8C] transition-colors"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(sup.id, sup.nombre)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No hay proveedores registrados. Haz clic en "+ Nuevo Proveedor"
              para agregar uno.
            </p>
          )}
        </div>
      </div>

      {/* Modal para Crear/Editar (se reinicia cuando cambia el proveedor a editar) */}
      <AddSupplierModal
        key={supplierToEdit?.id || 'new'}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSupplierToEdit(null)
        }}
        supplierToEdit={supplierToEdit}
      />
    </Layout>
  )
}

export default Suppliers
