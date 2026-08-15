/**
 * Deterministic explanation generator.
 *
 * Translates engine traces (rule IDs, contextual fields, warnings) into
 * user-facing coaching language. 100% pure — same input = same output.
 *
 * Sources:
 *  1. planningTrace.rulesApplied — stable `rule:*` / `anchor:*` ids → RULE_COPY
 *  2. Contextual fields — isMatchWeek, isDeloadWeek, fatigueLevel, etc.
 *  3. planningTrace.warnings — free-form human strings (included as-is)
 *  4. corrections — mapped to human descriptions
 */
import type { AnnualPlanningContext, OffSeasonPhase, PreSeasonPhase } from '../../types/annualPlanning'
import type {
  SchedulingMode,
  WeekCorrection,
  WeekExplanation,
  WeekExplanationDetail,
  WeekPresentation,
} from '../../types/scheduling'
import { clubContactLoadTip } from './clubContactProxy'

// ── Public interface ────────────────────────────────────────────────

export interface BuildExplanationParams {
  planningContext: AnnualPlanningContext
  schedulingMode: SchedulingMode
  presentation: WeekPresentation
  corrections: WeekCorrection[]
}

export function buildExplanation(params: BuildExplanationParams): WeekExplanation {
  const { planningContext: ctx, schedulingMode, corrections } = params

  // 1. Collect applicable explanations from rules + context
  const explanations = collectExplanations(ctx)

  // 2. Build summary from dominant explanation or sequential fallback
  const summaryLine = buildSummaryLine(explanations, ctx, schedulingMode, params.presentation)

  // 3. Build detail items (structured) + plain text lines (back-compat)
  const detailItems = buildDetailItems(explanations, ctx)
  const detailLines = detailItems.map((d) => d.text)

  // 4. Map corrections to human descriptions
  const correctionLines = corrections.map(formatCorrection)

  return {
    summaryLine,
    detailLines,
    detailItems,
    corrections: correctionLines,
  }
}

// ── Rule Copy Table ─────────────────────────────────────────────────

interface RuleCopy {
  summary: (ctx: AnnualPlanningContext) => string
  /** Returning `undefined` skips the detail line for this rule (ex: hint inadapté en off-season). */
  detail?: (ctx: AnnualPlanningContext) => string | undefined
  /** If true, this rule's summary overrides the generic sequential count wording. */
  overridesSequential?: boolean
}

/**
 * Maps real `rule:*` identifiers to user-facing copy.
 * Uses prefix matching: a rule `rule:treve_deep_detected` matches key `rule:treve_deep`.
 */
const RULE_COPY: Record<string, RuleCopy> = {
  'rule:in_season_from_calendar': {
    summary: (ctx) => ctx.daysUntilNextMatch != null
      ? `Programme adapté à ton match dans ${ctx.daysUntilNextMatch} jour${ctx.daysUntilNextMatch > 1 ? 's' : ''}`
      : 'Programme adapté à ton calendrier de matchs',
    detail: (ctx) => ctx.daysUntilNextMatch != null && ctx.daysUntilNextMatch <= 7
      ? 'Les séances sont organisées autour de ton prochain match pour optimiser ta préparation.'
      : 'Ton programme s\'aligne automatiquement sur tes matchs.',
  },

  'rule:pre_season_from_calendar': {
    summary: () => 'Préparation de saison',
    detail: () => 'Le programme construit ta base physique avant le début de la compétition.',
  },

  'rule:pre_season_anchored_return_to_team': {
    summary: () => 'Préparation de saison — retour au club',
    detail: () => 'Le programme s\'adapte à ta date de retour au collectif.',
  },

  'rule:pre_season_from_return_date': {
    summary: () => 'Pré-saison — préparation de ta reprise',
    detail: () => 'Programme de pré-saison calé sur ta date de retour au club. Force, puissance et conditionnement progressifs.',
    overridesSequential: true,
  },

  'rule:off_season_start_at': {
    summary: () => 'Inter-saison',
    detail: () => 'Pas de match prévu — le programme se concentre sur la construction physique.',
  },

  'rule:season_ended_force_off_season': {
    summary: () => 'Inter-saison — saison terminée',
    detail: () => 'Les 2 premières semaines sont consacrées à la récupération (décharge du système nerveux après la saison). Ensuite, le programme passera en construction physique.',
    overridesSequential: true,
  },

  'rule:auto_season_ended_28d': {
    summary: () => 'Inter-saison — saison terminée',
    detail: () => 'Aucun match depuis 4 semaines. Le programme passe en construction physique.',
    overridesSequential: true,
  },

  'rule:treve_deep': {
    summary: () => 'Pas de match — on profite pour travailler la force',
    detail: () => 'La trêve est une opportunité. Sans match à préparer, on peut charger un peu plus en force.',
    overridesSequential: true,
  },

  'rule:treve_return': {
    summary: () => 'Reprise progressive',
    detail: () => 'Ton programme te remet en route progressivement après la trêve.',
    overridesSequential: true,
  },

  'rule:treve_rampup': {
    summary: () => 'Reprise bientôt — préparation au retour',
    detail: () => 'Le match approche. Ton programme prépare ton retour au jeu.',
    overridesSequential: true,
  },

  'rule:end_of_season': {
    summary: () => 'Fin de saison — décompression',
    detail: () => 'Plus de match prévu : on relâche progressivement avant la coupure d\'inter-saison.',
    overridesSequential: true,
  },

  'rule:playoffs_taper': {
    summary: () => 'Phase finale — affûtage',
    detail: () => 'Le volume baisse pour que tu arrives frais et performant.',
    overridesSequential: true,
  },

  'rule:playoffs_match_week': {
    summary: () => 'Phase finale — semaine de match',
    detail: () => 'Semaine de match en phase finale. Activation légère uniquement.',
    overridesSequential: true,
  },

  'rule:manual_playoffs': {
    summary: () => 'Mode phase finale activé',
    detail: () => 'Le programme s\'adapte pour un affûtage optimal.',
    overridesSequential: true,
  },

  'rule:in_season_deload': {
    summary: () => 'Semaine de récupération',
    detail: () =>
      'Après 3 semaines de charge, on coupe ~40 % du volume (moins de blocs/tours) tout en gardant l’intensité — pour digérer et progresser.',
    overridesSequential: true,
  },

  'rule:onboarding_cycle_hint': {
    summary: () => 'Programme basé sur la période choisie à l\'inscription',
    // En off-season : pas de détail → la saison est terminée, rien à ajouter,
    // le programme est correct (hypertrophie/transition selon la phase).
    // En pre-season : pousser la date de reprise plutôt que les matchs.
    // En in-season : pousser les matchs pour caler la préparation.
    detail: (ctx) => {
      if (ctx.cycle === 'off_season') return undefined
      if (ctx.cycle === 'pre_season') return 'Renseigne ta date de reprise au club pour caler ton programme.'
      return 'Ajoute tes matchs pour un programme plus précis.'
    },
  },

  'rule:no_first_match_calendar': {
    summary: () => 'Aucun match renseigné — programme progressif',
    detail: (ctx) => {
      if (ctx.cycle === 'off_season') return undefined
      if (ctx.cycle === 'pre_season') return 'Renseigne ta date de reprise au club pour caler ton programme.'
      return 'Ajoute tes matchs dans le calendrier pour adapter ton programme automatiquement.'
    },
  },

  'rule:manual_off_season': {
    summary: () => 'Inter-saison',
    detail: () => 'Programme de construction physique en inter-saison.',
  },

  'rule:off_season_backfill': {
    summary: () => 'Inter-saison',
    detail: () => 'Le programme démarre en inter-saison en attendant plus de données.',
  },

  'rule:season_ended_next_monday': {
    summary: () => 'Transition vers l\'inter-saison',
    detail: () => 'La saison se termine. Le programme évolue vers la construction physique.',
    overridesSequential: true,
  },

  'rule:manual_cycle': {
    summary: () => 'Programme ajusté manuellement',
    detail: () => 'Le cycle a été configuré manuellement dans ton profil.',
  },

  'rule:manual_pre_season_week': {
    summary: () => 'Préparation de saison',
    detail: () => 'Semaine de pré-saison configurée manuellement.',
  },

  'rule:manual_off_season_week': {
    summary: () => 'Inter-saison',
    detail: () => 'Semaine d\'inter-saison configurée manuellement.',
  },

  'rule:off_season_after_last_match_before_pre': {
    summary: () => 'Inter-saison — avant la pré-saison',
    detail: () => 'Le programme te prépare avant le début de la pré-saison.',
  },

  'rule:off_season_start_reporting': {
    summary: () => 'Inter-saison',
    detail: () => 'Le programme démarre en inter-saison.',
  },

  'anchor:first_match_date_override': {
    summary: () => 'Programme aligné sur ta date de premier match',
    detail: () => 'Le calendrier est construit à partir de ta date de premier match.',
  },

  'anchor:off_season_start_at': {
    summary: () => 'Inter-saison — date configurée',
    detail: () => 'Le début de l\'inter-saison suit la date renseignée.',
  },

  'anchor:season_ended_at': {
    summary: () => 'Saison terminée',
    detail: () => 'La date de fin de saison a été confirmée.',
  },

  'anchor:return_to_team_training': {
    summary: () => 'Retour au collectif programmé',
    detail: () => 'Le programme s\'adapte à ta date de retour au club.',
  },
}

// ── Rule Matching ───────────────────────────────────────────────────

interface Explanation {
  summary: string
  detail?: string
  /** Rule id qui a produit l'explication (ex : 'rule:onboarding_cycle_hint', 'context:match_week'). */
  ruleId: string
  priority: number
  overridesSequential: boolean
}

function matchRule(ruleId: string): RuleCopy | undefined {
  // Exact match first
  if (RULE_COPY[ruleId]) return RULE_COPY[ruleId]

  // Prefix match: strip trailing specifics (e.g., rule:treve_deep_detected → rule:treve_deep)
  for (const key of Object.keys(RULE_COPY)) {
    if (ruleId.startsWith(key)) return RULE_COPY[key]
  }

  return undefined
}

function collectExplanations(ctx: AnnualPlanningContext): Explanation[] {
  const result: Explanation[] = []
  const seen = new Set<string>()

  // 1. From rulesApplied (highest priority)
  for (let i = 0; i < ctx.planningTrace.rulesApplied.length; i++) {
    const ruleId = ctx.planningTrace.rulesApplied[i]
    const copy = matchRule(ruleId)
    if (!copy) continue

    const summary = copy.summary(ctx)
    if (seen.has(summary)) continue
    seen.add(summary)

    result.push({
      summary,
      detail: copy.detail?.(ctx),
      ruleId,
      priority: i,
      overridesSequential: copy.overridesSequential ?? false,
    })
  }

  // 2. From contextual fields (lower priority than explicit rules)
  const basePriority = ctx.planningTrace.rulesApplied.length

  if (ctx.isMatchWeek && ctx.daysUntilNextMatch != null && !seen.has('match_context')) {
    const s = `Match dans ${ctx.daysUntilNextMatch} jour${ctx.daysUntilNextMatch > 1 ? 's' : ''}`
    if (!seen.has(s)) {
      seen.add(s)
      result.push({
        summary: s,
        detail: ctx.daysUntilNextMatch <= 2
          ? 'Séance légère pour arriver frais au match.'
          : 'Les séances s\'adaptent à la proximité du match.',
        ruleId: 'context:match_week',
        priority: basePriority,
        overridesSequential: false,
      })
    }
  }

  if (ctx.isDeloadWeek && !seen.has('Semaine de récupération')) {
    seen.add('Semaine de récupération')
    result.push({
      summary: 'Semaine de récupération',
      detail: 'Après 3 semaines de charge, on coupe ~40 % du volume (moins de blocs/tours) tout en gardant l’intensité — pour digérer et progresser.',
      ruleId: 'context:deload',
      priority: basePriority + 1,
      overridesSequential: true,
    })
  }

  if (ctx.fatigueLevel === 'very_high' && !seen.has('fatigue')) {
    seen.add('fatigue')
    result.push({
      summary: 'Volume réduit — fatigue élevée',
      detail: 'Quand la fatigue est élevée, on réduit le volume pour protéger ta récupération.',
      ruleId: 'context:fatigue_high',
      priority: basePriority + 2,
      overridesSequential: true,
    })
  }

  if (ctx.loadManagementOverride === 'recovery') {
    const s = 'Semaine de récupération forcée'
    if (!seen.has(s)) {
      seen.add(s)
      result.push({
        summary: s,
        detail: 'Le programme passe en mode récupération pour cette semaine.',
        ruleId: 'context:recovery_override',
        priority: basePriority + 3,
        overridesSequential: true,
      })
    }
  }

  // Long absence messaging → Score de forme (HomePage). Ne pas dupliquer ici.
  return result.sort((a, b) => a.priority - b.priority)
}

// ── Summary Line ────────────────────────────────────────────────────

const OFF_SEASON_PHASE_LABELS: Record<OffSeasonPhase, string> = {
  1: 'Récupération',
  2: 'Transition',
  3: 'Hypertrophie',
  4: 'Force-Puissance',
  5: 'Entretien',
}

const PRE_SEASON_PHASE_LABELS: Record<PreSeasonPhase, string> = {
  1: 'Force',
  2: 'Puissance',
  3: 'Puissance-Vitesse',
}

function buildSummaryLine(
  explanations: Explanation[],
  ctx: AnnualPlanningContext,
  schedulingMode: SchedulingMode,
  presentation: WeekPresentation,
): string {
  // Sequential mode: session-count oriented summary, unless a dominant constraint overrides
  if (schedulingMode === 'sequential') {
    // Surface dominant reason if it is structurally marked as overriding sequential wording
    const dominant = explanations[0]
    if (dominant?.overridesSequential) {
      return dominant.summary
    }
    const sessionCount = presentation.sessions.length
    const qualityLabel = getQualityLabel(ctx)
    if (qualityLabel) {
      return `${sessionCount} séance${sessionCount > 1 ? 's' : ''} ${qualityLabel} — à ton rythme`
    }
    return `${sessionCount} séance${sessionCount > 1 ? 's' : ''} cette semaine — fais-les à ton rythme`
  }

  // Calendar mode: use dominant explanation
  if (explanations.length > 0) {
    return explanations[0].summary
  }

  // Fallback
  const sessionCount = presentation.sessions.length
  return `${sessionCount} séance${sessionCount > 1 ? 's' : ''} prévue${sessionCount > 1 ? 's' : ''} cette semaine`
}

function getQualityLabel(ctx: AnnualPlanningContext): string | null {
  if (ctx.cycle === 'off_season' && ctx.offSeasonPhase) {
    return OFF_SEASON_PHASE_LABELS[ctx.offSeasonPhase]
  }
  if (ctx.cycle === 'pre_season' && ctx.preSeasonPhase) {
    return PRE_SEASON_PHASE_LABELS[ctx.preSeasonPhase]
  }
  return null
}

// ── Detail Lines ────────────────────────────────────────────────────

function buildDetailItems(
  explanations: Explanation[],
  ctx: AnnualPlanningContext,
): WeekExplanationDetail[] {
  const items: WeekExplanationDetail[] = []
  const seen = new Set<string>()

  for (const exp of explanations) {
    if (items.length >= 3) break
    if (exp.detail && !seen.has(exp.detail)) {
      seen.add(exp.detail)
      items.push({ ruleId: exp.ruleId, text: exp.detail })
    }
  }

  for (const warning of ctx.planningTrace.warnings) {
    if (items.length >= 3) break
    if (!isHumanFriendlyWarning(warning)) continue
    if (seen.has(warning)) continue
    seen.add(warning)
    items.push({ ruleId: 'warning', text: warning })
  }

  // Fillers (plafond 3) : contact (semaine de match) → Hu (pré/in) → cou (off).
  if (items.length < 3) {
    const tip = contactLoadTip(ctx)
    if (tip && !seen.has(tip)) {
      seen.add(tip)
      items.push({ ruleId: 'context:contact_load', text: tip })
    }
  }

  if (items.length < 3) {
    const tip = huPositionWorkloadTip(ctx)
    if (tip && !seen.has(tip)) {
      seen.add(tip)
      items.push({ ruleId: 'context:hu_position_workload', text: tip })
    }
  }

  if (items.length < 3) {
    const tip = neckTrainingTip(ctx)
    if (tip && !seen.has(tip)) {
      seen.add(tip)
      items.push({ ruleId: 'context:neck_training', text: tip })
    }
  }

  return items
}

/**
 * Charge de contact amateur (World Rugby → proxy, pas le rail 15 min pro).
 * Normal = semaine de match ; dur = même hors match ; léger = copy inverse si match.
 */
export function contactLoadTip(
  ctx: Pick<
    AnnualPlanningContext,
    'cycle' | 'isMatchWeek' | 'daysUntilNextMatch' | 'clubContactProxy'
  >,
): string | undefined {
  return clubContactLoadTip(ctx)
}

/**
 * Mini-rappel cou (Fownes-Walpole 2025). Off-season seulement : Hu ne s’affiche pas.
 */
export function neckTrainingTip(ctx: Pick<AnnualPlanningContext, 'cycle'>): string | undefined {
  if (ctx.cycle !== 'off_season') return undefined
  return 'Le cou se prépare aussi : 2–3 isométries courtes (pousser dans les mains, 3 directions) en fin d’Upper, sans harnais.'
}

/**
 * Insights charge par poste (Hu et al. 2024 — rugby union FR / période tactique).
 * Vulgarisé pour amateur : pas de jargon GPS.
 */
export function huPositionWorkloadTip(ctx: Pick<AnnualPlanningContext, 'cycle' | 'positionGroup'>): string | undefined {
  if (ctx.cycle !== 'pre_season' && ctx.cycle !== 'in_season') return undefined
  if (ctx.positionGroup === 'back_three') {
    return ctx.cycle === 'pre_season'
      ? 'Poste arrière : tu cumules souvent plus de course / intensité terrain que les avants — en pré-saison, laisse de la fraîcheur pour le club, la salle ne doit pas tout manger.'
      : 'Poste arrière : en général tu cumules plus de charge externe (distance / intensité) que les avants — garde du jus pour le club, la salle ne doit pas tout manger.'
  }
  // front_row
  return ctx.cycle === 'pre_season'
    ? 'Poste avant : le jour force, le ressenti (RPE) monte souvent plus haut que chez les arrières — en pré-saison, qualité d’exécution et récup avant le volume.'
    : 'Poste avant : le jour force, le RPE monte souvent plus haut que chez les arrières — privilégie la qualité d’exécution et la récup, pas le volume pour le volume.'
}

/** Patterns that indicate a warning is too technical for user-facing display. */
const TECHNICAL_PATTERNS = [
  /\bS\d+[–-]S\d+/,       // S1–S4 style references
  /\bISO\b/i,              // semaine ISO
  /\boff[-_]season\b/i,    // internal english term
  /\bpre[-_]season\b/i,    // internal english term
  /\bForce[-_]Bridge\b/i,  // internal label
  /\bbackfill\b/i,         // engine term
  /\brule:/,               // raw rule ids
  /\banchor:/,             // raw anchor ids
]

function isHumanFriendlyWarning(warning: string): boolean {
  // Must contain spaces (not a bare identifier)
  if (!warning.includes(' ')) return false
  // Must not match any technical pattern
  return !TECHNICAL_PATTERNS.some((p) => p.test(warning))
}

// ── Correction Formatting ───────────────────────────────────────────

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function formatCorrection(c: WeekCorrection): string {
  switch (c.type) {
    case 'reschedule':
      return c.toDay != null
        ? `Séance reportée à ${DAY_LABELS[c.toDay]}`
        : 'Séance reportée'
    case 'skip':
      return 'Séance passée'
    case 'unavailable_day':
      return c.toDay != null
        ? `${DAY_LABELS[c.toDay]} marqué indisponible`
        : 'Jour marqué indisponible'
    case 'fatigue':
      return 'Volume ajusté — fatigue signalée'
    case 'add_match':
      return 'Match ajouté — programme mis à jour'
    default:
      return 'Programme ajusté'
  }
}
