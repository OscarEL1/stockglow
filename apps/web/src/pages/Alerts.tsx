import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Layout } from '../components/Layout'
import { Check, Calendar } from 'lucide-react'

interface Alerta {
  id: string
  tipo: 'BAJO_STOCK' | 'CADUCIDAD_PROXIMA'
  leida: boolean
  createdAt: string
  fechaCaducidad?: string
  diasRestantes?: number
  variante: {
    id: string
    sku: string
    nombreVariante: string
    stockActual: number
    stockMinimo: number
    producto: {
      nombre: string
      marca: string | null
    }
  }
}

const API_URL = 'http://localhost:3000/api/v1/alerts'

function AlertsTable({
  alerts,
  onMarkAsRead,
  showAction,
}: {
  alerts: Alerta[]
  onMarkAsRead: (id: string) => void
  showAction: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-[#2D2A32]">
        <thead className="bg-[#FFF8F9] text-xs font-semibold uppercase text-[#7A7480]">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Variante</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3 text-center">Stock</th>
            <th className="px-4 py-3 text-center">Mínimo</th>
            <th className="px-4 py-3">Estado</th>
            {showAction && <th className="px-4 py-3 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 font-medium">
          {alerts.map((alert) => {
            const { variante, tipo, fechaCaducidad, diasRestantes } = alert
            const { stockActual, stockMinimo } = variante
            const esCaducado =
              typeof diasRestantes === 'number' && diasRestantes <= 0

            return (
              <tr key={alert.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-4">
                  <div className="font-semibold">
                    {variante.producto.nombre}
                  </div>
                  <div className="text-xs text-gray-400">
                    {variante.producto.marca || 'Sin marca'}
                  </div>

                  {tipo === 'CADUCIDAD_PROXIMA' &&
                    fechaCaducidad &&
                    typeof diasRestantes === 'number' && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 text-xs font-semibold text-gray-500">
                        <Calendar size={12} />
                        Vence: {new Date(fechaCaducidad).toLocaleDateString()}
                        <span
                          className={
                            esCaducado
                              ? 'ml-1 font-bold text-red-600'
                              : 'ml-1 text-orange-600'
                          }
                        >
                          (
                          {esCaducado
                            ? diasRestantes === 0
                              ? 'Vence hoy'
                              : `Caducado hace ${Math.abs(diasRestantes)} días`
                            : `Quedan ${diasRestantes} días`}
                          )
                        </span>
                      </div>
                    )}
                </td>
                <td className="px-4 py-4 text-gray-600">
                  {variante.nombreVariante}
                </td>
                <td className="px-4 py-4 text-xs font-mono text-gray-500">
                  {variante.sku}
                </td>
                <td className="px-4 py-4 text-center font-bold">
                  {stockActual}
                </td>
                <td className="px-4 py-4 text-center text-gray-400">
                  {tipo === 'BAJO_STOCK' ? stockMinimo : '-'}
                </td>
                <td className="px-4 py-4">
                  {tipo === 'BAJO_STOCK' ? (
                    stockActual === 0 ? (
                      <span className="inline-flex items-center rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                        Agotado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
                        Stock bajo
                      </span>
                    )
                  ) : esCaducado ? (
                    <span className="inline-flex items-center rounded-lg border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                      Caducado
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                      Próximo a vencer
                    </span>
                  )}
                </td>
                {showAction && (
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => onMarkAsRead(alert.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#7A7480] transition-colors hover:border-[#E85D8C] hover:bg-[#FFF8F9] hover:text-[#E85D8C]"
                    >
                      <Check size={14} />
                      Leída
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const token = await getToken()
        const response = await fetch(`${API_URL}?includeRead=true`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const resData = await response.json()
        if (resData.success) {
          setAlerts(resData.data)
        }
      } catch (error) {
        console.error('Error cargando alertas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [getToken])

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_URL}/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const resData = await response.json()
      if (resData.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, leida: true } : a))
        )
      }
    } catch (error) {
      console.error('Error al marcar la alerta como leída:', error)
    }
  }

  const pending = alerts.filter((a) => !a.leida)
  const history = alerts.filter((a) => a.leida)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A32]">
            Alertas y Notificaciones
          </h1>
          <p className="text-sm text-[#7A7480]">
            Gestiona los productos que requieren reposición inmediata o atención
            por caducidad.
          </p>
        </div>

        {/* Pendientes */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#2D2A32]">
            Pendientes
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                {pending.length}
              </span>
            )}
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
            </div>
          ) : pending.length === 0 ? (
            <div className="py-12 text-center text-[#7A7480]">
              ¡Excelente! No tienes alertas pendientes de inventario.
            </div>
          ) : (
            <AlertsTable
              alerts={pending}
              onMarkAsRead={handleMarkAsRead}
              showAction
            />
          )}
        </div>

        {/* Historial — solo si hay alertas leídas */}
        {!loading && history.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-[#7A7480]">
              Historial
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
                {history.length}
              </span>
            </h2>
            <AlertsTable
              alerts={history}
              onMarkAsRead={handleMarkAsRead}
              showAction={false}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}
