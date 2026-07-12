import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useOrganization } from '@clerk/clerk-react'
import { useRole } from '../hooks/useRole'
import { useQueryClient } from '@tanstack/react-query'
import { VariantsTable } from '../components/VariantsTable'
import { AddProductModal } from '../components/AddProductModal'
import { AddVariantModal } from '../components/AddVariantModal'
import { Toast } from '../components/Toast'
import { Layout } from '../components/Layout'
import { useStockWebSocket } from '../hooks/useStockWebSocket'
import { useToast } from '../hooks/useToast'

export function Inventory() {
  const { organization } = useOrganization()
  const queryClient = useQueryClient()
  const { isAdmin } = useRole()
  const { toast, showToast, hideToast } = useToast()
  const [showProductModal, setShowProductModal] = useState(false)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [searchParams] = useSearchParams()
  const statusFilter = searchParams.get('status')

  useStockWebSocket(organization?.id ?? '', queryClient)

  function handleProductCreated(message: string) {
    showToast(message, 'success')
    setShowProductModal(false)
    setShowVariantModal(true)
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A32]">Inventario</h1>
          <p className="mt-1 text-[#7A7480]">
            Gestiona los productos y variantes de tu tienda
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowProductModal(true)}
              className="rounded-lg bg-[#E85D8C] px-4 py-2 text-sm font-medium text-white hover:bg-[#D94B7D]"
            >
              + Agregar producto
            </button>
            <button
              onClick={() => setShowVariantModal(true)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              + Agregar variante
            </button>
          </div>
        )}
      </div>

      <VariantsTable
        statusFilter={statusFilter}
        onSuccess={(message) => showToast(message, 'success')}
        onError={(message) => showToast(message, 'error')}
      />

      {showProductModal && (
        <AddProductModal
          onClose={() => setShowProductModal(false)}
          onSuccess={handleProductCreated}
        />
      )}

      {showVariantModal && (
        <AddVariantModal
          onClose={() => setShowVariantModal(false)}
          onSuccess={(msg) => showToast(msg, 'success')}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </Layout>
  )
}
