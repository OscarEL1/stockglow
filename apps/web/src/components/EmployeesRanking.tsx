import { Trophy, UserRound } from 'lucide-react'
import type { EmployeeRankingItem } from '../hooks/useReports'

interface Props {
  employees: EmployeeRankingItem[]
  isLoading: boolean
}

export function EmployeesRanking({ employees, isLoading }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-[#FDE8F0] p-3 text-[#E85D8C]">
          <Trophy className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#2D2A32]">
            Ranking de empleadas
          </h2>

          <p className="text-sm text-[#7A7480]">
            Ventas realizadas durante el mes
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <p className="text-sm text-[#7A7480]">
          No hay ventas registradas este mes.
        </p>
      ) : (
        <div className="space-y-3">
          {employees.map((employee, index) => (
            <div
              key={employee.usuarioId}
              className="flex items-center justify-between rounded-xl bg-[#FFF8F9] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E85D8C] text-sm font-bold text-white">
                  {index + 1}
                </div>

                <div className="flex items-center gap-2">
                  <UserRound size={18} className="text-[#7A7480]" />

                  <div>
                    <p className="font-semibold text-[#2D2A32]">
                      {employee.nombre}
                    </p>

                    <p className="text-xs text-[#7A7480]">
                      {employee.ventas} ventas
                    </p>
                  </div>
                </div>
              </div>

              <p className="font-bold text-[#E85D8C]">
                $
                {employee.montoTotal.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
