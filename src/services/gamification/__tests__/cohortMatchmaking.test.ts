import { describe, expect, it } from 'vitest'
import {
  buildCohorts,
  resolveLeagueCutoffs,
  type CohortCandidate,
} from '../cohortMatchmaking'
import { LEAGUE_RULES } from '../scoreConstants'

function candidate(
  userId: string,
  overrides: Partial<CohortCandidate> = {},
): CohortCandidate {
  return {
    userId,
    tier: 'reserve',
    trainingLevel: 'builder',
    plannedWeeklySessions: 3,
    priorWeekPoints: 100,
    ...overrides,
  }
}

function manyCandidates(count: number, overrides: Partial<CohortCandidate> = {}) {
  return Array.from({ length: count }, (_, i) =>
    candidate(`user-${String(i).padStart(3, '0')}`, overrides),
  )
}

describe('resolveLeagueCutoffs', () => {
  it('promeut et relègue cinq athlètes sur une cohorte pleine', () => {
    const cutoffs = resolveLeagueCutoffs(LEAGUE_RULES.TARGET_COHORT_SIZE)
    expect(cutoffs.promotionCutoff).toBe(5)
    expect(cutoffs.relegationCutoff).toBe(20)
  })

  it('n’applique aucun mouvement sous la taille viable', () => {
    const cutoffs = resolveLeagueCutoffs(LEAGUE_RULES.MIN_VIABLE_COHORT_SIZE - 1)
    expect(cutoffs).toEqual({ promotionCutoff: 0, relegationCutoff: 0 })
  })

  it('ajuste proportionnellement les zones sur une cohorte sous-remplie', () => {
    const cutoffs = resolveLeagueCutoffs(12)
    expect(cutoffs.promotionCutoff).toBe(3)
    expect(cutoffs.relegationCutoff).toBe(10)
  })

  it('laisse toujours une place neutre entre promotion et relégation', () => {
    for (let size = LEAGUE_RULES.MIN_VIABLE_COHORT_SIZE; size <= 30; size++) {
      const { promotionCutoff, relegationCutoff } = resolveLeagueCutoffs(size)
      expect(promotionCutoff).toBeGreaterThanOrEqual(1)
      expect(relegationCutoff).toBeGreaterThan(promotionCutoff)
      expect(relegationCutoff).toBeLessThanOrEqual(size)
    }
  })
})

describe('buildCohorts', () => {
  it('ne produit aucune cohorte sans candidat', () => {
    expect(buildCohorts([])).toEqual([])
  })

  it('respecte la taille maximale de cohorte', () => {
    const cohorts = buildCohorts(manyCandidates(70))
    for (const cohort of cohorts) {
      expect(cohort.memberIds.length).toBeLessThanOrEqual(LEAGUE_RULES.MAX_COHORT_SIZE)
    }
  })

  it('place chaque candidat dans exactement une cohorte', () => {
    const candidates = manyCandidates(53)
    const assigned = buildCohorts(candidates).flatMap((c) => c.memberIds)
    expect(assigned).toHaveLength(candidates.length)
    expect(new Set(assigned).size).toBe(candidates.length)
  })

  it('fusionne un reliquat trop petit dans la cohorte précédente', () => {
    // 26 candidats : 24 + 2. Le paquet de 2 n'est pas une ligue viable.
    const cohorts = buildCohorts(manyCandidates(26))
    expect(cohorts).toHaveLength(1)
    expect(cohorts[0].memberIds).toHaveLength(26)
  })

  it('fusionne un palier non viable vers un palier voisin', () => {
    const candidates = [
      ...manyCandidates(20, { tier: 'reserve' }),
      candidate('lonely', { tier: 'elite' }),
    ]
    const cohorts = buildCohorts(candidates)
    expect(cohorts).toHaveLength(1)
    expect(cohorts[0].memberIds).toContain('lonely')
  })

  it('n’enferme jamais un athlète seul dans sa ligue', () => {
    const cohorts = buildCohorts([
      ...manyCandidates(8, { tier: 'premiere' }),
      candidate('solo', { tier: 'elite' }),
    ])
    for (const cohort of cohorts) {
      expect(cohort.memberIds.length).toBeGreaterThan(1)
    }
  })

  it('apparie les athlètes de volume et de niveau comparables', () => {
    // 30 candidats forcent deux cohortes : les débutants à faible volume ne
    // doivent pas se retrouver avec les athlètes en bloc performance.
    const candidates = [
      ...manyCandidates(15, { trainingLevel: 'starter', plannedWeeklySessions: 2 }).map(
        (c) => ({ ...c, userId: `starter-${c.userId}` }),
      ),
      ...manyCandidates(15, {
        trainingLevel: 'performance',
        plannedWeeklySessions: 5,
      }).map((c) => ({ ...c, userId: `perf-${c.userId}` })),
    ]
    const cohorts = buildCohorts(candidates)
    expect(cohorts.length).toBeGreaterThan(1)

    const firstCohort = cohorts[0].memberIds
    const startersInFirst = firstCohort.filter((id) => id.startsWith('starter-')).length
    expect(startersInFirst).toBeGreaterThan(firstCohort.length / 2)
  })

  it('est déterministe à entrée égale', () => {
    const candidates = manyCandidates(40)
    expect(buildCohorts(candidates)).toEqual(buildCohorts(candidates))
  })

  it('retombe sur le palier le plus bas pour un palier inconnu', () => {
    const cohorts = buildCohorts(
      manyCandidates(10, { tier: 'inconnu' as CohortCandidate['tier'] }),
    )
    expect(cohorts).toHaveLength(1)
    expect(cohorts[0].tier).toBe('reserve')
  })
})
