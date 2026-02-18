export interface CropAreaPixels {
  width: number
  height: number
  x: number
  y: number
}

const createImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image for crop'))
    image.src = src
  })

const mapMimeToExtension = (mimeType: string): string => {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

export const getCroppedImageFile = async (
  imageSrc: string,
  cropAreaPixels: CropAreaPixels,
  mimeType: string,
): Promise<File> => {
  const image = await createImage(imageSrc)

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas context unavailable')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error('Crop export failed'))
        return
      }

      resolve(result)
    }, mimeType, 0.92)
  })

  const extension = mapMimeToExtension(mimeType)
  return new File([blob], `avatar-cropped.${extension}`, { type: mimeType })
}
