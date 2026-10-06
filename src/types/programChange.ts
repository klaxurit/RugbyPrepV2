/**
 * Program-change notification types — used by the Monday-morning blocking
 * modal that surfaces upcoming/active program shifts to the user.
 *
 * Trigger families:
 *   - cycle   : annual cycle change (off → pre → in)
 *   - phase   : mesocycle phase shift inside the current cycle
 *   - acwr    : acute:chronic workload ratio entered caution/danger/critical
 *   - match   : a match in the next 7 days reshapes the upcoming week
 *   - feature : one-shot produit (ex. variété in-season) — info, jamais devant match/cycle
 */

import type { FatigueLoadChoice, FatigueLoadZone } from '../services/program/fatigueLoadChoice'

export type ProgramChangeType = 'cycle' | 'phase' | 'acwr' | 'match' | 'feature'
export type ProgramChangeSeverity = 'info' | 'warning' | 'critical'

export interface ProgramChangeNotice {
  /** Stable id used for acknowledge/postpone state — encodes from→to and the effective date. */
  id: string
  type: ProgramChangeType
  severity: ProgramChangeSeverity
  title: string
  /** One-sentence summary used as the modal subtitle. */
  summary: string
  /** 2–4 short bullets describing concrete consequences for the upcoming week. */
  bullets: string[]
  /**
   * Whether the user can postpone this notice for 7 days. Only structural
   * transitions (cycle/phase) are postponable — ACWR and match notices are
   * informational so postponing is meaningless.
   */
  postponable: boolean
  /** YYYY-MM-DD of the day the program change actually applies. */
  effectiveDate: string
  /** Ratio ACWR brut (ex. 1.42) — affiché pour les notices `acwr`. */
  acwrRatio?: number | null
  /** Zone ACWR quand type === 'acwr'. */
  fatigueLoadZone?: FatigueLoadZone
  /** Fréquence hebdo pour filtrer les options (drop_session ≥ 3). */
  weeklyFrequency?: 2 | 3 | 4
  /** Défaut recommandé pour le sheet de choix. */
  defaultFatigueLoadChoice?: FatigueLoadChoice
}

export interface VisibleProgramChangeNotice extends ProgramChangeNotice {
  /**
   * True the first time the notice surfaces. False once postponed at least
   * once — at that point the secondary "Reporter" button is hidden.
   */
  canPostponeNow: boolean
}
