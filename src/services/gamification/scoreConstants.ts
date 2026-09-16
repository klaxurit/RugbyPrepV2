/**
 * Barème de la gamification.
 *
 * Règle d'or : **aucune constante ne rémunère le volume**. Les seuls termes
 * qui augmentent avec l'activité sont `PLANNED_SESSION` (borné par le plan de
 * l'athlète) et `OFF_PLAN_SESSION` (borné à une séance par semaine, annulé en
 * surcharge). Tout le reste rémunère la conformité, le repos prescrit et la
 * régularité.
 *
 * Toute évolution de ce barème doit préserver cette propriété, sans quoi le
 * système devient un incitatif à la surcharge — cf. Gabbett (2016) et
 * `src/knowledge/load-budgeting.md`.
 */
export const SCORE_POINTS = {
  /** Séance prévue au programme et complétée. */
  PLANNED_SESSION: 20,
  /** Séance ajoutée hors programme. Une seule créditée par semaine. */
  OFF_PLAN_SESSION: 8,
  /** Jour de repos prescrit effectivement respecté. */
  PRESCRIBED_REST: 10,
  /** Plan de la semaine intégralement tenu. */
  FULL_PLAN_BONUS: 25,
  /** RPE et durée renseignés sur toutes les séances de la semaine. */
  LOG_QUALITY_BONUS: 5,
  /** Par semaine consécutive tenue, jusqu'à `MAX_STREAK_WEEKS_COUNTED`. */
  PER_STREAK_WEEK: 5,
} as const

export const SCORE_CAPS = {
  /** Séances hors plan créditées par semaine. */
  OFF_PLAN_SESSIONS_PER_WEEK: 1,
  /** Jours de repos prescrits crédités par semaine. */
  PRESCRIBED_REST_PER_WEEK: 2,
  /** Plafond du bonus de régularité, en semaines. */
  MAX_STREAK_WEEKS_COUNTED: 5,
  /**
   * Plafond dur du nombre de séances qu'une semaine peut déclarer comme
   * prévues. Empêche un client compromis de gonfler `sessionsPlanned` pour
   * récolter des points de conformité.
   */
  MAX_PLANNED_SESSIONS_PER_WEEK: 7,
} as const

/** Seuils d'XP cumulée par niveau. Ordre croissant obligatoire. */
export const LEVEL_THRESHOLDS = [
  { level: 'espoir', minXp: 0 },
  { level: 'titulaire', minXp: 400 },
  { level: 'cadre', minXp: 1200 },
  { level: 'capitaine', minXp: 2600 },
  { level: 'legende', minXp: 5000 },
] as const

/** Ordre des paliers de ligue, du plus bas au plus haut. */
export const LEAGUE_TIER_ORDER = [
  'reserve',
  'espoirs',
  'premiere',
  'federale',
  'elite',
] as const

export const LEAGUE_RULES = {
  /** Cible de remplissage d'une cohorte. */
  TARGET_COHORT_SIZE: 24,
  /** Taille maximale avant scission. */
  MAX_COHORT_SIZE: 30,
  /**
   * En dessous de ce nombre, la cohorte n'est pas viable et fusionne avec la
   * cohorte adjacente — sans quoi la compétition n'a pas d'adversaires.
   */
  MIN_VIABLE_COHORT_SIZE: 6,
  /** Promus par cohorte de taille cible. */
  PROMOTED_AT_TARGET_SIZE: 5,
  /** Relégués par cohorte de taille cible. */
  RELEGATED_AT_TARGET_SIZE: 5,
} as const

export const NUDGE_RULES = {
  /** Interruptions sociales par ouverture d'application. */
  MAX_PER_APP_OPEN: 1,
  /** Interruptions sociales par semaine glissante. */
  MAX_PER_WEEK: 2,
  /** Durée de vie d'un nudge non consommé, en heures. */
  TTL_HOURS: 48,
} as const
