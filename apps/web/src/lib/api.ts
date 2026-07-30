import { emitToast } from './toastBus'

const API_URL = import.meta.env.VITE_API_URL

interface RateLimitPayload {
  error: string
  message: string
  retryAfter: number
}

function isRateLimitPayload(payload: unknown): payload is RateLimitPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'retryAfter' in payload &&
    'message' in payload
  )
}

export async function fetchWithAuth(
  getToken: () => Promise<string | null>,
  path: string,
  options: RequestInit = {}
) {
  const token = await getToken()
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 429 && isRateLimitPayload(payload)) {
      emitToast(
        `${payload.message} (reintenta en ${payload.retryAfter}s)`,
        'error'
      )
      throw new Error(payload.message)
    }

    throw new Error(
      payload?.error?.message || `Error en la petición (${response.status})`
    )
  }

  return payload
}
