import { useState } from 'react'
import { useOrganization } from '@clerk/clerk-react'

export function useUpdateMemberRole() {
  const { organization } = useOrganization()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateRole(userId: string, role: 'org:admin' | 'org:member') {
    if (!organization) return
    setIsPending(true)
    setError(null)
    try {
      await organization.updateMember({ userId, role })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al actualizar el rol'
      setError(message)
      throw err
    } finally {
      setIsPending(false)
    }
  }

  return { updateRole, isPending, error }
}
