/**
 * Pure presentation helpers for reading enriched SessionLog entries.
 * Handles mixed legacy / mother-session logs without importing any engine code.
 */
import type { SessionLog, SessionType } from '../../types/training'
import { formatTitleFromMotherSessionId } from '../../components/motherSession/formatMotherSessionTitle'

// ── Display title ───────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  UPPER: 'Haut du Corps',
  LOWER: 'Bas du Corps',
  FULL: 'Corps Complet',
  CONDITIONING: 'Conditionnement',
  RECOVERY: 'Récupération',
}

/**
 * Détecte les anciens sessionLabel bruts (IDs techniques UPPER_SNAKE_CASE_V1).
 */
function isRawMotherSessionId(label: string): boolean {
  return /^[A-Z][A-Z0-9_]+_V\d+$/.test(label)
}

export function getSessionLogDisplayTitle(log: SessionLog): string {
  // Anciens logs avec IDs bruts : humaniser via motherSessionId
  if (log.motherSessionId && log.sessionLabel && isRawMotherSessionId(log.sessionLabel)) {
    return formatTitleFromMotherSessionId(log.motherSessionId, 'fr')
  }
  if (log.sessionLabel) return log.sessionLabel
  return SESSION_TYPE_LABELS[log.sessionType] ?? log.sessionType
}

// ── Display subtitle (week + date context) ──────────────────────────────────

export function getSessionLogDisplaySubtitle(log: SessionLog): string {
  const weekPart = getSessionLogPrimaryWeekLabel(log)
  const datePart = formatDateShort(log.dateISO)
  const cyclePart = getSessionLogCycleLabel(log)
  return cyclePart ? `${weekPart} · ${cyclePart} · ${datePart}` : `${weekPart} · ${datePart}`
}

// ── Source label / tone ─────────────────────────────────────────────────────

export function getSessionLogSourceLabel(log: SessionLog): string {
  return log.programSource === 'mother_session' ? 'Programme annuel' : 'Programme historique'
}

export function getSessionLogSourceTone(log: SessionLog): 'legacy' | 'mother_session' {
  return log.programSource === 'mother_session' ? 'mother_session' : 'legacy'
}

// ── Source badge styles ─────────────────────────────────────────────────────

export const SOURCE_BADGE_STYLES = {
  legacy: 'bg-blue-900/20 text-blue-400',
  mother_session: 'bg-emerald-900/20 text-emerald-400',
} as const

// ── Week identity ───────────────────────────────────────────────────────────

export function getSessionLogPrimaryWeekLabel(log: SessionLog): string {
  // Mother-session: annualWeekCode is the source of truth
  if (log.programSource === 'mother_session' && log.programContext?.annualWeekCode) {
    return log.programContext.annualWeekCode
  }
  // Legacy or old logs: classic week label
  if (log.week === 'DELOAD') return 'Décharge'
  return `S${log.week.replace('W', '').replace('H', '')}`
}

// ── Cycle label ─────────────────────────────────────────────────────────────

const CYCLE_LABELS: Record<string, string> = {
  off_season: 'Hors-saison',
  pre_season: 'Pré-saison',
  in_season: 'En saison',
  playoffs: 'Playoffs',
}

export function getSessionLogCycleLabel(log: SessionLog): string | null {
  const cycle = log.programContext?.cycle
  if (!cycle) return null
  return CYCLE_LABELS[cycle] ?? null
}

// ── Internal helpers ────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
