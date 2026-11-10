/**
 * Bypass joueur : volume « allégé » pour reprise / absence / ramp-up trêve.
 *
 * Ne touche pas aux rails (décharge 3:1, J-2 match, club dur).
 * Persist localStorage ; auto-retrait après 3 séances salle loggées ou 14 jours.
 */

import type { SessionLog } from '../../types/training'
import type { Lang } from '../../i18n/appLabels'
import { isRestartRampUpActive } from './restartRampUp'

export type VolumeLighteningReason = 'restart_ramp' | 'long_absence' | 'treve_rampup'

export interface VolumeConfidenceBypassDecision {
  activatedAt: string
  /** Raison principale affichée au moment du switch. */
  reason: VolumeLighteningReason
  /** Toutes les raisons actives à l'activation (diagnostic). */
  reasons: VolumeLighteningReason[]
}

export const VOLUME_CONFIDENCE_STORAGE_KEY = 'rf.volumeConfidenceBypass.v1'
export const VOLUME_CONFIDENCE_UPDATED_EVENT = 'rf:volume-confidence-updated'

/** Nombre de séances salle loggées après activation pour retirer le bypass. */
export const VOLUME_CONFIDENCE_GYM_LOGS_TO_CLEAR = 3

/** Durée max du bypass (jours), même sans logs. */
export const VOLUME_CONFIDENCE_MAX_DAYS = 14

const GYM_SESSION_TYPES = new Set(['UPPER', 'LOWER', 'FULL'])

type Persisted = VolumeConfidenceBypassDecision | null

function emitUpdated(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(VOLUME_CONFIDENCE_UPDATED_EVENT))
  } catch {
    /* ignore */
  }
}

export function readVolumeConfidenceBypass(): Persisted {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(VOLUME_CONFIDENCE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VolumeConfidenceBypassDecision
    if (!parsed?.activatedAt || !parsed?.reason) return null
    return parsed
  } catch {
    return null
  }
}

export function persistVolumeConfidenceBypass(
  decision: VolumeConfidenceBypassDecision,
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(VOLUME_CONFIDENCE_STORAGE_KEY, JSON.stringify(decision))
  } catch {
    return
  }
  emitUpdated()
}

export function clearVolumeConfidenceBypass(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(VOLUME_CONFIDENCE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  emitUpdated()
}

export function isGymSessionLog(log: Pick<SessionLog, 'sessionType'>): boolean {
  return GYM_SESSION_TYPES.has(log.sessionType)
}

/** Logs salle strictement après `activatedAt` (date ISO jour ou timestamp). */
export function countGymLogsSince(
  logs: Array<Pick<SessionLog, 'sessionType' | 'dateISO'>>,
  activatedAt: string,
): number {
  const activatedDay = activatedAt.slice(0, 10)
  return logs.filter((log) => {
    if (!isGymSessionLog(log)) return false
    const day = log.dateISO.slice(0, 10)
    return day >= activatedDay
  }).length
}

export function isVolumeConfidenceBypassExpired(
  decision: VolumeConfidenceBypassDecision,
  todayIso: string,
  logs: Array<Pick<SessionLog, 'sessionType' | 'dateISO'>>,
): boolean {
  const activated = new Date(decision.activatedAt)
  const today = new Date(`${todayIso}T12:00:00`)
  if (!Number.isNaN(activated.getTime())) {
    const ageDays = (today.getTime() - activated.getTime()) / 86_400_000
    if (ageDays >= VOLUME_CONFIDENCE_MAX_DAYS) return true
  }
  return (
    countGymLogsSince(logs, decision.activatedAt) >= VOLUME_CONFIDENCE_GYM_LOGS_TO_CLEAR
  )
}

/**
 * Lit le bypass et purge s'il a expiré. Retourne la décision active ou null.
 */
export function reconcileVolumeConfidenceBypass(
  todayIso: string,
  logs: Array<Pick<SessionLog, 'sessionType' | 'dateISO'>>,
): VolumeConfidenceBypassDecision | null {
  const decision = readVolumeConfidenceBypass()
  if (!decision) return null
  if (isVolumeConfidenceBypassExpired(decision, todayIso, logs)) {
    clearVolumeConfidenceBypass()
    return null
  }
  return decision
}

export function detectVolumeLighteningReasons(params: {
  profile: { trainingBaseline?: string | null; trainingBaselineSetAt?: string | null }
  today: string
  completedSessionsLast7d?: number
  completedSessionsLast28d?: number
  hasHistoricalLogs?: boolean
  inSeasonSubMode?: string | null
  isDeloadWeek?: boolean
}): VolumeLighteningReason[] {
  // Décharge 3:1 = rail — pas de bypass.
  if (params.isDeloadWeek) return []

  const reasons: VolumeLighteningReason[] = []
  if (
    isRestartRampUpActive(
      {
        trainingBaseline: params.profile.trainingBaseline as 'restart' | 'active' | 'peak' | undefined,
        trainingBaselineSetAt: params.profile.trainingBaselineSetAt,
      },
      new Date(`${params.today}T12:00:00`),
    )
  ) {
    reasons.push('restart_ramp')
  }

  if (
    params.hasHistoricalLogs === true &&
    params.completedSessionsLast7d === 0 &&
    params.completedSessionsLast28d === 0
  ) {
    reasons.push('long_absence')
  }

  if (params.inSeasonSubMode === 'treve_rampup') {
    reasons.push('treve_rampup')
  }

  return reasons
}

export function volumeLighteningReasonLabel(
  reason: VolumeLighteningReason,
  lang: Lang = 'fr',
): string {
  if (lang === 'en') {
    if (reason === 'restart_ramp') return 'Return-to-training ramp (volume cut for 2 weeks).'
    if (reason === 'long_absence') return 'Few gym sessions logged recently.'
    return 'Return after a break — lighter re-acclimation week.'
  }
  if (reason === 'restart_ramp') return 'Mode reprise : volume réduit sur 2 semaines.'
  if (reason === 'long_absence') return 'Peu de séances salle loggées récemment.'
  return 'Reprise après trêve : semaine allégée pour ré-acclimater.'
}

export function volumeConfidenceBannerCopy(
  reasons: VolumeLighteningReason[],
  lang: Lang = 'fr',
): { title: string; body: string; why: string; cta: string } {
  const primary = reasons[0] ?? 'long_absence'
  const why = reasons.map((r) => volumeLighteningReasonLabel(r, lang)).join(' ')
  if (lang === 'en') {
    return {
      title: 'Sessions are lightened',
      body: volumeLighteningReasonLabel(primary, 'en'),
      why,
      cta: 'Use full sessions',
    }
  }
  return {
    title: 'Séances allégées',
    body: volumeLighteningReasonLabel(primary, 'fr'),
    why,
    cta: 'Repasser en normal',
  }
}

export function volumeConfidenceActiveCopy(lang: Lang = 'fr'): {
  title: string
  body: string
  undo: string
} {
  if (lang === 'en') {
    return {
      title: 'Full sessions on',
      body: 'Match rails (J-2, deload) stay active.',
      undo: 'Back to lightened',
    }
  }
  return {
    title: 'Volume normal',
    body: 'Les rails match (J-2, décharge) restent actifs.',
    undo: 'Revenir à l’allégé',
  }
}
