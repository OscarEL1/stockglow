import { useState } from 'react'
import { useInviteMember } from '../hooks/useInviteMember'

interface Props {
  onClose: () => void
  onInvited: () => void
  showToast: (message: string, type: 'success' | 'error') => void
}

export function InviteMemberModal({ onClose, onInvited, showToast }: Props) {
  const { inviteMember, isPending } = useInviteMember(showToast)
  const [emailAddress, setEmailAddress] = useState('')
  const [role, setRole] = useState<'org:admin' | 'org:member'>('org:member')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailAddress.trim()) return

    try {
      await inviteMember({ emailAddress: emailAddress.trim(), role })
      onInvited()
      onClose()
    } catch {
      // El hook ya mostró el toast de error
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-title"
    >
      <div className="w-full max-w-[520px] rounded-[28px] bg-white px-10 py-9 shadow-2xl">
        <div className="mb-8">
          <h2
            id="invite-member-title"
            className="text-[26px] font-extrabold leading-tight text-[#2D2A32]"
          >
            Invitar miembro
          </h2>
          <p className="mt-2 text-sm text-[#7A7480]">
            Envía una invitación por correo para unirse a tu organización.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Correo electrónico
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="persona@ejemplo.com"
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition placeholder:text-[#9B95A1] focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#6F6875]">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'org:admin' | 'org:member')
                }
                className="h-14 w-full rounded-2xl border border-[#F1DDE5] bg-white px-5 text-sm text-[#2D2A32] outline-none transition focus:border-[#E85D8C] focus:ring-4 focus:ring-[#E85D8C]/10"
              >
                <option value="org:member">Employee</option>
                <option value="org:admin">Owner</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-12 min-w-[150px] rounded-2xl border border-[#F1DDE5] bg-white px-6 text-sm font-bold text-[#2D2A32] transition hover:bg-[#FFF8F9]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending || !emailAddress.trim()}
              className="h-12 min-w-[170px] rounded-2xl bg-[#E85D8C] px-6 text-sm font-bold text-white transition hover:bg-[#D94B7D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
