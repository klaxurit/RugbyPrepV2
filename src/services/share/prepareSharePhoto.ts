/**
 * Prépare une photo locale pour la carte de partage (object URL + dims).
 * Aucun upload. Warning non bloquant si côté court < 1080.
 */

export const SHARE_PHOTO_MIN_SHORT_SIDE = 1080

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

async function readImageSize(objectUrl: string): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const res = await fetch(objectUrl)
      const blob = await res.blob()
      const bitmap = await createImageBitmap(blob)
      const size = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return size
    } catch {
      // fallback Image
    }
  }

  return await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      })
    img.onerror = () => reject(new Error('img decode'))
    img.src = objectUrl
  })
}

/**
 * File → object URL + dimensions. Ne redimensionne pas (point 2 minimal).
 */
export async function prepareSharePhoto(file: File): Promise<PrepareSharePhotoResult> {
  const mime = normalizeMime(file)
  if (!ALLOWED.has(mime)) {
    return { ok: false, reason: 'unsupported_type' }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const { width, height } = await readImageSize(objectUrl)
    if (!width || !height) {
      revokeSharePhotoUrl(objectUrl)
      return { ok: false, reason: 'decode_failed' }
    }
    return {
      ok: true,
      objectUrl,
      width,
      height,
      tooSmall: isSharePhotoTooSmall(width, height),
    }
  } catch {
    revokeSharePhotoUrl(objectUrl)
    return { ok: false, reason: 'decode_failed' }
  }
}
