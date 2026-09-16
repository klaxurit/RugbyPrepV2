import { describe, expect, it } from 'vitest'
import {
  hasLeveledUp,
  promoteTier,
  relegateTier,
  resolveLevel,
  resolveLevelProgress,
} from '../levels'
import { LEAGUE_TIER_ORDER, LEVEL_THRESHOLDS } from '../scoreConstants'

describe('resolveLevel', () => {
  it('démarre au premier palier', () => {
    expect(resolveLevel(0)).toBe('espoir')
  })

  it('résout chaque seuil déclaré', () => {
    for (const threshold of LEVEL_THRESHOLDS) {
      expect(resolveLevel(threshold.minXp)).toBe(threshold.level)
    }
  })

  it('reste au palier tant que le seuil suivant n’est pas atteint', () => {
    expect(resolveLevel(399)).toBe('espoir')
    expect(resolveLevel(400)).toBe('titulaire')
  })

  it('plafonne au dernier palier', () => {
    expect(resolveLevel(999_999)).toBe('legende')
  })

  it('traite les XP négatives ou non finies comme zéro', () => {
    expect(resolveLevel(-100)).toBe('espoir')
    expect(resolveLevel(Number.NaN)).toBe('espoir')
  })
})

describe('resolveLevelProgress', () => {
  it('expose l’avancement dans le palier courant', () => {
    const progress = resolveLevelProgress(600)
    expect(progress.level).toBe('titulaire')
    expect(progress.nextLevel).toBe('cadre')
    expect(progress.nextLevelXp).toBe(1200)
    expect(progress.xpIntoLevel).toBe(200)
    expect(progress.xpForLevel).toBe(800)
    expect(progress.ratio).toBeCloseTo(0.25)
  })

  it('sature l’avancement au dernier palier', () => {
    const progress = resolveLevelProgress(10_000)
    expect(progress.nextLevel).toBeNull()
    expect(progress.nextLevelXp).toBeNull()
    expect(progress.ratio).toBe(1)
  })

  it('garde un ratio borné entre 0 et 1', () => {
    for (const xp of [0, 1, 399, 400, 1199, 2600, 4999, 5000]) {
      const { ratio } = resolveLevelProgress(xp)
      expect(ratio).toBeGreaterThanOrEqual(0)
      expect(ratio).toBeLessThanOrEqual(1)
    }
  })
})

describe('hasLeveledUp', () => {
  it('détecte un franchissement de palier', () => {
    expect(hasLeveledUp(380, 410)).toBe(true)
  })

  it('ne signale rien à l’intérieur d’un palier', () => {
    expect(hasLeveledUp(100, 300)).toBe(false)
  })
})

describe('promoteTier / relegateTier', () => {
  it('monte et descend d’un cran', () => {
    expect(promoteTier('reserve')).toBe('espoirs')
    expect(relegateTier('espoirs')).toBe('reserve')
  })

  it('ne dépasse pas les bornes de l’échelle', () => {
    const lowest = LEAGUE_TIER_ORDER[0]
    const highest = LEAGUE_TIER_ORDER[LEAGUE_TIER_ORDER.length - 1]
    expect(relegateTier(lowest)).toBe(lowest)
    expect(promoteTier(highest)).toBe(highest)
  })

  it('ne permet pas de sauter un palier', () => {
    // Un athlète qui domine sa cohorte monte d'un cran, pas de deux : chaque
    // semaine de régularité compte autant, aucune semaine n'est sautable.
    expect(promoteTier(promoteTier('reserve'))).toBe('premiere')
  })
})
