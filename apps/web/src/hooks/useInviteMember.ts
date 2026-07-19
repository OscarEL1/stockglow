import { useState } from 'react'
import { useOrganization } from '@clerk/clerk-react'

interface InviteMemberParams {
  emailAddress: string
  role: 'org:admin' | 'org:member'
}

export function useInviteMember(
  showToast: (message: string, type: 'success' | 'error') => void
) {
  const { organization } = useOrganization()
  const [isPending, setIsPending] = useState(false)

  async function inviteMember({ emailAddress, role }: InviteMemberParams) {
    if (!organization) return
    setIsPending(true)
    try {
      await organization.inviteMember({ emailAddress, role })
      showToast('Invitación enviada correctamente', 'success')
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Error al enviar la invitación',
        'error'
      )
      throw err
    } finally {
      setIsPending(false)
    }
  }

  return { inviteMember, isPending }
}
