import { UserButton, useUser } from '@clerk/clerk-react'
import { VariantsTable } from '../components/VariantsTable'

export function Dashboard() {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-gray-900">StockGlow</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.firstName}</span>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 mt-1">
            Gestiona los productos y variantes de tu tienda
          </p>
        </div>
        <VariantsTable />
      </main>
    </div>
  )
}
