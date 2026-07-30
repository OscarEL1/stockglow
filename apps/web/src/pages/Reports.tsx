import { useState } from 'react'
import { Layout } from '../components/Layout'
import {
  useMermasReport,
  useArchivedProductsReport,
  useDeadStockReport,
  type MermasFilters,
} from '../hooks/useReports'
import { exportDeadStockExcel } from '../lib/exportDeadStockExcel'
import {
  AlertTriangle,
  Package,
  Search,
  Trash2,
  Clock,
} from 'lucide-react'

type Tab = 'mermas' | 'archived' | 'deadstock'

function MermasTab() {
  const [filters, setFilters] = useState<MermasFilters>({})
  const { data, isLoading } = useMermasReport(filters)

  const totalUnidades =
    data?.resumen.reduce((s, r) => s + r.cantidadTotal, 0) ?? 0
  const totalRegistros = data?.movimientos.length ?? 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs text-[#7A7480]">Total registros</p>
              <p className="text-xl font-bold text-[#2D2A32]">
                {totalRegistros}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <AlertTriangle size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-[#7A7480]">Unidades totales</p>
              <p className="text-xl font-bold text-[#2D2A32]">
                {totalUnidades}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
              <Package size={20} className="text-[#E85D8C]" />
            </div>
            <div>
              <p className="text-xs text-[#7A7480]">Mermas</p>
              <p className="text-xl font-bold text-[#2D2A32]">
                {data?.resumen.find((r) => r.tipo === 'MERMA')?.cantidadTotal ??
                  0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-2 block text-xs font-bold text-[#6F6875]">
              Fecha inicio
            </label>
            <input
              type="date"
              value={filters.fechaInicio ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  fechaInicio: e.target.value || undefined,
                }))
              }
              className="h-10 rounded-xl border border-[#F1DDE5] bg-white px-4 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-[#6F6875]">
              Fecha fin
            </label>
            <input
              type="date"
              value={filters.fechaFin ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  fechaFin: e.target.value || undefined,
                }))
              }
              className="h-10 rounded-xl border border-[#F1DDE5] bg-white px-4 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-[#6F6875]">
              Tipo
            </label>
            <select
              value={filters.tipo ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  tipo: (e.target.value || undefined) as
                    | 'MERMA'
                    | 'CADUCADO'
                    | undefined,
                }))
              }
              className="h-10 rounded-xl border border-[#F1DDE5] bg-white px-4 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
            >
              <option value="">Todos</option>
              <option value="MERMA">Merma</option>
              <option value="CADUCADO">Caducado</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({})}
            className="h-10 rounded-xl border border-[#F1DDE5] bg-white px-4 text-sm font-medium text-[#2D2A32] hover:bg-[#FFF8F9]"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
          </div>
        ) : !data?.movimientos.length ? (
          <div className="py-12 text-center">
            <AlertTriangle size={40} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-[#7A7480]">
              No se encontraron registros de mermas o caducados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#2D2A32]">
              <thead className="border-b border-gray-100 text-xs text-[#7A7480]">
                <tr>
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Producto</th>
                  <th className="pb-3">Variante</th>
                  <th className="pb-3">Cantidad</th>
                  <th className="pb-3">Motivo</th>
                  <th className="pb-3">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FFF8F9]">
                    <td className="whitespace-nowrap py-3">
                      {new Date(m.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          m.tipo === 'MERMA'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {m.tipo === 'MERMA' ? 'Merma' : 'Caducado'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">
                          {m.variante.producto.nombre}
                        </p>
                        <p className="text-xs text-[#7A7480]">
                          {m.variante.producto.marca || 'Sin marca'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      <p className="font-medium">{m.variante.nombreVariante}</p>
                      <p className="text-xs text-[#7A7480]">{m.variante.sku}</p>
                    </td>
                    <td className="whitespace-nowrap py-3 font-semibold text-red-600">
                      -{Math.abs(m.cantidad)}
                    </td>
                    <td className="max-w-[200px] truncate py-3 text-[#7A7480]">
                      {m.motivo || '-'}
                    </td>
                    <td className="py-3">
                      <p className="text-[#7A7480]">{m.usuario.nombre}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ArchivedProductsTab() {
  const { data, isLoading } = useArchivedProductsReport()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Package size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-[#7A7480]">Productos dados de baja</p>
              <p className="text-xl font-bold text-[#2D2A32]">
                {data?.resumen.totalProductos ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Search size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-[#7A7480]">Variantes totales</p>
              <p className="text-xl font-bold text-[#2D2A32]">
                {data?.resumen.totalVariantes ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
          </div>
        ) : !data?.productos.length ? (
          <div className="py-12 text-center">
            <Package size={40} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-[#7A7480]">
              No hay productos dados de baja.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#2D2A32]">
              <thead className="border-b border-gray-100 text-xs text-[#7A7480]">
                <tr>
                  <th className="pb-3">Producto</th>
                  <th className="pb-3">Marca</th>
                  <th className="pb-3">Categoría</th>
                  <th className="pb-3">Proveedor</th>
                  <th className="pb-3">Variantes</th>
                  <th className="pb-3">Fecha de baja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.productos.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FFF8F9]">
                    <td className="py-3 font-medium">{p.nombre}</td>
                    <td className="py-3 text-[#7A7480]">{p.marca || '-'}</td>
                    <td className="py-3 text-[#7A7480]">
                      {p.categoria || '-'}
                    </td>
                    <td className="py-3 text-[#7A7480]">
                      {p.proveedor?.nombre || '-'}
                    </td>
                    <td className="py-3">
                      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                        {p.variantes.length}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 text-[#7A7480]">
                      {new Date(p.createdAt).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function DeadStockTab() {
  const { data, isLoading } = useDeadStockReport()
  const items = data?.items ?? []
  const meta = data?.meta ?? { totalVariantes: 0, stockTotal: 0 }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50">
              <Clock size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-[#7A7480]">Variantes sin movimiento</p>
              <p className="text-xl font-bold text-[#2D2A32]">
                {meta.totalVariantes}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50">
              <Package size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-[#7A7480]">Stock inactivo total</p>
              <p className="text-xl font-bold text-[#2D2A32]">
                {meta.stockTotal}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <Clock size={40} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-[#7A7480]">
              Todos los productos se han movido en los últimos 30 días.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#2D2A32]">
              <thead className="border-b border-gray-100 text-xs text-[#7A7480]">
                <tr>
                  <th className="pb-3">Producto</th>
                  <th className="pb-3">Variante</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3 text-right">Stock actual</th>
                  <th className="pb-3">Último movimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.varianteId} className="hover:bg-[#FFF8F9]">
                    <td className="py-3 font-medium">{item.producto}</td>
                    <td className="py-3">{item.variante}</td>
                    <td className="py-3 font-mono text-xs text-[#7A7480]">
                      {item.sku}
                    </td>
                    <td className="py-3 text-right">{item.stockActual}</td>
                    <td className="py-3 text-[#7A7480]">
                      {item.ultimoMovimiento
                        ? new Date(item.ultimoMovimiento).toLocaleDateString(
                            'es-MX'
                          )
                        : 'Sin movimiento'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const TAB_CONFIG = [
  { key: 'mermas' as const, label: 'Mermas y caducados' },
  { key: 'archived' as const, label: 'Productos dados de baja' },
  { key: 'deadstock' as const, label: 'Sin movimiento' },
]

export function Reports() {
  const [tab, setTab] = useState<Tab>('mermas')
  const { data: deadStockData } = useDeadStockReport()
  const items = deadStockData?.items ?? []

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A32]">Reportes</h1>
            <p className="text-sm text-[#7A7480]">
              Consulta mermas, productos caducados, dados de baja y sin
              movimiento.
            </p>
          </div>

          {tab === 'deadstock' && items.length > 0 && (
            <button
              onClick={() => exportDeadStockExcel(items)}
              className="rounded-lg border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Exportar a Excel
            </button>
          )}
        </div>

        <div className="flex gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-[#E85D8C] text-white shadow'
                  : 'text-[#7A7480] hover:bg-[#FFF8F9]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'mermas' && <MermasTab />}
        {tab === 'archived' && <ArchivedProductsTab />}
        {tab === 'deadstock' && <DeadStockTab />}
      </div>
    </Layout>
  )
}
