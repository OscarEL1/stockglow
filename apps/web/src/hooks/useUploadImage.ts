import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL

export function useUploadImage() {
  const { getToken } = useAuth()

  async function uploadImage(file: File): Promise<string> {
    const token = await getToken()

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
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al subir la imagen')
    }

    const data = await response.json()
    return data.data.url
  }

  return { uploadImage }
}
