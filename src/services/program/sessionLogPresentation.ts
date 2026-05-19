/**
 * Pure presentation helpers for reading enriched SessionLog entries.
 * Handles mixed legacy / mother-session logs without importing any engine code.
 */
import type { Lang } from '../../i18n/appLabels'
import { formatTitleFromMotherSessionId } from '../../components/motherSession/formatMotherSessionTitle'
import type { SessionLog, SessionType } from '../../types/training'

// ── Display title ───────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS_FR: Record<SessionType, string> = {
  UPPER: 'Haut du Corps',
  LOWER: 'Bas du Corps',
  FULL: 'Corps Complet',
  CONDITIONING: 'Conditionnement',
  RECOVERY: 'Récupération',
  ACTIVE_RECOVERY: 'Récupération active',
}

const SESSION_TYPE_LABELS_EN: Record<SessionType, string> = {
  UPPER: 'Upper Body',
  LOWER: 'Lower Body',
  FULL: 'Full Body',
  CONDITIONING: 'Conditioning',
  RECOVERY: 'Recovery',
  ACTIVE_RECOVERY: 'Active Recovery',
}

function sessionTypeDisplayLabel(sessionType: SessionType, lang: Lang): string {
  return lang === 'en' ? SESSION_TYPE_LABELS_EN[sessionType] : SESSION_TYPE_LABELS_FR[sessionType]
}

/**
 * Détecte les anciens sessionLabel bruts (IDs techniques UPPER_SNAKE_CASE_V1).
 */
function isRawMotherSessionId(label: string): boolean {
  return /^[A-Z][A-Z0-9_]+_V\d+$/.test(label)
}

export function getSessionLogDisplayTitle(log: SessionLog, lang: Lang = 'fr'): string {
  // Anciens logs avec IDs bruts : humaniser via motherSessionId
  if (log.motherSessionId && log.sessionLabel && isRawMotherSessionId(log.sessionLabel)) {
    return formatTitleFromMotherSessionId(log.motherSessionId, lang)
  }
  if (log.sessionLabel) return log.sessionLabel
  return sessionTypeDisplayLabel(log.sessionType, lang) ?? log.sessionType
}

// ── Display subtitle (week + date context) ──────────────────────────────────

export function getSessionLogDisplaySubtitle(log: SessionLog, lang: Lang = 'fr'): string {
  const weekPart = getSessionLogPrimaryWeekLabel(log, lang)
  const datePart = formatDateShort(log.dateISO, lang)
  const cyclePart = getSessionLogCycleLabel(log, lang)
  return cyclePart ? `${weekPart} · ${cyclePart} · ${datePart}` : `${weekPart} · ${datePart}`
}

// ── Source label / tone ─────────────────────────────────────────────────────

export function getSessionLogSourceLabel(log: SessionLog, lang: Lang = 'fr'): string {
  if (log.programSource === 'mother_session') {
    return lang === 'en' ? 'Annual program' : 'Programme annuel'
  }
  return lang === 'en' ? 'Legacy program' : 'Programme historique'
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

export function getSessionLogPrimaryWeekLabel(log: SessionLog, lang: Lang = 'fr'): string {
  // Mother-session: annualWeekCode is the source of truth
  if (log.programSource === 'mother_session' && log.programContext?.annualWeekCode) {
    return log.programContext.annualWeekCode
  }
  // Legacy or old logs: classic week label
  if (log.week === 'DELOAD') {
    return lang === 'en' ? 'Deload week' : 'Semaine légère'
  }
  const n = log.week.replace('W', '').replace('H', '')
  if (lang === 'en') return `Week ${n}`
  return `S${n}`
}

// ── Cycle label ─────────────────────────────────────────────────────────────

const CYCLE_LABELS_FR: Record<string, string> = {
  off_season: 'Inter-saison',
  pre_season: 'Pré-saison',
  in_season: 'En saison',
  playoffs: 'Playoffs',
}

const CYCLE_LABELS_EN: Record<string, string> = {
  off_season: 'Off-season',
  pre_season: 'Pre-season',
  in_season: 'In season',
  playoffs: 'Playoffs',
}

export function getSessionLogCycleLabel(log: SessionLog, lang: Lang = 'fr'): string | null {
  const cycle = log.programContext?.cycle
  if (!cycle) return null
  const table = lang === 'en' ? CYCLE_LABELS_EN : CYCLE_LABELS_FR
  return table[cycle] ?? null
}

// ── Internal helpers ────────────────────────────────────────────────────────

function formatDateShort(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
