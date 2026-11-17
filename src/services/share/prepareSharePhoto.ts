/**
 * Prépare une photo locale pour la carte de partage :
 * décode → redimensionne → JPEG blob URL (safe html-to-image / mobile HEIC).
 * Aucun upload. Warning non bloquant si côté court final < 1080.
 */

export const SHARE_PHOTO_MIN_SHORT_SIDE = 1080

/** Côté long max après downscale (mémoire Safari / foreignObject). */
export const SHARE_PHOTO_MAX_LONG_SIDE = 1600

const JPEG_QUALITY = 0.85

const ALLOWED = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

export type PrepareSharePhotoResult =
  | {
      ok: true
      objectUrl: string
      width: number
      height: number
      tooSmall: boolean
    }
  | { ok: false; reason: 'unsupported_type' | 'decode_failed' }

function normalizeMime(file: File): string {
  const t = (file.type || '').toLowerCase()
  if (t) return t
  const name = file.name.toLowerCase()
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.heic') || name.endsWith('.heif')) return 'image/heic'
  return ''
}

/** Côté court < 1080 → rendu Story potentiellement flou. */
export function isSharePhotoTooSmall(width: number, height: number): boolean {
  return Math.min(width, height) < SHARE_PHOTO_MIN_SHORT_SIDE
}

export function revokeSharePhotoUrl(url: string | null | undefined): void {
  if (!url?.startsWith('blob:')) return
  try {
    URL.revokeObjectURL(url)
  } catch {
    // ignore
  }
}

export function targetSharePhotoSize(
  width: number,
  height: number,
  maxLongSide = SHARE_PHOTO_MAX_LONG_SIDE,
): { width: number; height: number } {
  const longSide = Math.max(width, height)
  if (longSide <= maxLongSide) {
    return { width, height }
  }
  const scale = maxLongSide / longSide
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function loadBitmapFromFile(file: File): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== 'function') return null
  try {
    return await createImageBitmap(file)
  } catch {
    return null
  }
}

async function loadImageFromObjectUrl(
  objectUrl: string,
): Promise<{ width: number; height: number; element: HTMLImageElement }> {
  return await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        element: img,
      })
    img.onerror = () => reject(new Error('img decode'))
    img.src = objectUrl
  })
}

async function canvasToJpegBlob(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unsupported')
  ctx.drawImage(source, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
  })
  if (!blob) throw new Error('toBlob null')
  return blob
}

/**
 * File → JPEG object URL + dimensions (downscale si besoin).
 * HEIC/HEIF : décodés via Image/bitmap navigateur puis ré-encodés JPEG.
 */
export async function prepareSharePhoto(file: File): Promise<PrepareSharePhotoResult> {
  const mime = normalizeMime(file)
  if (!ALLOWED.has(mime)) {
    return { ok: false, reason: 'unsupported_type' }
  }

  let sourceObjectUrl: string | null = null
  let bitmap: ImageBitmap | null = null

  try {
    bitmap = await loadBitmapFromFile(file)
    let source: CanvasImageSource
    let width: number
    let height: number

    if (bitmap) {
      source = bitmap
      width = bitmap.width
      height = bitmap.height
    } else {
      sourceObjectUrl = URL.createObjectURL(file)
      const loaded = await loadImageFromObjectUrl(sourceObjectUrl)
      source = loaded.element
      width = loaded.width
      height = loaded.height
    }

    if (!width || !height) {
      return { ok: false, reason: 'decode_failed' }
    }

    const target = targetSharePhotoSize(width, height)
    const jpegBlob = await canvasToJpegBlob(source, target.width, target.height)
    const objectUrl = URL.createObjectURL(jpegBlob)

    return {
      ok: true,
      objectUrl,
      width: target.width,
      height: target.height,
      tooSmall: isSharePhotoTooSmall(target.width, target.height),
    }
  } catch {
    return { ok: false, reason: 'decode_failed' }
  } finally {
    bitmap?.close()
    if (sourceObjectUrl) revokeSharePhotoUrl(sourceObjectUrl)
  }
}
