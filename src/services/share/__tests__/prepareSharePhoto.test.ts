/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isSharePhotoTooSmall,
  prepareSharePhoto,
  revokeSharePhotoUrl,
  SHARE_PHOTO_MIN_SHORT_SIDE,
  targetSharePhotoSize,
} from '../prepareSharePhoto'

describe('isSharePhotoTooSmall', () => {
  it('signale un côté court sous le seuil', () => {
    expect(isSharePhotoTooSmall(800, 1200)).toBe(true)
    expect(isSharePhotoTooSmall(1200, 800)).toBe(true)
  })

  it('accepte un côté court ≥ 1080', () => {
    expect(isSharePhotoTooSmall(1080, 1920)).toBe(false)
    expect(isSharePhotoTooSmall(SHARE_PHOTO_MIN_SHORT_SIDE, SHARE_PHOTO_MIN_SHORT_SIDE)).toBe(
      false,
    )
  })
})

describe('targetSharePhotoSize', () => {
  it('ne change rien sous le plafond', () => {
    expect(targetSharePhotoSize(900, 1200, 1600)).toEqual({ width: 900, height: 1200 })
  })

  it('downscale le côté long à maxLongSide', () => {
    expect(targetSharePhotoSize(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 })
  })
})

function stubCanvasJpeg(jpegBytes = new Uint8Array([0xff, 0xd8, 0xff])) {
  const toBlob = vi.fn((cb: (b: Blob | null) => void) => {
    cb(new Blob([jpegBytes], { type: 'image/jpeg' }))
  })
  const drawImage = vi.fn()
  const getContext = vi.fn(() => ({ drawImage }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    getContext as unknown as typeof HTMLCanvasElement.prototype.getContext,
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    toBlob as unknown as typeof HTMLCanvasElement.prototype.toBlob,
  )
  return { toBlob, drawImage, getContext }
}

describe('prepareSharePhoto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('refuse un type non image', async () => {
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
    const result = await prepareSharePhoto(file)
    expect(result).toEqual({ ok: false, reason: 'unsupported_type' })
  })

  it('accepte MIME vide si extension jpeg', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'shot.jpg', { type: '' })
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:source')
      .mockReturnValueOnce('blob:jpeg-out')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    stubCanvasJpeg()

    class FakeImage {
      naturalWidth = 900
      naturalHeight = 1600
      width = 900
      height = 1600
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_v: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('createImageBitmap', undefined)

    const result = await prepareSharePhoto(file)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.objectUrl).toBe('blob:jpeg-out')
      expect(result.width).toBe(900)
      expect(result.height).toBe(1600)
      expect(result.tooSmall).toBe(true)
    }
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:source')
  })

  it('convertit HEIC décodable en JPEG downscalé', async () => {
    const file = new File([new Uint8Array([1])], 'img.heic', { type: 'image/heic' })
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:heic-source')
      .mockReturnValueOnce('blob:jpeg-out')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const { drawImage } = stubCanvasJpeg()

    class FakeImage {
      naturalWidth = 3000
      naturalHeight = 4000
      width = 3000
      height = 4000
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_v: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('createImageBitmap', undefined)

    const result = await prepareSharePhoto(file)
    expect(result).toEqual({
      ok: true,
      objectUrl: 'blob:jpeg-out',
      width: 1200,
      height: 1600,
      tooSmall: false,
    })
    expect(drawImage).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:heic-source')
  })

  it('révoque l’URL source si le décodage échoue', async () => {
    const file = new File([new Uint8Array([1])], 'bad.png', { type: 'image/png' })
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:bad',
      revokeObjectURL,
    })

    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_v: string) {
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('createImageBitmap', undefined)

    const result = await prepareSharePhoto(file)
    expect(result).toEqual({ ok: false, reason: 'decode_failed' })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:bad')
  })
})

describe('revokeSharePhotoUrl', () => {
  it('ne révoque que les blob:', () => {
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { revokeObjectURL })
    revokeSharePhotoUrl('https://example.com/a.jpg')
    revokeSharePhotoUrl(null)
    revokeSharePhotoUrl('blob:abc')
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:abc')
    vi.unstubAllGlobals()
  })
})
