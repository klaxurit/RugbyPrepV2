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
import {
  buildSessionShareCardHtml,
  buildSessionShareCardModel,
  formatShareTitleHtml,
} from '../buildSessionShareCardHtml'

vi.mock('html-to-image', () => ({
  toBlob: vi.fn(async () => new Blob(['fake-png'], { type: 'image/png' })),
}))

vi.mock('../sessionShareCard.css?raw', () => ({
  default: '.rf-share-card{width:1080px;height:1920px}',
}))

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
  firstName: 'Jean',
  displayName: 'Jean Dupont',
  positionLabel: '1ère ligne',
  clubName: 'JO Pradéenne',
  dateLabel: 'Vendredi 8 mai',
  weekLabel: 'Semaine 19',
  sessionOrdinalLabel: 'Séance 3/5',
}

function mockImageLoad() {
  vi.spyOn(globalThis, 'Image').mockImplementation(function MockImage(this: {
    onload: ((ev: Event) => void) | null
    onerror: ((ev: Event) => void) | null
    src: string
    width: number
    height: number
    complete: boolean
    naturalWidth: number
  }) {
    this.onload = null
    this.onerror = null
    this.width = 800
    this.height = 800
    this.complete = true
    this.naturalWidth = 800
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

describe('formatShareTitleHtml', () => {
  it('casse le titre mockup sur 2 lignes', () => {
    expect(formatShareTitleHtml('Bas du corps · Puissance')).toBe(
      'Bas du corps<br>Puissance.',
    )
  })
})

describe('buildSessionShareCardHtml', () => {
  it('reproduit la structure du mockup (stats plates, quote, footer CTA)', () => {
    const model = buildSessionShareCardModel(payload, {
      logoSrc: '/logo.png',
      portraitSrc: '/avatar.png',
    })
    const html = buildSessionShareCardHtml(model)

    expect(html).toContain('class="rf-share-card"')
    expect(html).toContain('Séance terminée')
    expect(html).toContain('Haut du corps<br>Force.')
    expect(html).toContain('Vendredi 8 mai · Semaine 19 · Séance 3/5')
    expect(html).toContain('class="tag gold"')
    expect(html).toContain('class="stats"')
    expect(html).toContain('class="stat"')
    expect(html).toContain('Record de séance')
    // RPE 8 → « À fond, Jean. »
    expect(html).toContain('&quot;À fond, Jean.&quot;')
    expect(html).toContain('class="rpe-dots"')
    expect(html).toContain('Jean Dupont')
    expect(html).toContain('1ère ligne · JO Pradéenne')
    expect(html).toContain('footer-cta')
    expect(html).toContain('rugbyforge.fr')
    // Pas de filigrane jour (ex. « 28 ») ni UI browse
    expect(html).not.toContain('font-size:420px')
    expect(html).not.toContain('browse')
    expect(html).not.toContain('image-slot')
  })

  it('n’affiche pas la bannière record sans vrai PR', () => {
    const model = buildSessionShareCardModel(
      { ...payload, prs: [] },
      { logoSrc: '/logo.png', portraitSrc: '/avatar.png' },
    )
    expect(model.sessionRecord).toBeNull()
    const html = buildSessionShareCardHtml(model)
    expect(html).not.toContain('class="pr"')
    expect(html).not.toContain('Record de séance')
  })
})

describe('generateSessionShareImage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.querySelectorAll('[data-rf-share-host]').forEach((n) => n.remove())
  })

  it('monte le mockup DOM et encode un PNG Stories', async () => {
    mockImageLoad()
    const { toBlob } = await import('html-to-image')
    const blob = await generateSessionShareImage(payload)

    expect(toBlob).toHaveBeenCalled()
    const cardArg = vi.mocked(toBlob).mock.calls[0]?.[0] as HTMLElement
    expect(cardArg.classList.contains('rf-share-card')).toBe(true)
    expect(blob.type).toBe('image/png')

    const opts = vi.mocked(toBlob).mock.calls[0]?.[1] as {
      width: number
      height: number
    }
    expect(opts.width).toBe(SESSION_SHARE_WIDTH)
    expect(opts.height).toBe(SESSION_SHARE_HEIGHT)
  })

  it('accepte un payload free sans PR', async () => {
    mockImageLoad()
    const blob = await generateSessionShareImage({
      ...payload,
      tonnageKg: null,
      prs: [],
      exerciseMaxLoads: [],
      isPremium: false,
      rpe: 3,
      fatigue: 'OK',
      lang: 'en',
    })
    expect(blob.type).toBe('image/png')
  })
})
