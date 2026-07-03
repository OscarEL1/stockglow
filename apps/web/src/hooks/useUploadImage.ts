import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL

export function useUploadImage() {
  const { getToken } = useAuth()

  async function uploadImage(file: File): Promise<string> {
    const token = await getToken()

    if (!token) {
      throw new Error('No hay sesión activa')
    }

    if (!API_URL) {
      throw new Error('VITE_API_URL no está configurado')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/api/v1/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      let message = 'Error al subir la imagen'
      try {
        const error = await response.json()
        message = error.error?.message || message
      } catch {
        // respuesta no es JSON
      }
      throw new Error(message)
    }

    const data = await response.json()
    return data.data.url
  }

  return { uploadImage }
}
