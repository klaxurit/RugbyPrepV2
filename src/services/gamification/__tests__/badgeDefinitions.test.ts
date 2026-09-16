import { describe, expect, it } from 'vitest'
import {
  BADGE_DEFINITIONS,
  badgeDetail,
  badgeLabel,
  resolveNewBadgeIds,
  resolveUnlockedBadgeIds,
  type BadgeFacts,
} from '../badgeDefinitions'

const NOTHING: BadgeFacts = {
  fullPlanWeeks: 0,
  longestWeekStreak: 0,
  deloadWeeksRespected: 0,
  level: 'espoir',
}

describe('badgeDefinitions', () => {
  it('ne récompense jamais le volume', () => {
    // Garde-fou de doctrine : un badge indexé sur le tonnage, les heures ou le
    // nombre total de séances contredirait `computeWeeklyScore`.
    const text = BADGE_DEFINITIONS.map(
      (badge) => `${badge.id} ${badge.label.fr} ${badge.detail.fr} ${badge.detail.en}`,
    )
      .join(' ')
      .toLowerCase()
    expect(text).not.toMatch(/tonnage|heures cumulées|hours|kg|séances au total/)
    expect(BADGE_DEFINITIONS.every((badge) => !/session|volume/.test(badge.id))).toBe(true)
  })

  it('ne débloque rien pour un athlète sans historique', () => {
    expect(resolveUnlockedBadgeIds(NOTHING)).toEqual([])
  })

  it('débloque les paliers de conformité de façon cumulative', () => {
    expect(resolveUnlockedBadgeIds({ ...NOTHING, fullPlanWeeks: 4 })).toEqual([
      'plan_week_1',
      'plan_week_4',
    ])
    expect(resolveUnlockedBadgeIds({ ...NOTHING, fullPlanWeeks: 30 })).toContain(
      'plan_week_26',
    )
  })

  it('débloque les paliers de régularité sur la meilleure série', () => {
    expect(resolveUnlockedBadgeIds({ ...NOTHING, longestWeekStreak: 8 })).toEqual([
      'streak_4',
      'streak_8',
    ])
  })

  it('récompense la décharge respectée', () => {
    expect(resolveUnlockedBadgeIds({ ...NOTHING, deloadWeeksRespected: 1 })).toEqual([
      'deload_1',
    ])
    expect(resolveUnlockedBadgeIds({ ...NOTHING, deloadWeeksRespected: 3 })).toEqual([
      'deload_1',
      'deload_3',
    ])
  })

  it('traite les paliers de niveau comme des seuils atteints, pas des égalités', () => {
    const legend = resolveUnlockedBadgeIds({ ...NOTHING, level: 'legende' })
    expect(legend).toEqual(['level_cadre', 'level_capitaine', 'level_legende'])
    expect(resolveUnlockedBadgeIds({ ...NOTHING, level: 'titulaire' })).toEqual([])
  })

  it('ne renvoie que les badges réellement nouveaux', () => {
    const facts = { ...NOTHING, fullPlanWeeks: 4, longestWeekStreak: 4 }
    expect(resolveNewBadgeIds(facts, ['plan_week_1'])).toEqual(['plan_week_4', 'streak_4'])
    expect(resolveNewBadgeIds(facts, ['plan_week_1', 'plan_week_4', 'streak_4'])).toEqual([])
  })

  it('n’oublie pas un badge acquis quand les faits régressent', () => {
    // L'appelant ne réinsère pas : un badge déjà en base reste acquis même si
    // une correction d'historique fait baisser le compteur.
    expect(resolveNewBadgeIds(NOTHING, ['plan_week_1'])).toEqual([])
  })

  it('expose des libellés dans les deux langues', () => {
    expect(badgeLabel('deload_1', 'fr')).toBe('Décharge assumée')
    expect(badgeLabel('deload_1', 'en')).toBe('Deload owned')
    expect(badgeDetail('streak_4', 'fr')).toMatch(/quatre semaines/i)
  })

  it('renvoie null pour un identifiant inconnu au lieu d’un libellé vide', () => {
    expect(badgeLabel('badge_retire', 'fr')).toBeNull()
    expect(badgeDetail('badge_retire', 'fr')).toBeNull()
  })

  it('n’a pas d’identifiant en doublon', () => {
    const ids = BADGE_DEFINITIONS.map((badge) => badge.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
