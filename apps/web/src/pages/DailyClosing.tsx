import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useDailyClosing } from '../hooks/useSales'
import { useSettings } from '../hooks/useSettings'
import { generateDailyClosingPDF } from '../lib/generateDailyClosingPDF'
import { CalendarDays, Users, DollarSign, Receipt } from 'lucide-react'

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DailyClosing() {
  const [fecha, setFecha] = useState(() => toLocalDateStr(new Date()))
  const { data, isLoading } = useDailyClosing(fecha)
  const { data: settings } = useSettings()

  function handleExportPDF() {
    if (!data) return
    generateDailyClosingPDF(data, settings?.nombre || 'StockGlow')
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A32]">
              Cierre del día
            </h1>
            <p className="text-sm text-[#7A7480]">
              Resumen de ventas por empleada
            </p>
          </div>

          {!data?.sinVentas && (
            <button
              onClick={handleExportPDF}
              className="rounded-lg border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Exportar a PDF
            </button>
          )}
        </div>

        {/* Selector de fecha */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-end gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Fecha del cierre
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-10 rounded-xl border border-[#F1DDE5] bg-white px-4 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
          </div>
        ) : data?.sinVentas ? (
          /* CA02: Sin ventas registradas */
          <div className="rounded-xl border border-gray-100 bg-white py-16 text-center shadow-sm">
            <CalendarDays
              size={48}
              className="mx-auto text-gray-300"
            />
            <p className="mt-4 text-lg font-semibold text-[#2D2A32]">
              Sin ventas registradas hoy
            </p>
            <p className="mt-1 text-sm text-[#7A7480]">
              No se completaron ventas el{' '}
              {new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        ) : (
          <>
            {/* Resumen general */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                    <DollarSign size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-[#7A7480]">Total del día</p>
                    <p className="text-xl font-bold text-[#2D2A32]">
                      ${data?.totalGeneral.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <Receipt size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-[#7A7480]">Transacciones</p>
                    <p className="text-xl font-bold text-[#2D2A32]">
                      {data?.totalTransacciones}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                    <Users size={20} className="text-[#E85D8C]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#7A7480]">Empleadas</p>
                    <p className="text-xl font-bold text-[#2D2A32]">
                      {data?.empleadas.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CA01: Desglose por empleada */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#2D2A32]">
                Desglose por empleada
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#2D2A32]">
                  <thead className="border-b border-gray-100 text-xs text-[#7A7480]">
                    <tr>
                      <th className="pb-3">Empleada</th>
                      <th className="pb-3 text-right">Transacciones</th>
                      <th className="pb-3 text-right">Total vendido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.empleadas.map((e) => (
                      <tr key={e.usuarioId} className="hover:bg-[#FFF8F9]">
                        <td className="py-3 font-medium">{e.nombre}</td>
                        <td className="py-3 text-right">{e.transacciones}</td>
                        <td className="py-3 text-right font-semibold">
                          ${e.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td className="pt-3 font-bold">Total general</td>
                      <td className="pt-3 text-right font-bold">
                        {data?.totalTransacciones}
                      </td>
                      <td className="pt-3 text-right font-bold">
                        ${data?.totalGeneral.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
