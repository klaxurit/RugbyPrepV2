import type { LeagueTier } from '../../types/gamification.ts'
import { LEAGUE_RULES, LEAGUE_TIER_ORDER } from './scoreConstants.ts'

/**
 * Appariement des cohortes de ligue hebdomadaires.
 *
 * L'arène doit être **gagnable** : une cohorte de 20 à 30 athlètes appariés
 * sur des habitudes comparables rend le haut de tableau plausible pour
 * n'importe qui, là où un classement global place la plupart des utilisateurs
 * à une position qu'ils n'atteindront jamais et qu'ils cessent de consulter.
 *
 * L'appariement se fait sur le **volume hebdomadaire prévu** et le niveau
 * d'entraînement, jamais sur la performance brute : un débutant ne doit pas
 * affronter un athlète en bloc performance.
 */

export interface CohortCandidate {
  userId: string
  tier: LeagueTier
  trainingLevel: 'starter' | 'builder' | 'performance'
  /** Séances prévues par semaine — proxy du temps disponible de l'athlète. */
  plannedWeeklySessions: number
  /** Points de la semaine précédente, pour affiner l'appariement. */
  priorWeekPoints: number
}

export interface CohortAssignment {
  tier: LeagueTier
  memberIds: string[]
}

export interface LeagueCutoffs {
  /** Dernier rang promu. 0 si la cohorte n'est pas viable. */
  promotionCutoff: number
  /** Premier rang relégué. 0 si la cohorte n'est pas viable. */
  relegationCutoff: number
}

const LEVEL_RANK: Record<CohortCandidate['trainingLevel'], number> = {
  starter: 0,
  builder: 1,
  performance: 2,
}

/**
 * Seuils de promotion et de relégation, ajustés à la taille réelle de la
 * cohorte. Une cohorte sous-remplie garde la même proportion de promus et de
 * relégués qu'une cohorte pleine, faute de quoi la moitié du tableau
 * changerait de palier chaque semaine.
 *
 * En dessous de `MIN_VIABLE_COHORT_SIZE`, aucun mouvement : il n'y a pas assez
 * d'adversaires pour que le résultat veuille dire quelque chose.
 */
export function resolveLeagueCutoffs(cohortSize: number): LeagueCutoffs {
  const size = Math.max(0, Math.trunc(cohortSize))
  if (size < LEAGUE_RULES.MIN_VIABLE_COHORT_SIZE) {
    return { promotionCutoff: 0, relegationCutoff: 0 }
  }

  const ratio = size / LEAGUE_RULES.TARGET_COHORT_SIZE
  const promoted = Math.max(1, Math.round(LEAGUE_RULES.PROMOTED_AT_TARGET_SIZE * ratio))
  const relegated = Math.max(1, Math.round(LEAGUE_RULES.RELEGATED_AT_TARGET_SIZE * ratio))

  // Il faut toujours au moins une place neutre entre la zone de promotion et
  // la zone de relégation, sinon rester en place devient impossible.
  const maxMovers = Math.max(0, size - 1)
  if (promoted + relegated > maxMovers) {
    const half = Math.floor(maxMovers / 2)
    const safePromoted = Math.max(1, half)
    const safeRelegated = Math.max(1, maxMovers - safePromoted)
    return {
      promotionCutoff: safePromoted,
      relegationCutoff: size - safeRelegated + 1,
    }
  }

  return {
    promotionCutoff: promoted,
    relegationCutoff: size - relegated + 1,
  }
}

function chunkGroup(members: CohortCandidate[]): string[][] {
  const sorted = [...members].sort((a, b) => {
    const level = LEVEL_RANK[a.trainingLevel] - LEVEL_RANK[b.trainingLevel]
    if (level !== 0) return level
    const volume = a.plannedWeeklySessions - b.plannedWeeklySessions
    if (volume !== 0) return volume
    const points = b.priorWeekPoints - a.priorWeekPoints
    if (points !== 0) return points
    return a.userId.localeCompare(b.userId)
  })

  const chunks: string[][] = []
  for (let i = 0; i < sorted.length; i += LEAGUE_RULES.TARGET_COHORT_SIZE) {
    chunks.push(sorted.slice(i, i + LEAGUE_RULES.TARGET_COHORT_SIZE).map((c) => c.userId))
  }

  // Dernier paquet trop petit : il rejoint le précédent plutôt que d'exister
  // comme cohorte fantôme, tant que la fusion ne dépasse pas MAX_COHORT_SIZE.
  if (chunks.length > 1) {
    const last = chunks[chunks.length - 1]
    const previous = chunks[chunks.length - 2]
    if (
      last.length < LEAGUE_RULES.MIN_VIABLE_COHORT_SIZE &&
      previous.length + last.length <= LEAGUE_RULES.MAX_COHORT_SIZE
    ) {
      chunks.splice(chunks.length - 1, 1)
      previous.push(...last)
    }
  }

  return chunks
}

/**
 * Construit les cohortes d'une semaine.
 *
 * Les candidats doivent avoir été filtrés en amont sur
 * `social_visibility = 'cohort'` : cette fonction ne fait aucun contrôle de
 * consentement.
 *
 * Déterministe à entrée égale (tri stable par `userId`), conformément à
 * `PROJECT_RULES.md` § 4.
 */
export function buildCohorts(candidates: readonly CohortCandidate[]): CohortAssignment[] {
  const byTier = new Map<LeagueTier, CohortCandidate[]>()
  for (const candidate of candidates) {
    const tier = LEAGUE_TIER_ORDER.includes(candidate.tier)
      ? candidate.tier
      : LEAGUE_TIER_ORDER[0]
    const group = byTier.get(tier)
    if (group) group.push(candidate)
    else byTier.set(tier, [candidate])
  }

  // Un palier trop peu peuplé fusionne vers le palier adjacent inférieur (ou
  // supérieur s'il est déjà au plus bas). Sans cette fusion, les premiers
  // utilisateurs d'un palier se retrouveraient seuls dans leur ligue.
  for (let i = 0; i < LEAGUE_TIER_ORDER.length; i++) {
    const tier = LEAGUE_TIER_ORDER[i]
    const group = byTier.get(tier)
    if (!group || group.length === 0 || group.length >= LEAGUE_RULES.MIN_VIABLE_COHORT_SIZE) {
      continue
    }

    const neighbourTiers = [
      ...LEAGUE_TIER_ORDER.slice(0, i).reverse(),
      ...LEAGUE_TIER_ORDER.slice(i + 1),
    ]
    const target = neighbourTiers.find((t) => (byTier.get(t)?.length ?? 0) > 0)
    if (!target) continue

    byTier.get(target)!.push(...group)
    byTier.delete(tier)
  }

  const assignments: CohortAssignment[] = []
  for (const tier of LEAGUE_TIER_ORDER) {
    const group = byTier.get(tier)
    if (!group || group.length === 0) continue
    for (const memberIds of chunkGroup(group)) {
      assignments.push({ tier, memberIds })
    }
  }
  return assignments
}

/** Snapshot d'une cohorte déjà en base pour un refill mid-week. */
export interface ExistingCohortSnapshot {
  cohortId: string
  tier: LeagueTier
  memberIds: string[]
}

export interface MidWeekAddition {
  cohortId: string
  userIds: string[]
}

export interface MidWeekMerge {
  fromCohortId: string
  toCohortId: string
  userIds: string[]
}

export interface MidWeekRefillPlan {
  /** Nouveaux opt-in à coller dans des cohortes déjà ouvertes. */
  additions: MidWeekAddition[]
  /** Reliquats qui ne rentrent nulle part → nouvelles cohortes. */
  newCohorts: CohortAssignment[]
  /** Fusion anti-solo : déplacer les membres d'une cohorte trop petite. */
  merges: MidWeekMerge[]
}

function sortCohortsForPlacement<
  T extends { cohortId: string; tier: LeagueTier; memberIds: string[] },
>(cohorts: readonly T[], preferredTier: LeagueTier): T[] {
  return [...cohorts].sort((a, b) => {
    const sameA = a.tier === preferredTier ? 0 : 1
    const sameB = b.tier === preferredTier ? 0 : 1
    if (sameA !== sameB) return sameA - sameB
    if (a.memberIds.length !== b.memberIds.length) {
      return a.memberIds.length - b.memberIds.length
    }
    return a.cohortId.localeCompare(b.cohortId)
  })
}

/**
 * Plan de refill mid-week : les cohortes du lundi restent, on y ajoute les
 * athlètes passés en `cohort` après le cron, et on fusionne les ligues solo
 * quand un absorbeur a de la place.
 *
 * Ne crée / ne détruit aucune ligne — le cron applique le plan. Déterministe
 * à entrée égale (`userId` / `cohortId` triés).
 */
export function planMidWeekRefill(
  existing: readonly ExistingCohortSnapshot[],
  unassigned: readonly CohortCandidate[],
): MidWeekRefillPlan {
  const cohorts = existing.map((c) => ({
    cohortId: c.cohortId,
    tier: LEAGUE_TIER_ORDER.includes(c.tier) ? c.tier : LEAGUE_TIER_ORDER[0],
    memberIds: [...c.memberIds],
    originalMemberIds: new Set(c.memberIds),
  }))

  const additionsMap = new Map<string, string[]>()
  const stillUnassigned: CohortCandidate[] = []

  const queue = [...unassigned].sort((a, b) => a.userId.localeCompare(b.userId))
  for (const candidate of queue) {
    const preferredTier = LEAGUE_TIER_ORDER.includes(candidate.tier)
      ? candidate.tier
      : LEAGUE_TIER_ORDER[0]
    const withRoom = sortCohortsForPlacement(
      cohorts.filter((c) => c.memberIds.length < LEAGUE_RULES.MAX_COHORT_SIZE),
      preferredTier,
    )
    const target = withRoom[0]
    if (!target) {
      stillUnassigned.push(candidate)
      continue
    }
    target.memberIds.push(candidate.userId)
    const list = additionsMap.get(target.cohortId) ?? []
    list.push(candidate.userId)
    additionsMap.set(target.cohortId, list)
  }

  let newCohorts = stillUnassigned.length > 0 ? buildCohorts(stillUnassigned) : []

  // Un reliquat trop petit rejoint une cohorte existante plutôt que de
  // créer une ligue fantôme à côté d'un tableau déjà ouvert.
  const keptNew: CohortAssignment[] = []
  for (const nc of newCohorts) {
    if (nc.memberIds.length >= LEAGUE_RULES.MIN_VIABLE_COHORT_SIZE) {
      keptNew.push(nc)
      continue
    }
    const absorber = sortCohortsForPlacement(
      cohorts.filter(
        (c) =>
          c.memberIds.length > 0 &&
          c.memberIds.length + nc.memberIds.length <= LEAGUE_RULES.MAX_COHORT_SIZE,
      ),
      nc.tier,
    )[0]
    if (!absorber) {
      keptNew.push(nc)
      continue
    }
    absorber.memberIds.push(...nc.memberIds)
    const list = additionsMap.get(absorber.cohortId) ?? []
    list.push(...nc.memberIds)
    additionsMap.set(absorber.cohortId, list)
  }
  newCohorts = keptNew

  const merges: MidWeekMerge[] = []
  const bySize = [...cohorts].sort(
    (a, b) =>
      a.memberIds.length - b.memberIds.length || a.cohortId.localeCompare(b.cohortId),
  )

  for (const tiny of bySize) {
    if (tiny.memberIds.length === 0) continue
    if (tiny.memberIds.length >= LEAGUE_RULES.MIN_VIABLE_COHORT_SIZE) continue

    const absorber = [...cohorts]
      .filter(
        (c) =>
          c.cohortId !== tiny.cohortId &&
          c.memberIds.length > 0 &&
          c.memberIds.length + tiny.memberIds.length <= LEAGUE_RULES.MAX_COHORT_SIZE,
      )
      .sort((a, b) => {
        const sameA = a.tier === tiny.tier ? 0 : 1
        const sameB = b.tier === tiny.tier ? 0 : 1
        if (sameA !== sameB) return sameA - sameB
        if (b.memberIds.length !== a.memberIds.length) {
          return b.memberIds.length - a.memberIds.length
        }
        return a.cohortId.localeCompare(b.cohortId)
      })[0]
    if (!absorber) continue

    const movingOriginal = tiny.memberIds.filter((id) => tiny.originalMemberIds.has(id))
    const movingAdded = tiny.memberIds.filter((id) => !tiny.originalMemberIds.has(id))

    if (movingAdded.length > 0) {
      const tinyAdds = additionsMap.get(tiny.cohortId) ?? []
      const remainingAdds = tinyAdds.filter((id) => !movingAdded.includes(id))
      if (remainingAdds.length === 0) additionsMap.delete(tiny.cohortId)
      else additionsMap.set(tiny.cohortId, remainingAdds)

      const absAdds = additionsMap.get(absorber.cohortId) ?? []
      absAdds.push(...movingAdded)
      additionsMap.set(absorber.cohortId, absAdds)
    }

    if (movingOriginal.length > 0) {
      merges.push({
        fromCohortId: tiny.cohortId,
        toCohortId: absorber.cohortId,
        userIds: [...movingOriginal].sort((a, b) => a.localeCompare(b)),
      })
    }

    absorber.memberIds.push(...tiny.memberIds)
    tiny.memberIds = []
  }

  const additions: MidWeekAddition[] = [...additionsMap.entries()]
    .map(([cohortId, userIds]) => ({
      cohortId,
      userIds: [...new Set(userIds)].sort((a, b) => a.localeCompare(b)),
    }))
    .filter((a) => a.userIds.length > 0)
    .sort((a, b) => a.cohortId.localeCompare(b.cohortId))

  merges.sort(
    (a, b) =>
      a.fromCohortId.localeCompare(b.fromCohortId) ||
      a.toCohortId.localeCompare(b.toCohortId),
  )

  return { additions, newCohorts, merges }
}
