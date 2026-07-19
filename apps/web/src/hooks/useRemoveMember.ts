import { useState } from 'react'
import { useOrganization } from '@clerk/clerk-react'

export function useRemoveMember(
  showToast: (message: string, type: 'success' | 'error') => void
) {
  const { memberships } = useOrganization({ memberships: true })
  const [isPending, setIsPending] = useState(false)

  async function removeMember(userId: string) {
    const membership = memberships?.data?.find(
      (member) => member.publicUserData?.userId === userId
    )
    if (!membership) return

    setIsPending(true)
    try {
      await membership.destroy()
      showToast('Miembro eliminado correctamente', 'success')
      await memberships?.revalidate?.()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Error al eliminar al miembro',
        'error'
      )
      throw err
    } finally {
      setIsPending(false)
    }
  }

  return { removeMember, isPending }
}
