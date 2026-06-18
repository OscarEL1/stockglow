const API_URL = import.meta.env.VITE_API_URL

export async function fetchWithAuth(
  getToken: () => Promise<string | null>,
  path: string,
  options: RequestInit = {}
) {
  const token = await getToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Error en la petición')
  }

  return response.json()
}
