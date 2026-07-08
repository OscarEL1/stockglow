import { useOrganization } from '@clerk/clerk-react'

export function useRole() {
  const { membership, isLoaded } = useOrganization()
  const role = membership?.role ?? 'member'
  const isAdmin = role === 'org:admin'
  const isEmployee = !isAdmin

  return { role, isAdmin, isEmployee, isLoaded }
}
