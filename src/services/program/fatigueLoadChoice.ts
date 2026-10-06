/**
 * Décision joueur face à une zone ACWR caution / danger / critical.
 *
 * KB : load-budgeting.md (Gabbett 2016 — −20–30 % volume en caution ;
 * deload immédiat > 1.5), injury-prevention.md §3.2, recovery.md (autonomie
 * du joueur amateur). Plan A = choix explicite ; Plan B = gradation par zone,
 * persist semaine + undo 24 h, allègement via reduction_order / maxBlocks.
 */

import type { ResolvedMotherSessionSlot } from '../motherSession/resolveMotherSessionsForWeek'
import type { ACWRZone } from '../../hooks/useACWR'
import type { Lang } from '../../i18n/appLabels'

export type FatigueLoadZone = 'caution' | 'danger' | 'critical'
export type FatigueLoadChoice = 'self_manage' | 'lighten_volume' | 'drop_session'

export interface FatigueLoadDecision {
  weekKey: string
  zone: FatigueLoadZone
  choice: FatigueLoadChoice
  chosenAt: string
  acwrRatio?: number | null
}

export interface FatigueLoadChoiceOption {
  id: FatigueLoadChoice
  label: string
  description: string
  recommended?: boolean
  disabled?: boolean
  disabledReason?: string
}

export const FATIGUE_LOAD_DECISION_STORAGE_KEY = 'rf.fatigueLoadDecision.v1'
export const FATIGUE_LOAD_DECISION_UPDATED_EVENT = 'rf:fatigue-load-decision-updated'

const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000

type PersistedMap = Record<string, FatigueLoadDecision>

function isFatigueLoadZone(zone: ACWRZone | null | undefined): zone is FatigueLoadZone {
  return zone === 'caution' || zone === 'danger' || zone === 'critical'
}

/** Lundi ISO (YYYY-MM-DD) de la semaine contenant `iso`. */
export function isoWeekMondayKey(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  const dow = date.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + offset)
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

export function readFatigueLoadDecisions(): PersistedMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(FATIGUE_LOAD_DECISION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PersistedMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function readFatigueLoadDecisionForDay(todayIso: string): FatigueLoadDecision | null {
  const key = isoWeekMondayKey(todayIso)
  return readFatigueLoadDecisions()[key] ?? null
}

function writeDecisions(map: PersistedMap, weekKey: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FATIGUE_LOAD_DECISION_STORAGE_KEY, JSON.stringify(map))
  } catch {
    return
  }
  try {
    window.dispatchEvent(
      new CustomEvent(FATIGUE_LOAD_DECISION_UPDATED_EVENT, { detail: { weekKey } }),
    )
  } catch {
    /* ignore */
  }
}

export function persistFatigueLoadDecision(decision: FatigueLoadDecision): void {
  const map = readFatigueLoadDecisions()
  map[decision.weekKey] = decision
  writeDecisions(map, decision.weekKey)
}

/** Annule le choix de la semaine si encore dans la fenêtre 24 h. */
export function undoFatigueLoadDecision(
  todayIso: string,
  nowMs: number = Date.now(),
): boolean {
  const key = isoWeekMondayKey(todayIso)
  const map = readFatigueLoadDecisions()
  const current = map[key]
  if (!current) return false
  const chosenMs = Date.parse(current.chosenAt)
  if (!Number.isFinite(chosenMs) || nowMs - chosenMs > UNDO_WINDOW_MS) return false
  delete map[key]
  writeDecisions(map, key)
  return true
}

export function canUndoFatigueLoadDecision(
  todayIso: string,
  nowMs: number = Date.now(),
): boolean {
  const current = readFatigueLoadDecisionForDay(todayIso)
  if (!current) return false
  const chosenMs = Date.parse(current.chosenAt)
  return Number.isFinite(chosenMs) && nowMs - chosenMs <= UNDO_WINDOW_MS
}

/**
 * Options disponibles selon la zone (Plan B) et la fréquence.
 * - caution : self / lighten
 * - danger  : lighten / drop (≥3) / self
 * - critical : drop (≥3) ou lighten en défaut, self en opt-out explicite
 */
export function availableFatigueLoadChoices(
  zone: FatigueLoadZone,
  weeklyFrequency: 2 | 3 | 4,
): FatigueLoadChoice[] {
  const canDrop = weeklyFrequency >= 3
  switch (zone) {
    case 'caution':
      return ['self_manage', 'lighten_volume']
    case 'danger':
      return canDrop
        ? ['lighten_volume', 'drop_session', 'self_manage']
        : ['lighten_volume', 'self_manage']
    case 'critical':
      return canDrop
        ? ['drop_session', 'lighten_volume', 'self_manage']
        : ['lighten_volume', 'self_manage']
  }
}

export function defaultFatigueLoadChoice(
  zone: FatigueLoadZone,
  weeklyFrequency: 2 | 3 | 4,
): FatigueLoadChoice {
  const available = availableFatigueLoadChoices(zone, weeklyFrequency)
  if (zone === 'critical') {
    return available.includes('drop_session') ? 'drop_session' : 'lighten_volume'
  }
  if (zone === 'danger') return 'lighten_volume'
  return 'lighten_volume'
}

export function fatigueLoadChoiceOptions(
  zone: FatigueLoadZone,
  weeklyFrequency: 2 | 3 | 4,
  lang: Lang,
  acwrRatio?: number | null,
): FatigueLoadChoiceOption[] {
  const available = new Set(availableFatigueLoadChoices(zone, weeklyFrequency))
  const recommended = defaultFatigueLoadChoice(zone, weeklyFrequency)
  const ratioHint =
    acwrRatio != null && Number.isFinite(acwrRatio)
      ? lang === 'fr'
        ? ` Ratio ACWR ${acwrRatio.toFixed(2)}.`
        : ` ACWR ratio ${acwrRatio.toFixed(2)}.`
      : ''

  const catalog: FatigueLoadChoiceOption[] = [
    {
      id: 'self_manage',
      label: lang === 'fr' ? 'Je gère' : 'I’ll manage',
      description:
        lang === 'fr'
          ? `Programme inchangé — tu allèges toi-même si besoin (RPE, sommeil).${ratioHint}`
          : `Program unchanged — you self-regulate if needed (RPE, sleep).${ratioHint}`,
    },
    {
      id: 'lighten_volume',
      label: lang === 'fr' ? 'Alléger les séances' : 'Lighten sessions',
      description:
        lang === 'fr'
          ? '−20–30 % de volume (séries / blocs) — mêmes séances Lower / Upper / Primer.'
          : '−20–30% volume (sets / blocks) — same Lower / Upper / Primer sessions.',
    },
    {
      id: 'drop_session',
      label: lang === 'fr' ? 'Retirer 1 séance' : 'Drop 1 session',
      description:
        lang === 'fr'
          ? 'Retire le Primer (ou la dernière séance) — garde Lower + Upper cohérents.'
          : 'Drops Primer (or last session) — keeps coherent Lower + Upper.',
      disabled: weeklyFrequency < 3,
      disabledReason:
        lang === 'fr'
          ? 'Disponible à partir de 3 séances / semaine.'
          : 'Available from 3 sessions / week.',
    },
  ]

  return catalog
    .filter((opt) => available.has(opt.id) || opt.id === 'drop_session')
    .map((opt) => ({
      ...opt,
      recommended: opt.id === recommended,
      disabled: opt.disabled || !available.has(opt.id),
    }))
    .filter((opt) => available.has(opt.id))
}

/**
 * Texte de confirmation juste avant d’appliquer un choix ACWR
 * (KB load-budgeting / injury-prevention §3.2).
 */
export function fatigueLoadChoiceConfirmation(
  choice: FatigueLoadChoice,
  lang: Lang,
): { title: string; body: string } {
  if (lang === 'en') {
    switch (choice) {
      case 'self_manage':
        return {
          title: 'Keep the full program?',
          body:
            'Your load is elevated. The week stays as planned — you’ll self-regulate (RPE, sleep, soreness). Injury risk stays higher than if we lighten or drop a session.',
        }
      case 'lighten_volume':
        return {
          title: 'Lighten all sessions (−20–30%)?',
          body:
            'Same Lower / Upper / Primer structure, fewer sets and blocks (quality over quantity). Science-backed for ACWR caution/danger (Gabbett 2016). Reversible next ISO week.',
        }
      case 'drop_session':
        return {
          title: 'Drop 1 session this week?',
          body:
            'We’ll remove Primer (or the last session) and keep Lower + Upper. Strongest protection when ACWR is high — for this week only; next week resets unless load is still elevated.',
        }
    }
  }
  switch (choice) {
    case 'self_manage':
      return {
        title: 'Garder le programme intact ?',
        body:
          'Ta charge est élevée. La semaine reste telle quelle — tu t’autorégules (RPE, sommeil, courbatures). Le risque blessure reste plus haut qu’avec un allègement ou −1 séance.',
      }
    case 'lighten_volume':
      return {
        title: 'Alléger toutes les séances (−20–30 %) ?',
        body:
          'Même structure Lower / Upper / Primer, moins de séries et de blocs (qualité avant quantité). Aligné sur la zone caution/danger ACWR (Gabbett 2016). Valable pour cette semaine ISO.',
      }
    case 'drop_session':
      return {
        title: 'Retirer 1 séance cette semaine ?',
        body:
          'On retire le Primer (ou la dernière séance) et on garde Lower + Upper. Protection la plus nette quand l’ACWR est haut — pour cette semaine seulement ; la suivante repart à zéro sauf si la charge reste élevée.',
      }
  }
}

export function resolveFatigueLoadZone(
  zone: ACWRZone | null | undefined,
): FatigueLoadZone | null {
  return isFatigueLoadZone(zone) ? zone : null
}

/** Index de la séance à retirer (Primer / pre_match / late_week / optional / last). */
export function findDropSessionIndex(sessions: ResolvedMotherSessionSlot[]): number {
  if (sessions.length === 0) return -1
  const byPref = sessions.findIndex((s) => s.dayPreference === 'pre_match')
  if (byPref >= 0) return byPref
  const byPrimer = sessions.findIndex((s) => /PRIMER/i.test(s.sessionId))
  if (byPrimer >= 0) return byPrimer
  const byLate = sessions.findIndex((s) => s.dayPreference === 'late_week')
  if (byLate >= 0) return byLate
  const byOptional = sessions.findIndex((s) => s.role === 'optional')
  if (byOptional >= 0) return byOptional
  return sessions.length - 1
}

/**
 * Allège une séance (~20–30 % volume) via `variant: light` + `maxBlocks`
 * (consommé par truncateSessionBlocks / reduction_order).
 */
export function lightenResolvedSlot(slot: ResolvedMotherSessionSlot): ResolvedMotherSessionSlot {
  const blockCount = slot.session.blocks.length
  const reduced =
    blockCount >= 3 ? Math.max(2, blockCount - 1) : blockCount >= 2 ? blockCount : undefined
  const maxBlocks =
    reduced == null
      ? slot.maxBlocks
      : slot.maxBlocks != null
        ? Math.min(slot.maxBlocks, reduced)
        : reduced
  return {
    ...slot,
    variant: 'light',
    maxBlocks,
  }
}

export interface ApplyFatigueLoadChoiceResult {
  sessions: ResolvedMotherSessionSlot[]
  warnings: string[]
  applied: FatigueLoadChoice
}

export function applyFatigueLoadChoiceToSessions(
  sessions: ResolvedMotherSessionSlot[],
  choice: FatigueLoadChoice,
): ApplyFatigueLoadChoiceResult {
  if (choice === 'self_manage') {
    return { sessions, warnings: [], applied: choice }
  }

  if (choice === 'lighten_volume') {
    return {
      sessions: sessions.map(lightenResolvedSlot),
      warnings: [
        'Charge élevée — volume réduit (−20–30 %) sur les séances conservées (qualité prioritaire).',
      ],
      applied: choice,
    }
  }

  // drop_session
  if (sessions.length < 3) {
    const lightened = applyFatigueLoadChoiceToSessions(sessions, 'lighten_volume')
    return {
      ...lightened,
      warnings: [
        'Moins de 3 séances : retrait impossible — allègement volume à la place.',
        ...lightened.warnings,
      ],
      applied: 'lighten_volume',
    }
  }

  const dropIndex = findDropSessionIndex(sessions)
  const dropped = sessions[dropIndex]
  const kept = sessions.filter((_, i) => i !== dropIndex)
  return {
    sessions: kept,
    warnings: [
      `Séance retirée pour protéger la charge : ${dropped?.sessionId ?? 'session'}.`,
    ],
    applied: 'drop_session',
  }
}

/**
 * Fatigue effective pour les templates hebdo quand un choix joueur est connu.
 * - self_manage → normal (le joueur assume)
 * - very_high sans recovery auto → high (primer allégé, pas swap récup)
 */
export function effectiveFatigueLevelForTemplates(
  fatigueLevel: 'normal' | 'high' | 'very_high',
  choice: FatigueLoadChoice | null | undefined,
): 'normal' | 'high' | 'very_high' {
  if (choice === 'self_manage') return 'normal'
  if (fatigueLevel === 'very_high') return 'high'
  return fatigueLevel
}
