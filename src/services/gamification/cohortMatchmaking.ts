import type { LeagueTier } from '../../types/gamification'
import { LEAGUE_RULES, LEAGUE_TIER_ORDER } from './scoreConstants'

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
