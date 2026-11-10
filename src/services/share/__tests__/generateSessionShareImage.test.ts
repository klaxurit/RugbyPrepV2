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

function mockShareAssets() {
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    ({
      ok: true,
      status: 200,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => pngBytes.buffer.slice(0),
    }) as unknown as Response,
  )
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

const assets = { logoSrc: '/logo.png', crestSrc: 'data:image/svg+xml,x' }
const render = (patch: Partial<SessionSharePayload> = {}, a: Parameters<typeof buildSessionShareCardModel>[1] = assets) =>
  buildSessionShareCardHtml(buildSessionShareCardModel({ ...payload, ...patch }, a))

describe('buildSessionShareCardHtml (v2)', () => {
  it('record battu en héros : exercice, charge, delta, tampon', () => {
    const html = render()
    expect(html).toContain('class="hero hero-record"')
    expect(html).toContain('>Bench Press</h1>')
    expect(html).toContain('<span class="big" style="font-size:176px">90</span>')
    expect(html).toContain('<b>+5 kg</b><span>vs 85 kg</span>')
    expect(html).toContain('class="stamp"')
  })

  it('jamais le tonnage en héros ; il peut être en chip', () => {
    const html = render({ prs: [] })
    expect(html).toContain('class="hero hero-session"')
    expect(html).toContain('>Haut du corps</h1>')
    expect(html).not.toContain('Force.</h1>')
    expect(html).toContain('<div class="chip">3,1 t soulevées</div>')
    expect(html).not.toMatch(/class="big"[^>]*>3,1/)
  })

  it('semaine de match en héros si aucun record', () => {
    const html = render({
      prs: [],
      nextMatch: { daysUntil: 5, opponent: 'Rugby Club Hérouvillais', isHome: false },
    })
    expect(html).toContain('class="hero hero-match"')
    expect(html).toContain('<div class="jx">J-5</div>')
    expect(html).toContain('PROCHAIN MATCH · EXT.')
    expect(html).toContain('>Hérouvillais</span>')
    expect(html.match(/class="day /g)).toHaveLength(7)
  })

  it('record + match : le J-X remplace la date en en-tête', () => {
    const html = render({ nextMatch: { daysUntil: 3, opponent: 'RC Caen', isHome: true } })
    expect(html).toContain('class="hero hero-record"')
    expect(html).toContain('<div class="hchip right">J-3 · Caen</div>')
  })

  it('poste en chip haut, pas dans le pied ; pied club + niveau', () => {
    const html = render({ prs: [], competitionName: 'Régionale 2 - Poule 4' })
    expect(html).toContain('<div class="hchip left">1ère ligne</div>')
    expect(html).toContain('<span class="seg-name">Jean</span>')
    expect(html).toContain('<span class="seg-club-name">JO Pradéenne</span>')
    expect(html).toContain('<span class="seg-level">Régionale 2</span>')
    expect(html.match(/class="sep"/g)).toHaveLength(2)
    expect(html).not.toMatch(/seg-[a-z-]+">1ère ligne/)
  })

  it('max 3 chips, une seule info de régularité', () => {
    const html = render({ prs: [], sessionOrdinalLabel: 'Séance 5/5' })
    expect(html.match(/class="chip[" ]/g)).toHaveLength(3)
    expect(html).toContain('<div class="chip">Semaine 5/5</div>')
    expect(html).not.toContain('Séance 5/5')
  })

  it('toggle club désactivé : ni club, ni niveau, ni écusson', () => {
    const html = render({ showClub: false, competitionName: 'Régionale 2' })
    expect(html).not.toContain('JO Pradéenne')
    expect(html).not.toContain('Régionale')
    expect(html).not.toContain('footer-crest')
  })

  it('sans photo : fond de marque (trame terrain) ; avec photo : panneau + liseré', () => {
    expect(render()).toContain('rf-share-card no-photo')
    expect(render()).toContain('class="pitch"')
    const withPhoto = render({}, { ...assets, photoSrc: 'data:image/jpeg;base64,AAA' })
    expect(withPhoto).toContain('rf-share-card has-photo')
    expect(withPhoto).toContain('class="edge"')
  })

  it('aucune identité : wordmark seul, pas de séparateur ni de chip poste', () => {
    const html = render({ firstName: null, displayName: null, clubName: null, positionLabel: null })
    expect(html).toContain('footer-row solo')
    expect(html).not.toContain('class="sep"')
    expect(html).not.toContain('hchip left')
  })
})

describe('generateSessionShareImage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.querySelectorAll('[data-rf-share-host]').forEach((n) => n.remove())
  })

  it('monte le mockup DOM et encode un PNG Stories', async () => {
    mockShareAssets()
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
    mockShareAssets()
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
