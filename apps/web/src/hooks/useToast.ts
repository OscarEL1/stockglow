import { useEffect, useRef, useState } from 'react'

interface ToastState {
  message: string
  type: 'success' | 'error'
  visible: boolean
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, visible: true })
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3000)
  }

  function hideToast() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast((prev) => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { toast, showToast, hideToast }
}
