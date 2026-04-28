/**
 * Helpers purs pour construire un SessionLog enrichi à partir d'une séance legacy ou mother-session.
 * Aucun side-effect — retourne un Omit<SessionLog, 'id'> prêt à être passé à addLog().
 */
import type {
  CycleWeek,
  FatigueStatus,
  SessionLog,
  SessionType,
} from '../../types/training'
import { formatTitleFromMotherSessionId } from '../../components/motherSession/formatMotherSessionTitle'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { BuiltSession } from './buildSessionFromRecipe'
import type { ResolvedMotherSessionSlot } from '../motherSession/resolveMotherSessionsForWeek'
import type { MotherSessionType } from '../../types/motherSession'

// ── SessionType mapping pour mother sessions ─────────────────────────────────

const MOTHER_SESSION_TYPE_MAP: Record<MotherSessionType, SessionType> = {
  lower: 'LOWER',
  upper: 'UPPER',
  full: 'FULL',
  full_light_primer: 'FULL',
  // speed_power → CONDITIONING (SessionType inclut ce type)
  speed_power: 'CONDITIONING',
}

export function mapMotherSessionType(msType: MotherSessionType): SessionType {
  return MOTHER_SESSION_TYPE_MAP[msType] ?? 'FULL'
}

// ── Builder legacy ───────────────────────────────────────────────────────────

export function buildLegacyProgramSessionLog(params: {
  dateISO: string
  week: CycleWeek
  fatigue: FatigueStatus
  notes?: string
  rpe?: number
  durationMin?: number
  sessionType: SessionType
  session: BuiltSession
}): Omit<SessionLog, 'id'> {
  const { dateISO, week, fatigue, notes, rpe, durationMin, sessionType, session } = params
  return {
    dateISO,
    week,
    sessionType,
    fatigue,
    notes,
    rpe,
    durationMin,
    programSource: 'legacy',
    legacyRecipeId: session.recipeId,
    sessionLabel: session.title,
  }
}

// ── annualWeekCode helper ─────────────────────────────────────────────────────

const CYCLE_PREFIX: Record<string, string> = {
  off_season: 'OFF',
  pre_season: 'PRE',
  in_season: 'IN',
  playoffs: 'PO',
}

/**
 * Code stable et lisible : OFF_S01, PRE_S12, IN_W03, PO_W01.
 * Utilise weekNumber du planningContext ; fallback "S00" si absent.
 */
export function buildAnnualWeekCode(
  cycle: AnnualPlanningContext['cycle'],
  weekNumber: number | undefined,
): string {
  const prefix = CYCLE_PREFIX[cycle] ?? 'UNK'
  const suffix = cycle === 'in_season' || cycle === 'playoffs' ? 'W' : 'S'
  const num = String(weekNumber ?? 0).padStart(2, '0')
  return `${prefix}_${suffix}${num}`
}

/**
 * Détermine un CycleWeek legacy-compatible depuis le contexte annuel.
 * Pour les mother sessions, la vraie identité de semaine est `programContext.annualWeekCode`.
 * Ce champ `week` n'est conservé que pour la compatibilité avec le moteur historique.
 */
function deriveLegacyWeek(ctx: AnnualPlanningContext): CycleWeek {
  if (ctx.isDeloadWeek) return 'DELOAD'
  // Tente un mapping déterministe du weekNumber en CycleWeek existant
  const n = ctx.weekNumber
  if (n != null && n >= 1 && n <= 8) return `W${n}` as CycleWeek
  return 'W1'
}

// ── Builder mother-session ───────────────────────────────────────────────────

export function buildMotherSessionProgramSessionLog(params: {
  dateISO: string
  fatigue: FatigueStatus
  notes?: string
  rpe?: number
  durationMin?: number
  tonnageKg?: number
  slot: ResolvedMotherSessionSlot
  planningContext: AnnualPlanningContext
  slotSignature?: string
}): Omit<SessionLog, 'id'> {
  const { dateISO, fatigue, notes, rpe, durationMin, tonnageKg, slot, planningContext, slotSignature } = params
  const msType = slot.session.metadata.sessionType
  const sessionType = mapMotherSessionType(msType)

  // week : compat legacy. Pour les mother sessions, la source de vérité est programContext.annualWeekCode.
  const week = deriveLegacyWeek(planningContext)

  return {
    dateISO,
    week,
    sessionType,
    fatigue,
    notes,
    rpe,
    durationMin,
    tonnageKg,
    programSource: 'mother_session',
    motherSessionId: slot.sessionId,
    sessionLabel: formatTitleFromMotherSessionId(slot.session.metadata.id, 'fr'),
    programContext: {
      cycle: planningContext.cycle,
      weekLabel: planningContext.weekLabel,
      variant: slot.variant ?? 'normal',
      maxBlocks: slot.maxBlocks,
      annualWeekNumber: planningContext.weekNumber,
      annualWeekCode: buildAnnualWeekCode(planningContext.cycle, planningContext.weekNumber),
      offSeasonPhase: planningContext.offSeasonPhase,
      preSeasonPhase: planningContext.preSeasonPhase,
    },
    slotSignature,
  }
}
