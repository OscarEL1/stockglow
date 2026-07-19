const API_URL = import.meta.env.VITE_API_URL

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
    throw new Error(
      payload?.error?.message || `Error en la petición (${response.status})`
    )
  }

  return payload
}
