import { Navigate } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

interface Props {
  role: 'admin' | 'employee'
  children: React.ReactNode
}

export function ProtectedByRole({ role, children }: Props) {
  const { isAdmin, isEmployee, isLoaded } = useRole()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
      </div>
    )
  }

  const hasAccess =
    (role === 'admin' && isAdmin) || (role === 'employee' && isEmployee)

  if (!hasAccess) {
    return <Navigate to="/access-denied" replace />
  }

  return <>{children}</>
}
