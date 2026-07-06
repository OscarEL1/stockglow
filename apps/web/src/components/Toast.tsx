import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className={`fixed top-4 right-4 z-[60] flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } ${entered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-1 text-white/70 hover:text-white"
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  )
}
