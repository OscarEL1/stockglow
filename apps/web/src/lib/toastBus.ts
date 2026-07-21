type ToastType = 'success' | 'error'
type ToastListener = (message: string, type: ToastType) => void

const listeners = new Set<ToastListener>()

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitToast(message: string, type: ToastType = 'error') {
  listeners.forEach((listener) => listener(message, type))
}
