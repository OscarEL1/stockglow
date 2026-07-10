import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Layout } from '../components/Layout'
import { Check, Calendar } from 'lucide-react'

interface Alerta {
  id: string
  tipo: 'BAJO_STOCK' | 'CADUCIDAD_PROXIMA'
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

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()

  const API_URL = 'http://localhost:3000/api/v1/alerts'

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const token = await getToken()
        const response = await fetch(API_URL, {
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
        setAlerts((prev) => prev.filter((alert) => alert.id !== id))
      }
    } catch (error) {
      console.error('Error al marcar la alerta como leída:', error)
    }
  }

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

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-[#7A7480]">
              🎉 ¡Excelente! No tienes alertas pendientes de inventario.
            </div>
          ) : (
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
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {alerts.map((alert) => {
                    const { variante, tipo, fechaCaducidad, diasRestantes } =
                      alert
                    const { stockActual, stockMinimo } = variante
                    const esCaducado =
                      typeof diasRestantes === 'number' && diasRestantes <= 0

                    return (
                      <tr key={alert.id} className="hover:bg-gray-50/50">
                        {/* CA02: Mostrar nombre, marca y detalles de vencimiento */}
                        <td className="px-4 py-4">
                          <div className="font-semibold">
                            {variante.producto.nombre}
                          </div>
                          <div className="text-xs text-gray-400">
                            {variante.producto.marca || 'Sin marca'}
                          </div>

                          {/* CA02 y CA01: Bloque de info de caducidad */}
                          {tipo === 'CADUCIDAD_PROXIMA' &&
                            fechaCaducidad &&
                            typeof diasRestantes === 'number' && (
                              <div className="text-xs mt-1 font-semibold bg-gray-50 rounded px-1.5 py-0.5 inline-flex items-center gap-1 text-gray-500">
                                <Calendar size={12} />
                                Vence:{' '}
                                {new Date(fechaCaducidad).toLocaleDateString()}
                                <span
                                  className={
                                    esCaducado
                                      ? 'text-red-600 font-bold ml-1'
                                      : 'text-orange-600 ml-1'
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

                        {/* CA03: Renderizado de Badges de Estado */}
                        <td className="px-4 py-4">
                          {tipo === 'BAJO_STOCK' ? (
                            stockActual === 0 ? (
                              <span className="inline-flex items-center rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-100">
                                Agotado
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 border border-amber-100">
                                Stock bajo
                              </span>
                            )
                          ) : /* CA03: Validación estricta de Caducidad */
                          esCaducado ? (
                            <span className="inline-flex items-center rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
                              Caducado
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 border border-orange-100">
                              Próximo a vencer
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#7A7480] transition-colors hover:border-[#E85D8C] hover:bg-[#FFF8F9] hover:text-[#E85D8C]"
                          >
                            <Check size={14} />
                            Leída
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
