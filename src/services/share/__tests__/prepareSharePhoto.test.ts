/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isSharePhotoTooSmall,
  prepareSharePhoto,
  revokeSharePhotoUrl,
  SHARE_PHOTO_MIN_SHORT_SIDE,
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

  it('accepte une image et calcule tooSmall', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'shot.jpg', { type: 'image/jpeg' })
    const createObjectURL = vi.fn(() => 'blob:mock-photo')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

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
    expect(result).toEqual({
      ok: true,
      objectUrl: 'blob:mock-photo',
      width: 900,
      height: 1600,
      tooSmall: true,
    })
    expect(createObjectURL).toHaveBeenCalledWith(file)
  })

  it('révoque l’URL si le décodage échoue', async () => {
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
