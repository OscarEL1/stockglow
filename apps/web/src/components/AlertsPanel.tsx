import { X, Bell, PackageOpen, CalendarClock, CheckCheck } from 'lucide-react'
import { useAlerts } from '../hooks/useAlerts'

interface AlertsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AlertsPanel({ isOpen, onClose }: AlertsPanelProps) {
  const { data: alerts = [], isLoading, markAsRead } = useAlerts()

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm transform bg-white shadow-2xl transition-transform duration-300">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#E85D8C]" />
              <h2 className="text-lg font-semibold text-gray-900">Alertas</h2>
              {alerts.length > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  {alerts.length} nuevas
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-full bg-gray-50 p-4">
                  <CheckCheck className="h-8 w-8 text-green-500" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-900">Todo en orden</p>
                <p className="mt-1 text-sm text-gray-500">No tienes alertas pendientes por leer.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="flex gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {alerta.tipo === 'BAJO_STOCK' ? (
                        <PackageOpen className="h-5 w-5 text-red-500" />
                      ) : (
                        <CalendarClock className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alerta.tipo === 'BAJO_STOCK' ? 'Stock bajo detectado' : 'Caducidad próxima'}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        La variante <span className="font-semibold text-gray-900">{alerta.variante.nombreVariante}</span> ({alerta.variante.sku}) del producto <span className="font-semibold">{alerta.variante.producto.nombre}</span> requiere atención.
                      </p>
                      <p className="mt-2 text-[10px] text-gray-400">
                        {new Date(alerta.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="border-t border-gray-100 p-4">
              <button
                onClick={() => markAsRead.mutate()}
                disabled={markAsRead.isPending}
                className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {markAsRead.isPending ? 'Marcando...' : 'Marcar todas como leídas'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
