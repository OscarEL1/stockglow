import { useOrganization } from '@clerk/clerk-react'
import { Layout } from '../components/Layout'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'org:admin') {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
        Owner
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
      Employee
    </span>
  )
}

export function Users() {
  const { isLoaded, memberships } = useOrganization({ memberships: true })

  const isLoading = !isLoaded || (memberships?.isLoading ?? true)
  const members = memberships?.data ?? []

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2A32]">Usuarios</h1>
        <p className="mt-1 text-[#7A7480]">
          Administración de personal y roles
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-pink-200 bg-white p-10 text-center">
          <p className="text-base font-semibold text-gray-900">
            No hay miembros en tu organización
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-pink-50/70">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Miembro
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Correo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Fecha de ingreso
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {members.map((member) => {
                  const userData = member.publicUserData
                  const firstName = userData?.firstName ?? ''
                  const lastName = userData?.lastName ?? ''
                  const displayName =
                    `${firstName} ${lastName}`.trim() ||
                    userData?.identifier ||
                    '—'
                  const email = userData?.identifier ?? '—'
                  const initials = (
                    firstName[0] ??
                    email[0] ??
                    '?'
                  ).toUpperCase()

                  return (
                    <tr
                      key={member.id}
                      className="transition hover:bg-pink-50/40"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {userData?.hasImage ? (
                            <img
                              src={userData.imageUrl}
                              alt={displayName}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E85D8C] text-xs font-bold text-white">
                              {initials}
                            </div>
                          )}
                          <span className="text-sm font-semibold text-gray-900">
                            {displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {email}
                      </td>
                      <td className="px-6 py-5">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Activo
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(member.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}
