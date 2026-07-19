import { useState } from 'react'
import { useOrganization, useUser } from '@clerk/clerk-react'
import { useRole } from '../hooks/useRole'
import { useUpdateMemberRole } from '../hooks/useUpdateMemberRole'
import { useRemoveMember } from '../hooks/useRemoveMember'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import { Layout } from '../components/Layout'
import { InviteMemberModal } from '../components/InviteMemberModal'

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
  const { isLoaded, memberships, invitations } = useOrganization({
    memberships: true,
    invitations: true,
  })
  const { user } = useUser()
  const { isAdmin } = useRole()
  const { updateRole } = useUpdateMemberRole()
  const { toast, showToast, hideToast } = useToast()
  const { removeMember, isPending: isRemoving } = useRemoveMember(showToast)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string
    name: string
  } | null>(null)

  const isLoading =
    !isLoaded ||
    (memberships?.isLoading ?? true) ||
    (invitations?.isLoading ?? true)
  const members = memberships?.data ?? []
  const pendingInvitations = (invitations?.data ?? []).filter(
    (invitation) => invitation.status === 'pending'
  )

  async function handleRoleChange(
    userId: string,
    role: 'org:admin' | 'org:member'
  ) {
    setPendingUserId(userId)
    try {
      await updateRole(userId, role)
      showToast('Rol actualizado correctamente', 'success')
      await memberships?.revalidate?.()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Error al actualizar el rol',
        'error'
      )
    } finally {
      setPendingUserId(null)
    }
  }

  async function handleConfirmRemove() {
    if (!memberToRemove) return
    try {
      await removeMember(memberToRemove.userId)
      setMemberToRemove(null)
    } catch {
      // El hook ya mostró el toast de error
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A32]">Usuarios</h1>
          <p className="mt-1 text-[#7A7480]">
            Administración de personal y roles
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="h-11 rounded-2xl bg-[#E85D8C] px-5 text-sm font-bold text-white transition hover:bg-[#D94B7D]"
          >
            Invitar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
        </div>
      ) : members.length === 0 && pendingInvitations.length === 0 ? (
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
                  {isAdmin && (
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  )}
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
                  const memberId = userData?.userId ?? ''
                  const isCurrentUser = user?.id === memberId
                  const isThisPending = pendingUserId === memberId

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
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  memberId,
                                  e.target.value as 'org:admin' | 'org:member'
                                )
                              }
                              disabled={isCurrentUser || isThisPending}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#E85D8C] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="org:admin">Owner</option>
                              <option value="org:member">Employee</option>
                            </select>
                            {isThisPending && (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E85D8C] border-t-transparent" />
                            )}
                          </div>
                        ) : (
                          <RoleBadge role={member.role} />
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Activo
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(member.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-5">
                          <button
                            onClick={() =>
                              setMemberToRemove({
                                userId: memberId,
                                name: displayName,
                              })
                            }
                            disabled={isCurrentUser}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {pendingInvitations.map((invitation) => (
                  <tr
                    key={invitation.id}
                    className="transition hover:bg-pink-50/40"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
                          {invitation.emailAddress[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="text-sm font-semibold text-gray-400">
                          Invitación enviada
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-600">
                      {invitation.emailAddress}
                    </td>
                    <td className="px-6 py-5">
                      <RoleBadge role={invitation.role} />
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Pendiente
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-600">
                      {formatDate(invitation.createdAt)}
                    </td>
                    {isAdmin && <td className="px-6 py-5" />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvited={() => invitations?.revalidate?.()}
          showToast={showToast}
        />
      )}

      {memberToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-member-title"
        >
          <div className="w-full max-w-[480px] rounded-[28px] bg-white px-10 py-9 shadow-2xl">
            <h2
              id="remove-member-title"
              className="text-xl font-extrabold leading-tight text-[#2D2A32]"
            >
              Eliminar miembro
            </h2>
            <p className="mt-4 text-sm text-[#7A7480]">
              ¿Estás seguro de que deseas eliminar a {memberToRemove.name} del
              equipo? Esta acción revocará su acceso al sistema.
            </p>
            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={isRemoving}
                className="h-12 min-w-[130px] rounded-2xl bg-gray-200 px-6 text-sm font-bold text-gray-700 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="h-12 min-w-[130px] rounded-2xl bg-red-600 px-6 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRemoving ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </Layout>
  )
}
