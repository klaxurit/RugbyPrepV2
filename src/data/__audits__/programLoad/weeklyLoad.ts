/**
 * Audit de charge hebdomadaire cumulée.
 *
 * Les audits existants raisonnent séance par séance. Or l'athlète encaisse une
 * SEMAINE : c'est la somme Lower + Upper + Full (+ Speed) qui détermine si le
 * bloc est tenable. Ce module assemble les semaines réelles via
 * `getWeeklyTemplate` et compte ce qui fait mal.
 *
 * Repères (src/knowledge/load-budgeting.md, strength-methods.md) :
 *   - blocs de contraste : 2-4/sem maximum (charge neurale)
 *   - séries ischios : 8-14/sem, moins quand du sprint maximal est programmé
 *
 * `hardSets` reste exposé à titre descriptif mais n'est plus un critère : il
 * agrège tous les groupes musculaires et masque les déséquilibres. Le dosage
 * se juge dans `muscleVolume.ts`.
 */

import { MOTHER_SESSIONS } from '../../motherSessions.generated'
import { getWeeklyTemplate, type GetWeeklyTemplateParams } from '../../weeklyTemplates'
import { mapMotherSessionIdForEquipment } from '../../../services/equipment/motherSessionEquipmentMap'
import { parseBlockTourCount, parseExerciseSets } from '../../../services/ui/blockPresentation'
import type { Block, MotherSession } from '../../../types/motherSession'
import type { Equipment } from '../../../types/training'
import { inferBlockIntent } from '../restTimes/inferBlockIntent'
import type { Intent } from '../restTimes/kbRanges'

const BY_ID: Record<string, MotherSession> = Object.fromEntries(
  MOTHER_SESSIONS.map((s) => [s.metadata.id, s]),
)

/**
 * Intents qui comptent comme volume « dur ».
 * Prévention, gainage, finisher et récompense sont exclus : ils ne pilotent pas
 * la fatigue structurelle et les séances prévoient déjà de les couper en premier.
 */
const HARD_INTENTS: ReadonlySet<Intent> = new Set<Intent>([
  'force',
  'power_contrast',
  'dynamic',
  'hypertrophy',
  'dup_endurance',
])

/** Mouvements balistiques / pliométriques (charge neurale et articulaire). */
const BALLISTIC_RE =
  /jump|throw|plyo|slam|swing|bound|hop|chest pass|sprint|acceleration|clean|snatch|jammer|scoop|skip/i

/** Mouvements chargeant significativement la chaîne postérieure ischios. */
const HAMSTRING_RE =
  /nordic|rdl|romanian|deadlift|leg curl|good ?morning|kickstand|glute bridge|hip thrust|ham/i

/** Nombre de séries effectives d'un exercice dans un bloc. */
function setsForExercise(prescription: string, block: Block): number {
  return parseExerciseSets(prescription) ?? parseBlockTourCount(block)
}

export interface SessionLoad {
  sessionId: string
  found: boolean
  hardSets: number
  ballisticSets: number
  hamstringSets: number
  contrastBlocks: number
}

export function auditSessionLoad(sessionId: string): SessionLoad {
  const session = BY_ID[sessionId]
  if (!session) {
    return {
      sessionId,
      found: false,
      hardSets: 0,
      ballisticSets: 0,
      hamstringSets: 0,
      contrastBlocks: 0,
    }
  }

  let hardSets = 0
  let ballisticSets = 0
  let hamstringSets = 0
  let contrastBlocks = 0

  for (const block of session.blocks) {
    const intent = inferBlockIntent(block, session)
    if (intent === 'power_contrast') contrastBlocks += 1
    const isHard = HARD_INTENTS.has(intent)

    for (const exercise of block.exercises) {
      const sets = setsForExercise(exercise.prescription, block)
      if (isHard) hardSets += sets
      if (BALLISTIC_RE.test(exercise.name)) ballisticSets += sets
      if (HAMSTRING_RE.test(exercise.name)) hamstringSets += sets
    }
  }

  return { sessionId, found: true, hardSets, ballisticSets, hamstringSets, contrastBlocks }
}

export interface WeekLoadRow {
  /** Clé lisible et stable, utilisable comme entrée d'allowlist. */
  key: string
  cycle: GetWeeklyTemplateParams['cycle']
  equipment: 'gym' | 'bodyweight'
  sessionIds: string[]
  hardSets: number
  ballisticSets: number
  hamstringSets: number
  contrastBlocks: number
  /** Séances référencées par le template mais absentes du dataset. */
  missingSessionIds: string[]
}

function weekKey(params: GetWeeklyTemplateParams, equipment: 'gym' | 'bodyweight'): string {
  return [
    equipment,
    params.cycle,
    params.phase != null ? `p${params.phase}` : '',
    params.offSeasonPhase != null ? `off${params.offSeasonPhase}` : '',
    `f${params.frequency}`,
    params.positionGroup,
    params.matchContext ?? '',
  ]
    .filter(Boolean)
    .join('|')
}

/** Toutes les combinaisons de semaine servies par le moteur de templates. */
export function buildWeekParams(): GetWeeklyTemplateParams[] {
  const out: GetWeeklyTemplateParams[] = []
  for (const positionGroup of ['front_row', 'back_three'] as const) {
    for (const frequency of [2, 3, 4] as const) {
      for (const phase of [1, 2, 3] as const) {
        out.push({ cycle: 'pre_season', phase, frequency, positionGroup })
      }
      for (const offSeasonPhase of [1, 2, 3, 4, 5] as const) {
        out.push({ cycle: 'off_season', offSeasonPhase, frequency, positionGroup })
      }
      for (const matchContext of ['match_week', 'no_match_week'] as const) {
        out.push({ cycle: 'in_season', frequency, positionGroup, matchContext })
      }
    }
  }
  return out
}

export function auditWeeklyLoad(equipmentProfile?: Equipment[]): WeekLoadRow[] {
  const label: 'gym' | 'bodyweight' = equipmentProfile ? 'bodyweight' : 'gym'
  const rows: WeekLoadRow[] = []
  const seen = new Set<string>()

  for (const params of buildWeekParams()) {
    let template
    try {
      template = getWeeklyTemplate(params)
    } catch {
      // Combinaison non servie (ex. in-season 4×) — hors périmètre de cet audit.
      continue
    }

    const sessionIds = template.sessions.map((s) =>
      mapMotherSessionIdForEquipment(s.sessionId, equipmentProfile),
    )

    // Deux combinaisons de paramètres peuvent produire exactement la même
    // semaine (une fréquence 4 qui dégrade en 3, deux postes qui partagent la
    // base commune). On n'audite chaque semaine réelle qu'une fois.
    const signature = `${label}|${params.cycle}|${sessionIds.join('+')}`
    if (seen.has(signature)) continue
    seen.add(signature)

    const key = weekKey(params, label)
    const loads = sessionIds.map((id) => auditSessionLoad(id))

    rows.push({
      key,
      cycle: params.cycle,
      equipment: label,
      sessionIds,
      hardSets: loads.reduce((acc, l) => acc + l.hardSets, 0),
      ballisticSets: loads.reduce((acc, l) => acc + l.ballisticSets, 0),
      hamstringSets: loads.reduce((acc, l) => acc + l.hamstringSets, 0),
      contrastBlocks: loads.reduce((acc, l) => acc + l.contrastBlocks, 0),
      missingSessionIds: loads.filter((l) => !l.found).map((l) => l.sessionId),
    })
  }

  return rows
}

export interface LoadBudget {
  maxContrastBlocks: number
  maxHamstringSets: number
}

/**
 * Plafonds de charge neurale et de sollicitation ischios.
 *
 * Ces deux dimensions relèvent du risque, pas du dosage : un bloc de contraste
 * coûte cher au système nerveux et les ischios sont la première blessure du
 * rugbyman. Le dosage du volume, lui, se juge par groupe musculaire dans
 * `muscleVolume.ts` — un total de séries toutes zones confondues ne permet pas
 * de dire si un muscle en reçoit assez.
 */
export const LOAD_BUDGETS: Record<GetWeeklyTemplateParams['cycle'], LoadBudget> = {
  // Hors saison : le bloc hypertrophie doit pouvoir viser le MEV ischios
  // (~10 séries fractionnelles) sans être bloqué par un plafond de risque calé
  // trop bas. 16 laisse de la marge pour nordics + hinge sans ouvrir la porte
  // à un vrai empilement.
  off_season: { maxContrastBlocks: 4, maxHamstringSets: 16 },
  pre_season: { maxContrastBlocks: 4, maxHamstringSets: 14 },
  in_season: { maxContrastBlocks: 4, maxHamstringSets: 14 },
}

export interface BudgetBreach {
  key: string
  metric: 'contrastBlocks' | 'hamstringSets'
  value: number
  budget: number
  sessionIds: string[]
}

export function findBudgetBreaches(rows: WeekLoadRow[]): BudgetBreach[] {
  const breaches: BudgetBreach[] = []
  for (const row of rows) {
    const budget = LOAD_BUDGETS[row.cycle]
    if (row.contrastBlocks > budget.maxContrastBlocks) {
      breaches.push({
        key: row.key,
        metric: 'contrastBlocks',
        value: row.contrastBlocks,
        budget: budget.maxContrastBlocks,
        sessionIds: row.sessionIds,
      })
    }
    if (row.hamstringSets > budget.maxHamstringSets) {
      breaches.push({
        key: row.key,
        metric: 'hamstringSets',
        value: row.hamstringSets,
        budget: budget.maxHamstringSets,
        sessionIds: row.sessionIds,
      })
    }
  }
  return breaches
}

export function formatBreach(b: BudgetBreach): string {
  return `${b.key} — ${b.metric} ${b.value} > ${b.budget} (${b.sessionIds.join(' + ')})`
}
