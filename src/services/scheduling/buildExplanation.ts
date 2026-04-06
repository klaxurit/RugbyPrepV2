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
  WeekPresentation,
} from '../../types/scheduling'

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
  const explanations = collectExplanations(ctx, schedulingMode)

  // 2. Build summary from dominant explanation or sequential fallback
  const summaryLine = buildSummaryLine(explanations, ctx, schedulingMode, params.presentation)

  // 3. Build detail lines from remaining explanations + warnings
  const detailLines = buildDetailLines(explanations, ctx)

  // 4. Map corrections to human descriptions
  const correctionLines = corrections.map(formatCorrection)

  return {
    summaryLine,
    detailLines,
    corrections: correctionLines,
  }
}

// ── Rule Copy Table ─────────────────────────────────────────────────

interface RuleCopy {
  summary: (ctx: AnnualPlanningContext) => string
  detail?: (ctx: AnnualPlanningContext) => string
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
    detail: () => 'Après 3 semaines d\'entraînement, une semaine plus légère permet à ton corps de s\'adapter et de progresser.',
    overridesSequential: true,
  },

  'rule:onboarding_cycle_hint': {
    summary: () => 'Programme basé sur la période choisie à l\'inscription',
    detail: () => 'Ajoute tes matchs pour un programme plus précis.',
  },

  'rule:no_first_match_calendar': {
    summary: () => 'Aucun match renseigné — programme progressif',
    detail: () => 'Ajoute tes matchs dans le calendrier pour adapter ton programme automatiquement.',
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

function collectExplanations(
  ctx: AnnualPlanningContext,
  _schedulingMode: SchedulingMode,
): Explanation[] {
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
        priority: basePriority,
        overridesSequential: false,
      })
    }
  }

  if (ctx.isDeloadWeek && !seen.has('Semaine de récupération')) {
    seen.add('Semaine de récupération')
    result.push({
      summary: 'Semaine de récupération',
      detail: 'Après 3 semaines d\'entraînement, une semaine plus légère permet à ton corps de s\'adapter.',
      priority: basePriority + 1,
      overridesSequential: true,
    })
  }

  if (ctx.fatigueLevel === 'very_high' && !seen.has('fatigue')) {
    seen.add('fatigue')
    result.push({
      summary: 'Volume réduit — fatigue élevée',
      detail: 'Quand la fatigue est élevée, on réduit le volume pour protéger ta récupération.',
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
        priority: basePriority + 3,
        overridesSequential: true,
      })
    }
  }

  // Long absence: 0 sessions in 28d with historical logs
  if (
    ctx.monitoringSnapshot?.completedSessionsLast7d === 0 &&
    ctx.monitoringSnapshot?.completedSessionsLast28d === 0 &&
    ctx.monitoringSnapshot?.hasHistoricalLogs === true
  ) {
    const s = 'Semaine de reprise progressive'
    if (!seen.has(s)) {
      seen.add(s)
      result.push({
        summary: s,
        detail: 'Après une pause, on reprend progressivement pour que tes muscles et tendons se réadaptent en sécurité.',
        priority: -1, // strictly before any rule-based (0+) or contextual explanation
        overridesSequential: true,
      })
    }
  }

  return result.sort((a, b) => a.priority - b.priority)
}

// ── Summary Line ────────────────────────────────────────────────────

const OFF_SEASON_PHASE_LABELS: Record<OffSeasonPhase, string> = {
  1: 'Récupération',
  2: 'Transition',
  3: 'Hypertrophie',
  4: 'Force-Puissance',
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

function buildDetailLines(
  explanations: Explanation[],
  ctx: AnnualPlanningContext,
): string[] {
  const lines: string[] = []

  // From explanations (up to 3 detail lines)
  for (const exp of explanations) {
    if (lines.length >= 3) break
    if (exp.detail) lines.push(exp.detail)
  }

  // From warnings (free-form human strings, append if room and human-safe)
  for (const warning of ctx.planningTrace.warnings) {
    if (lines.length >= 3) break
    if (!isHumanFriendlyWarning(warning)) continue
    if (!lines.includes(warning)) lines.push(warning)
  }

  return lines
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
