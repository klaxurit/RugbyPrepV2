/**
 * Detect upcoming or active program changes that warrant a Monday-morning
 * blocking notice. Pure function — no I/O, no React state.
 *
 * Compares the annual planning context for `today` vs. for `nextMonday` and
 * surfaces the highest-priority change among:
 *   - cycle change (off → pre → in)            [warning, postponable]
 *   - mesocycle phase shift                    [info,    postponable]
 *   - ACWR critical/danger zone                [critical, not postponable]
 *   - upcoming match within 7 days             [info,    not postponable]
 *
 * The caller (the React hook) is responsible for filtering against
 * acknowledged/postponed state.
 */

import type {
  AnnualCycle,
  AnnualPlanningContext,
  AthletePlanningInputs,
  OffSeasonPhase,
  PreSeasonPhase,
} from '../../types/annualPlanning'
import type { CalendarEvent } from '../../types/training'
import type { ACWRZone } from '../../hooks/useACWR'
import type { ProgramChangeNotice, ProgramChangeSeverity } from '../../types/programChange'
import { detectAnnualPlanningContext } from '../season/detectAnnualPlanningContext'

const SEVERITY_RANK: Record<ProgramChangeSeverity, number> = {
  info: 1,
  warning: 2,
  critical: 3,
}

const CYCLE_LABEL: Record<AnnualCycle, string> = {
  off_season: 'inter-saison',
  pre_season: 'pré-saison',
  in_season: 'en saison',
  playoffs: 'playoffs',
}

const OFF_SEASON_PHASE_LABEL: Record<OffSeasonPhase, string> = {
  1: 'Récupération',
  2: 'Transition',
  3: 'Hypertrophie',
  4: 'Force-Pont',
  5: 'Entretien',
}

const PRE_SEASON_PHASE_LABEL: Record<PreSeasonPhase, string> = {
  1: 'Phase générale',
  2: 'Phase spécifique',
  3: 'Affûtage',
}

export type DetectProgramChangeInputs = Omit<AthletePlanningInputs, 'today'> & {
  today: string
  acwrZone: ACWRZone | null
  /** Visible (non-hidden) calendar events. */
  calendarEvents: CalendarEvent[]
}

/** Add `days` to an ISO date string (YYYY-MM-DD). Pure local-date arithmetic. */
function addDaysIso(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Invalid date: ${iso}`)
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  date.setDate(date.getDate() + days)
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

/** Days until next Monday (1..7). If today IS Monday, returns 7 (next Monday). */
function daysUntilNextMonday(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Invalid date: ${iso}`)
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  const dow = date.getDay() // 0=Sun, 1=Mon, ...
  const delta = ((1 - dow + 7) % 7) || 7
  return delta
}

function safeDetect(inputs: AthletePlanningInputs): AnnualPlanningContext | null {
  try {
    return detectAnnualPlanningContext(inputs)
  } catch {
    return null
  }
}

function describeCycleChange(from: AnnualCycle, to: AnnualCycle): string[] {
  if (from === 'off_season' && to === 'pre_season') {
    return [
      'Travail de force et de puissance plus intense',
      'Volume légèrement réduit, charge plus lourde (4–5 reps)',
      'Première semaine = adaptation progressive',
    ]
  }
  if (from === 'pre_season' && to === 'in_season') {
    return [
      'Bascule sur le cycle de match (3 semaines + 1 décharge)',
      'Volume ajusté autour des matchs',
      'Maintien de la force, puissance prioritaire',
    ]
  }
  if (from === 'in_season' && to === 'off_season') {
    return [
      'Récupération active sur 1–2 semaines',
      'Volume réduit, intensité faible',
      'Reprise progressive de l\'hypertrophie ensuite',
    ]
  }
  if (from === 'in_season' && to === 'pre_season') {
    return [
      'Reprise structurée sur 6–12 semaines',
      'Force et puissance en montée progressive',
      'Programme calé sur ta date de premier match',
    ]
  }
  return [
    `Tu passes de ${CYCLE_LABEL[from]} à ${CYCLE_LABEL[to]}`,
    'Le programme s\'adapte automatiquement à ta nouvelle phase',
  ]
}

function buildCycleNotice(
  current: AnnualPlanningContext,
  next: AnnualPlanningContext,
  effectiveDate: string,
): ProgramChangeNotice | null {
  if (current.cycle === next.cycle) return null
  // Year-scoped id so the same transition is recognized across the whole
  // postpone window, even as `effectiveDate` (= next Monday) drifts day-by-day.
  const year = effectiveDate.slice(0, 4)
  return {
    id: `cycle:${current.cycle}_to_${next.cycle}:${year}`,
    type: 'cycle',
    severity: 'warning',
    title: `Tu démarres ${CYCLE_LABEL[next.cycle]} lundi`,
    summary: `Ton programme change de cycle : ${CYCLE_LABEL[current.cycle]} → ${CYCLE_LABEL[next.cycle]}.`,
    bullets: describeCycleChange(current.cycle, next.cycle),
    postponable: true,
    effectiveDate,
  }
}

function buildPhaseNotice(
  current: AnnualPlanningContext,
  next: AnnualPlanningContext,
  effectiveDate: string,
): ProgramChangeNotice | null {
  if (current.cycle !== next.cycle) return null

  const year = effectiveDate.slice(0, 4)

  if (current.cycle === 'off_season' && current.offSeasonPhase !== next.offSeasonPhase) {
    const fromPhase = current.offSeasonPhase
    const toPhase = next.offSeasonPhase
    if (!fromPhase || !toPhase) return null
    return {
      id: `phase:offseason_${fromPhase}_to_${toPhase}:${year}`,
      type: 'phase',
      severity: 'info',
      title: 'Nouvelle phase d\'inter-saison',
      summary: `Tu passes de la phase ${OFF_SEASON_PHASE_LABEL[fromPhase]} à ${OFF_SEASON_PHASE_LABEL[toPhase]}.`,
      bullets: phaseBullets('off_season', toPhase),
      postponable: true,
      effectiveDate,
    }
  }

  if (current.cycle === 'pre_season' && current.preSeasonPhase !== next.preSeasonPhase) {
    const fromPhase = current.preSeasonPhase
    const toPhase = next.preSeasonPhase
    if (!fromPhase || !toPhase) return null
    return {
      id: `phase:preseason_${fromPhase}_to_${toPhase}:${year}`,
      type: 'phase',
      severity: 'info',
      title: 'Nouvelle phase de pré-saison',
      summary: `Tu passes de ${PRE_SEASON_PHASE_LABEL[fromPhase]} à ${PRE_SEASON_PHASE_LABEL[toPhase]}.`,
      bullets: phaseBullets('pre_season', toPhase),
      postponable: true,
      effectiveDate,
    }
  }

  // In-season : signal a deload week (mesocycleWeek 4) entering, since that's the
  // most visible weekly change ("ah, semaine plus light, ok").
  if (current.cycle === 'in_season' && !current.isDeloadWeek && next.isDeloadWeek) {
    // Use the ISO-week of the effective Monday so successive deloads stay distinct.
    return {
      id: `phase:inseason_deload:${isoWeekKey(effectiveDate)}`,
      type: 'phase',
      severity: 'info',
      title: 'Semaine de décharge',
      summary: 'Cette semaine est la 4ᵉ du cycle 3:1 — volume et intensité réduits.',
      bullets: [
        '−40% de volume environ',
        'Charges plus légères, focus sur la qualité',
        'Permet de capitaliser sur les 3 semaines précédentes',
      ],
      postponable: true,
      effectiveDate,
    }
  }

  return null
}

function phaseBullets(cycle: AnnualCycle, phase: OffSeasonPhase | PreSeasonPhase): string[] {
  if (cycle === 'off_season') {
    switch (phase as OffSeasonPhase) {
      case 1:
        return [
          'Volume très bas, focus mobilité',
          'Récupération de la saison précédente',
          'Pas de charges lourdes',
        ]
      case 2:
        return [
          'Réintroduction progressive du tonnage',
          'Mouvements composés à charge modérée',
          'Préparation pour l\'hypertrophie',
        ]
      case 3:
        return [
          'Bloc principal de prise de muscle',
          'Séries 8–12 reps, volume élevé',
          'Tempo contrôlé',
        ]
      case 4:
        return [
          'Bascule sur la force',
          'Charges plus lourdes (4–6 reps)',
          'Pont vers la pré-saison',
        ]
      case 5:
        return [
          'Maintien acquis force/puissance',
          'Volume modéré, qualité prioritaire',
        ]
    }
  }
  if (cycle === 'pre_season') {
    switch (phase as PreSeasonPhase) {
      case 1:
        return [
          'Préparation générale (force, hypertrophie)',
          'Volume élevé, intensité modérée',
          'Construction des bases',
        ]
      case 2:
        return [
          'Préparation spécifique au rugby',
          'Puissance, plyo, contrastes',
          'Travail explosif',
        ]
      case 3:
        return [
          'Affûtage avant le premier match',
          'Volume réduit, intensité maintenue',
          'Récupération prioritaire',
        ]
    }
  }
  return []
}

function buildAcwrNotice(zone: ACWRZone | null, today: string): ProgramChangeNotice | null {
  if (zone !== 'critical' && zone !== 'danger') return null
  // Stable id per ISO week — re-shows next week if still in zone.
  const isoWeek = isoWeekKey(today)
  if (zone === 'critical') {
    return {
      id: `acwr:critical:${isoWeek}`,
      type: 'acwr',
      severity: 'critical',
      title: 'Charge d\'entraînement très élevée',
      summary: 'Ton ratio aigu/chronique est en zone critique. Le programme va réduire la charge cette semaine.',
      bullets: [
        '1 séance maximum cette semaine',
        'Privilégie mobilité et sommeil',
        'Reprise progressive la semaine prochaine',
      ],
      postponable: false,
      effectiveDate: today,
    }
  }
  return {
    id: `acwr:danger:${isoWeek}`,
    type: 'acwr',
    severity: 'warning',
    title: 'Charge d\'entraînement élevée',
    summary: 'Ton ratio aigu/chronique est en zone à risque. On retire une séance cette semaine.',
    bullets: [
      '−1 séance par rapport au programme prévu',
      'Garde de l\'intensité mais réduit le volume',
      'Surveille ton sommeil et tes courbatures',
    ],
    postponable: false,
    effectiveDate: today,
  }
}

function buildMatchNotice(events: CalendarEvent[], today: string): ProgramChangeNotice | null {
  const inSevenDays = addDaysIso(today, 7)
  const upcomingMatch = events.find(
    (e) => e.type === 'match' && e.date >= today && e.date <= inSevenDays,
  )
  if (!upcomingMatch) return null
  return {
    id: `match:${upcomingMatch.date}`,
    type: 'match',
    severity: 'info',
    title: 'Semaine de match',
    summary: `Match prévu le ${formatMatchDate(upcomingMatch.date)} — la semaine est calée pour arriver frais.`,
    bullets: [
      'Charge réduite à mesure qu\'on approche du match',
      'Dernière séance au moins 48h avant',
      'Mobilité et activation ajoutées',
    ],
    postponable: false,
    effectiveDate: today,
  }
}

function isoWeekKey(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  // Snap to Monday so all 7 days of the same week share the key.
  const dow = date.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + offset)
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

function formatMatchDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/**
 * Compute the highest-priority program-change notice for the given inputs.
 * Returns `null` when nothing notable is happening or when the planning
 * context cannot be resolved (missing season anchors, etc.).
 */
export function detectProgramChange(inputs: DetectProgramChangeInputs): ProgramChangeNotice | null {
  const { today, acwrZone, calendarEvents, ...rest } = inputs

  const baseInputs: AthletePlanningInputs = {
    ...rest,
    events: calendarEvents.map((e) => ({ date: e.date, type: e.type })),
    today,
  }

  const current = safeDetect(baseInputs)
  const nextMonday = addDaysIso(today, daysUntilNextMonday(today))
  const next = safeDetect({ ...baseInputs, today: nextMonday })

  const candidates: ProgramChangeNotice[] = []

  if (current && next) {
    const cycleNotice = buildCycleNotice(current, next, nextMonday)
    if (cycleNotice) candidates.push(cycleNotice)

    const phaseNotice = buildPhaseNotice(current, next, nextMonday)
    if (phaseNotice) candidates.push(phaseNotice)
  }

  const acwrNotice = buildAcwrNotice(acwrZone, today)
  if (acwrNotice) candidates.push(acwrNotice)

  const matchNotice = buildMatchNotice(calendarEvents, today)
  if (matchNotice) candidates.push(matchNotice)

  if (candidates.length === 0) return null
  candidates.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
  return candidates[0]
}
