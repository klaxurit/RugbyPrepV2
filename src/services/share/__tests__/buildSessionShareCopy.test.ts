import { describe, expect, it } from 'vitest'
import {
  buildSessionShareFilename,
  buildSessionShareText,
  formatShareFatigue,
  formatShareSets,
  formatShareTonnage,
} from '../buildSessionShareCopy'
import { buildSessionShareIntent } from '../buildSessionShareIntent'
import { resolveSessionShareDifficulty } from '../resolveSessionShareDifficulty'
import { SESSION_SHARE_LANDING_URL } from '../sessionShareTypes'
import type { SessionSharePayload } from '../sessionShareTypes'

const basePayload: SessionSharePayload = {
  sessionLabel: 'Bas du corps · Hypertrophie',
  durationMin: 52,
  completedSets: 18,
  totalSets: 20,
  tonnageKg: 4200,
  rpe: 7,
  fatigue: 'OK',
  prs: [
    { exerciseName: 'Back Squat', newBestKg: 120, previousBestKg: 110 },
    { exerciseName: 'RDL', newBestKg: 100, previousBestKg: 95 },
  ],
  lang: 'fr',
  isPremium: true,
  exerciseMaxLoads: [
    { exerciseId: 'squat', exerciseName: 'Back Squat', maxKg: 120 },
    { exerciseId: 'rdl', exerciseName: 'RDL', maxKg: 100 },
  ],
  congratLine: 'Bravo pour ta séance !',
  purposeLine: 'Cette séance construit le volume musculaire et la capacité de travail (bas du corps).',
}

describe('buildSessionShareCopy', () => {
  it('formatShareSets affiche completed/total', () => {
    expect(formatShareSets(18, 20)).toBe('18/20')
    expect(formatShareSets(5, 0)).toBe('5')
  })

  it('formatShareTonnage délègue à formatTonnage', () => {
    expect(formatShareTonnage(null)).toBeNull()
    expect(formatShareTonnage(0)).toBeNull()
    expect(formatShareTonnage(4200)).toBe('4.2K kg')
  })

  it('formatShareFatigue', () => {
    expect(formatShareFatigue('OK', 'fr')).toBe('En forme')
    expect(formatShareFatigue('FATIGUE', 'fr')).toBe('Fatigué')
    expect(formatShareFatigue('OK', 'en')).toBe('Feeling good')
  })

  it('buildSessionShareText FR premium contient félicitations + max + CTA', () => {
    const text = buildSessionShareText(basePayload)
    expect(text).toContain('Bravo pour ta séance !')
    expect(text).toContain('volume musculaire')
    expect(text).toContain('Séance terminée : Bas du corps · Hypertrophie')
    expect(text).toContain('52 min')
    expect(text).toContain('Forme : En forme')
    expect(text).toContain('Belle intensité')
    expect(text).toContain('Max séance')
    expect(text).toContain('2 records')
    expect(text).toContain(SESSION_SHARE_LANDING_URL)
  })

  it('buildSessionShareText free n’inclut pas les charges', () => {
    const text = buildSessionShareText({
      ...basePayload,
      isPremium: false,
      tonnageKg: null,
      prs: [],
      exerciseMaxLoads: [],
    })
    expect(text).toContain('Bravo pour ta séance !')
    expect(text).not.toContain('Volume')
    expect(text).not.toContain('Max séance')
    expect(text).not.toContain('records')
  })

  it('buildSessionShareFilename slugifie le titre', () => {
    const name = buildSessionShareFilename(basePayload)
    expect(name).toMatch(/^rugbyforge-bas-du-corps-hypertrophie-\d{4}-\d{2}-\d{2}.png$/)
  })
})

describe('buildSessionShareIntent', () => {
  it('détecte force / bas du corps', () => {
    const intent = buildSessionShareIntent('LOWER_OFFSEASON_FORCE_V1', 'fr')
    expect(intent.focus).toBe('force')
    expect(intent.bodyRegion).toBe('lower')
    expect(intent.congratLine).toContain('Bravo')
    expect(intent.purposeLine).toMatch(/force/i)
    expect(intent.purposeLine).toMatch(/bas du corps/i)
  })

  it('détecte bridge / puissance / hypertrophie', () => {
    expect(buildSessionShareIntent('UPPER_OFFSEASON_FORCE_BRIDGE_V1', 'fr').focus).toBe('bridge')
    expect(buildSessionShareIntent('FULL_PRESEASON_POWER_V1', 'en').focus).toBe('power')
    expect(buildSessionShareIntent('LOWER_OFFSEASON_HYPERTROPHY_V1', 'fr').focus).toBe('hypertrophy')
  })
})

describe('resolveSessionShareDifficulty', () => {
  it('mappe les 3 paliers RPE vers les illu Rufo', () => {
    expect(resolveSessionShareDifficulty(2, 'fr')).toMatchObject({
      tier: 'easy',
      imageSrc: '/images/illu/rufo_1.png',
    })
    expect(resolveSessionShareDifficulty(5, 'fr')).toMatchObject({
      tier: 'solid',
      imageSrc: '/images/illu/rufo_2.png',
    })
    expect(resolveSessionShareDifficulty(7, 'fr').tier).toBe('solid')
    expect(resolveSessionShareDifficulty(8, 'fr')).toMatchObject({
      tier: 'beast',
      imageSrc: '/images/illu/rufo_3.png',
    })
    expect(resolveSessionShareDifficulty(10, 'fr').tier).toBe('beast')
  })
})
