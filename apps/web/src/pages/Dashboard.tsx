import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserButton, useUser, useOrganization } from '@clerk/clerk-react'
import { useQueryClient } from '@tanstack/react-query'
import { VariantsTable } from '../components/VariantsTable'
import { AddProductModal } from '../components/AddProductModal'
import { AddVariantModal } from '../components/AddVariantModal'
import { Toast } from '../components/Toast'
import { useStockWebSocket } from '../hooks/useStockWebSocket'
import { useToast } from '../hooks/useToast'

export function Dashboard() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const queryClient = useQueryClient()
  const { toast, showToast, hideToast } = useToast()
  const [showProductModal, setShowProductModal] = useState(false)
  const [showVariantModal, setShowVariantModal] = useState(false)

  useStockWebSocket(organization?.id ?? '', queryClient)

  function handleProductCreated(message: string) {
    showToast(message, 'success')
    setShowProductModal(false)
    setShowVariantModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-gray-900">StockGlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-blue-600"
              >
                Inventario
              </Link>
              <Link
                to="/sales"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Ventas
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.firstName}</span>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-500 mt-1">
              Gestiona los productos y variantes de tu tienda
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowProductModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Agregar producto
            </button>
            <button
              onClick={() => setShowVariantModal(true)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              + Agregar variante
            </button>
          </div>
        </div>

        <VariantsTable />
      </main>

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
    </div>
  )
}
