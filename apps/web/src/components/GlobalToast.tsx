import { useEffect } from 'react'
import { Toast } from './Toast'
import { useToast } from '../hooks/useToast'
import { subscribeToast } from '../lib/toastBus'

export function GlobalToast() {
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    return subscribeToast(showToast)
  }, [showToast])

  if (!toast.visible) return null

  return <Toast message={toast.message} type={toast.type} onClose={hideToast} />
}
