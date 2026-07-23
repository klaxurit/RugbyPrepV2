/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateSessionShareImage } from '../generateSessionShareImage'
import {
  SESSION_SHARE_HEIGHT,
  SESSION_SHARE_WIDTH,
  type SessionSharePayload,
} from '../sessionShareTypes'

const payload: SessionSharePayload = {
  sessionLabel: 'Haut du corps · Force',
  durationMin: 48,
  completedSets: 16,
  totalSets: 16,
  tonnageKg: 3100,
  rpe: 8,
  fatigue: 'FATIGUE',
  prs: [{ exerciseName: 'Bench Press', newBestKg: 90, previousBestKg: 85 }],
  lang: 'fr',
  isPremium: true,
  exerciseMaxLoads: [
    { exerciseId: 'bench', exerciseName: 'Bench Press', maxKg: 90 },
    { exerciseId: 'row', exerciseName: 'Barbell Row', maxKg: 80 },
  ],
  congratLine: 'Bravo pour ta séance !',
  purposeLine: 'Cette séance développe la force (haut du corps).',
}

function mockImageLoad() {
  vi.spyOn(globalThis, 'Image').mockImplementation(function MockImage(this: {
    onload: ((ev: Event) => void) | null
    onerror: ((ev: Event) => void) | null
    src: string
    width: number
    height: number
  }) {
    this.onload = null
    this.onerror = null
    this.width = 800
    this.height = 800
    Object.defineProperty(this, 'src', {
      set() {
        queueMicrotask(() => this.onload?.(new Event('load')))
      },
      get() {
        return ''
      },
    })
  } as unknown as typeof Image)
}

function mockCanvas2d() {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'center' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 18 }),
  }

  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toBlob: vi.fn((cb: BlobCallback) => {
      cb(new Blob(['fake-png'], { type: 'image/png' }))
    }),
  }

  const originalCreateElement = document.createElement.bind(document)
  let canvasCalls = 0
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') {
      canvasCalls += 1
      if (canvasCalls === 1) return canvas as unknown as HTMLCanvasElement
      // Offscreen pour punchBlackBackground
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: vi.fn(),
        }),
      } as unknown as HTMLCanvasElement
    }
    return originalCreateElement(tag)
  })

  return { canvas, ctx }
}

describe('generateSessionShareImage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('configure le canvas Stories et encode un PNG', async () => {
    mockImageLoad()
    const { canvas } = mockCanvas2d()
    const blob = await generateSessionShareImage(payload)

    expect(canvas.toBlob).toHaveBeenCalled()
    expect(canvas.width).toBe(SESSION_SHARE_WIDTH)
    expect(canvas.height).toBe(SESSION_SHARE_HEIGHT)
    expect(blob.type).toBe('image/png')
  })

  it('accepte titre long + sans PR (free)', async () => {
    mockImageLoad()
    mockCanvas2d()
    const blob = await generateSessionShareImage({
      ...payload,
      sessionLabel:
        'Préparation physique complète bas du corps hypertrophie volume élevé',
      tonnageKg: null,
      prs: [],
      exerciseMaxLoads: [],
      isPremium: false,
      rpe: 3,
      fatigue: 'OK',
      lang: 'en',
      congratLine: 'Nice work — session done.',
      purposeLine: 'This session builds muscle size and work capacity (lower body).',
    })
    expect(blob.type).toBe('image/png')
  })
})
