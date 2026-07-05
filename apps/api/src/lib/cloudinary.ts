import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = 'stockglow/variantes'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload fallido'))
            return
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          })
        }
      )
      .end(fileBuffer)
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
