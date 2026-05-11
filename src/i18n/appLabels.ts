/**
 * Centralized UI labels for the app shell (HomePage / WeekPage / SessionDetail /
 * Onboarding / Profile / etc.). Pattern aligné avec `motherSessionLabels.ts` :
 * `Record<key, { fr, en }>`. Pas de dépendance externe (i18next overkill ici).
 *
 * Usage :
 *   import { tr } from '../i18n/appLabels'
 *   tr('block_state_pending', lang)  // 'À venir' | 'Upcoming'
 *
 * Lang lue depuis `profile.preferredLanguage` (UserProfile.preferredLanguage).
 */

export type Lang = 'fr' | 'en'

interface LabelEntry {
  fr: string
  en: string
}

export const APP_LABELS = {
  // ── Block states (BlockStateChip) ───────────────────────────────────────
  block_state_pending: { fr: 'À venir', en: 'Upcoming' },
  block_state_active: { fr: 'En cours', en: 'In progress' },
  block_state_done: { fr: 'Terminé', en: 'Done' },

  // ── BlockHeader (numérotation + a11y chevron) ───────────────────────────
  block_eyebrow: { fr: 'Bloc', en: 'Block' },
  block_expand: { fr: 'Déplier le bloc', en: 'Expand block' },
  block_collapse: { fr: 'Replier le bloc', en: 'Collapse block' },

  // ── Synthetic warmup block title ────────────────────────────────────────
  warmup_block_title: { fr: 'Échauffement', en: 'Warm-Up' },

  // ── Cycle / season phases ───────────────────────────────────────────────
  cycle_off_season: { fr: 'Inter-saison', en: 'Off-Season' },
  cycle_pre_season: { fr: 'Pré-saison', en: 'Pre-Season' },
  cycle_in_season: { fr: 'En saison', en: 'In-Season' },
  cycle_playoffs: { fr: 'Playoffs', en: 'Playoffs' },

  // ── Training levels ─────────────────────────────────────────────────────
  level_starter: { fr: 'Fondations', en: 'Foundations' },
  level_builder: { fr: 'Avancée', en: 'Intermediate' },
  level_performance: { fr: 'Avancée', en: 'Advanced' },

  // ── HomePage hero — eyebrows + CTAs (titles/subtitles restent JSX inline) ─
  hero_match_today_eyebrow: { fr: "Aujourd'hui · Match", en: 'Today · Match' },
  hero_match_today_cta: { fr: 'Voir le match', en: 'View match' },
  hero_match_tomorrow_eyebrow: { fr: "Aujourd'hui · Repos avant match", en: 'Today · Pre-match rest' },
  hero_match_tomorrow_cta: { fr: 'Voir le plan de la semaine', en: 'View weekly plan' },
  hero_training_day_eyebrow: { fr: "Aujourd'hui · Séance", en: 'Today · Session' },
  hero_training_day_cta: { fr: 'Démarrer la séance', en: 'Start session' },
  hero_rest_day_eyebrow: { fr: "Aujourd'hui · Repos", en: 'Today · Rest' },
  hero_rest_day_cta: { fr: 'Voir le plan de la semaine', en: 'View weekly plan' },
  hero_post_match_eyebrow: { fr: 'Après-match', en: 'Post-match' },
  hero_post_match_cta: { fr: 'Voir le plan', en: 'View plan' },

  // ── FeedbackPage ────────────────────────────────────────────────────────
  feedback_kind_bug: { fr: 'Bug / dysfonctionnement', en: 'Bug / issue' },
  feedback_kind_feature: { fr: 'Nouvelle fonctionnalité', en: 'Feature request' },
  feedback_kind_ux: { fr: 'Ergonomie / lisibilité', en: 'UX / readability' },
  feedback_kind_other: { fr: 'Autre retour', en: 'Other feedback' },
  feedback_message_too_short: { fr: 'Message trop court', en: 'Message too short' },
  feedback_send_error: { fr: "Échec de l'envoi", en: 'Send failed' },
  feedback_send_success: { fr: 'Merci ! Ton retour a bien été envoyé.', en: 'Thanks! Your feedback was sent.' },

  // ── Onboarding · positions rugby ────────────────────────────────────────
  pos_front_row: { fr: 'Première ligne', en: 'Front row' },
  pos_front_row_sub: { fr: 'Pilier · Talonneur', en: 'Prop · Hooker' },
  pos_second_row: { fr: 'Deuxième ligne', en: 'Second row' },
  pos_second_row_sub: { fr: 'Verrouilleur', en: 'Lock' },
  pos_back_row: { fr: 'Troisième ligne', en: 'Back row' },
  pos_back_row_sub: { fr: 'Flanker · Numéro 8', en: 'Flanker · No. 8' },
  pos_half_backs: { fr: 'Demi', en: 'Half-backs' },
  pos_half_backs_sub: { fr: 'Mêlée · Ouverture', en: 'Scrum-half · Fly-half' },
  pos_centers: { fr: 'Centre', en: 'Centre' },
  pos_centers_sub: { fr: '12 / 13', en: '12 / 13' },
  pos_back_three: { fr: 'Arrière / Ailier', en: 'Fullback / Wing' },
  pos_back_three_sub: { fr: '11 · 14 · 15', en: '11 · 14 · 15' },

  // ── Onboarding · days of week ───────────────────────────────────────────
  day_monday: { fr: 'Lundi', en: 'Monday' },
  day_tuesday: { fr: 'Mardi', en: 'Tuesday' },
  day_wednesday: { fr: 'Mercredi', en: 'Wednesday' },
  day_thursday: { fr: 'Jeudi', en: 'Thursday' },
  day_friday: { fr: 'Vendredi', en: 'Friday' },
  day_saturday: { fr: 'Samedi', en: 'Saturday' },
  day_sunday: { fr: 'Dimanche', en: 'Sunday' },
  day_monday_short: { fr: 'L', en: 'M' },
  day_tuesday_short: { fr: 'M', en: 'T' },
  day_wednesday_short: { fr: 'M', en: 'W' },
  day_thursday_short: { fr: 'J', en: 'T' },
  day_friday_short: { fr: 'V', en: 'F' },
  day_saturday_short: { fr: 'S', en: 'S' },
  day_sunday_short: { fr: 'D', en: 'S' },
  day_monday_abbr: { fr: 'Lun', en: 'Mon' },
  day_tuesday_abbr: { fr: 'Mar', en: 'Tue' },
  day_wednesday_abbr: { fr: 'Mer', en: 'Wed' },
  day_thursday_abbr: { fr: 'Jeu', en: 'Thu' },
  day_friday_abbr: { fr: 'Ven', en: 'Fri' },
  day_saturday_abbr: { fr: 'Sam', en: 'Sat' },
  day_sunday_abbr: { fr: 'Dim', en: 'Sun' },
  match_day_variable: { fr: 'Variable', en: 'Variable' },

  // ── Onboarding · season phase sub-labels (label keys via cycle_*) ───────
  cycle_in_season_sub: { fr: 'Matchs réguliers en cours', en: 'Regular matches in season' },
  cycle_playoffs_sub: { fr: 'Phases finales, match crucial', en: 'Knockouts, crucial match' },
  cycle_off_season_sub: { fr: 'Pas de match, coupure du club', en: 'No matches, club break' },
  cycle_pre_season_sub: { fr: 'Reprise club, prépa physique', en: 'Club return, physical prep' },

  // ── Onboarding · training baselines (état de forme) ─────────────────────
  baseline_restart: { fr: 'Je reprends', en: "I'm restarting" },
  baseline_restart_sub: { fr: '≥6 semaines sans entraînement', en: '≥6 weeks without training' },
  baseline_active: { fr: 'Je suis actif', en: "I'm active" },
  baseline_active_sub: { fr: '1-2 séances/semaine, irrégulier', en: '1-2 sessions/week, irregular' },
  baseline_peak: { fr: 'En pleine forme', en: 'In top shape' },
  baseline_peak_sub: { fr: '3×/sem depuis au moins 1 mois', en: '3×/wk for at least 1 month' },

  // ── Onboarding · training level details (labels via level_*) ────────────
  level_starter_sub: { fr: 'Je découvre la muscu', en: 'New to strength training' },
  level_starter_details: { fr: 'Exercices guidés : haltères et machines. Variantes sécurisées pour les mouvements à risque.', en: 'Guided exercises: dumbbells and machines. Safe variants for risky movements.' },
  level_performance_sub: { fr: "Je suis à l'aise avec la barre", en: 'Comfortable with the bar' },
  level_performance_details: { fr: "Programme complet : barres libres, haltères et travail d'explosivité.", en: 'Full program: free weights, dumbbells, and explosive work.' },

  // ── Onboarding · BMI labels ─────────────────────────────────────────────
  bmi_underweight: { fr: 'Sous le poids de forme', en: 'Under playing weight' },
  bmi_optimal_back: { fr: 'Morphologie optimale', en: 'Optimal build' },
  bmi_light_forward: { fr: 'Plutôt léger pour ton poste', en: 'A bit light for your position' },
  bmi_adequate_forward: { fr: 'Morphologie adéquate', en: 'Adequate build' },
  bmi_above_back: { fr: 'Légèrement au-dessus', en: 'Slightly above' },
  bmi_optimal_forward: { fr: 'Morphologie optimale pour un avant', en: 'Optimal build for a forward' },
  bmi_above_norm: { fr: 'Au-dessus de la norme', en: 'Above the norm' },
  bmi_big_forward: { fr: 'Gabarit de gros avant', en: 'Big forward build' },
  bmi_surcharge_back: { fr: 'Surcharge à surveiller', en: 'Weight surplus to monitor' },

  // ── Onboarding · BMI gauge ticks ────────────────────────────────────────
  bmi_tick_underweight: { fr: 'Sous-poids', en: 'Underweight' },
  bmi_tick_optimal: { fr: 'Optimal', en: 'Optimal' },
  bmi_tick_solid: { fr: 'Solide', en: 'Solid' },
  bmi_tick_forward: { fr: "Gabarit d'avant", en: 'Forward build' },
  bmi_tick_big_forward: { fr: 'Gros avant', en: 'Big forward' },
  bmi_imc_rugby: { fr: 'IMC rugby', en: 'Rugby BMI' },
  bmi_disclaimer: { fr: "L'IMC seul ne reflète pas la masse musculaire — indicateur de gabarit uniquement.", en: 'BMI alone does not reflect muscle mass — build indicator only.' },

  // ── Onboarding · gender ─────────────────────────────────────────────────
  gender_male: { fr: 'Joueur', en: 'Male player' },
  gender_female: { fr: 'Joueuse', en: 'Female player' },

  // ── Onboarding · steps & section labels ─────────────────────────────────
  step_position: { fr: 'Position', en: 'Position' },
  step_profile: { fr: 'Profil', en: 'Profile' },
  step_situation: { fr: 'Situation', en: 'Situation' },
  step_planning: { fr: 'Planning', en: 'Schedule' },
  step_morphology: { fr: 'Morphologie', en: 'Morphology' },
  step_summary: { fr: 'Résumé', en: 'Summary' },
  step0_title: { fr: 'Tu joues où ?', en: 'What position?' },
  step0_sub: { fr: 'Ton programme est calibré selon ton poste.', en: 'Your program is tuned to your position.' },
  step1_title: { fr: 'Ton profil', en: 'Your profile' },
  step1_sub: { fr: 'Pour calibrer les charges et les volumes.', en: 'To tune loads and volumes.' },
  step1_section_level: { fr: 'Niveau en salle', en: 'Gym level' },
  step1_section_sessions: { fr: 'Séances par semaine', en: 'Sessions per week' },
  step1_section_gender: { fr: 'Tu es', en: 'You are' },
  sessions_2_label: { fr: '2 séances', en: '2 sessions' },
  sessions_3_label: { fr: '3 séances', en: '3 sessions' },
  sessions_2_sub: { fr: 'Lun · Jeu', en: 'Mon · Thu' },
  sessions_3_sub: { fr: 'Lun · Mer · Ven', en: 'Mon · Wed · Fri' },
  step2_title: { fr: 'Où en es-tu maintenant ?', en: 'Where are you now?' },
  step2_sub: { fr: 'Pour calibrer ta rampe de reprise. Tu pourras ajuster à tout moment.', en: 'To tune your return ramp. You can adjust anytime.' },
  step2_section_season: { fr: 'Ta saison actuelle', en: 'Your current season' },
  step2_section_baseline: { fr: 'Ton état de forme', en: 'Your current shape' },
  step3_offseason_title: { fr: 'Tes jours de muscu', en: 'Your training days' },
  step3_offseason_sub: { fr: "Pas de club en inter-saison — choisis tes jours librement.", en: 'No club in off-season — pick your days freely.' },
  step3_offseason_sub_note: { fr: 'Tu pourras modifier tes jours à tout moment dans ton profil.', en: 'You can change your days anytime in your profile.' },
  step3_club_title: { fr: 'Ton planning club', en: 'Your club schedule' },
  step3_club_sub: { fr: 'On adapte tes séances muscu à ton agenda. Optionnel.', en: 'We adapt your gym sessions to your schedule. Optional.' },
  step3_section_club_days: { fr: "Jours d'entraînement club", en: 'Club training days' },
  step3_section_match_day: { fr: 'Jour de match habituel', en: 'Usual match day' },
  step3_section_suggested: { fr: 'Tes séances muscu suggérées', en: 'Your suggested gym sessions' },
  step3_legend_match: { fr: 'Match', en: 'Match' },
  step3_legend_club: { fr: 'Club', en: 'Club' },
  step3_legend_muscu: { fr: 'Muscu', en: 'Gym' },
  step3_auto_placed: { fr: 'Placées automatiquement autour de ton club et de tes matchs.', en: 'Auto-placed around your club and matches.' },
  step3_sessions_per_week: { fr: 'séances par semaine', en: 'sessions per week' },
  step3_skip_club: { fr: "Pas d'entraînement club — passer", en: 'No club training — skip' },
  step4_title: { fr: 'Ta morphologie', en: 'Your morphology' },
  step4_sub: { fr: "Optionnel — utilisé pour les baselines 1RM et l'IMC rugby.", en: 'Optional — used for 1RM baselines and rugby BMI.' },
  step4_height: { fr: 'Taille', en: 'Height' },
  step4_weight: { fr: 'Poids', en: 'Weight' },
  step4_height_range_error: { fr: 'Entre 140 et 230 cm', en: 'Between 140 and 230 cm' },
  step4_weight_range_error: { fr: 'Entre 40 et 200 kg', en: 'Between 40 and 200 kg' },
  step4_skip: { fr: 'Passer cette étape', en: 'Skip this step' },
  step5_title: { fr: "C'est parti !", en: "Let's go!" },
  step5_sub: { fr: 'Voici ton profil. Tu pourras le modifier à tout moment dans les réglages.', en: 'Here is your profile. You can edit it anytime in settings.' },
  step5_row_position: { fr: 'Poste', en: 'Position' },
  step5_row_level: { fr: 'Niveau', en: 'Level' },
  step5_row_sessions: { fr: 'Séances', en: 'Sessions' },
  step5_row_season: { fr: 'Saison', en: 'Season' },
  step5_row_gym: { fr: 'Muscu', en: 'Gym' },
  step5_row_morpho: { fr: 'Morpho', en: 'Morpho' },
  step5_sessions_per_week: { fr: '/ semaine', en: '/ week' },
  step5_cta: { fr: 'Voir mon programme', en: 'View my program' },
  onboarding_next: { fr: 'Suivant', en: 'Next' },
  onboarding_error: { fr: 'Une erreur est survenue. Vérifie ta connexion et réessaie.', en: 'An error occurred. Check your connection and try again.' },
} as const satisfies Record<string, LabelEntry>

export type AppLabelKey = keyof typeof APP_LABELS

/** Résout un label dans la langue voulue. Défaut : 'fr'. */
export function tr(key: AppLabelKey, lang: Lang = 'fr'): string {
  return APP_LABELS[key][lang]
}

// ── Helpers métier (mapping enum → label key) ─────────────────────────────

/** Mappe les phases de saison (camelCase ou hyphenated) vers le label key. */
export function cyclePhaseLabel(
  phase: 'off_season' | 'off-season' | 'pre_season' | 'pre-season' | 'in_season' | 'in-season' | 'playoffs',
  lang: Lang = 'fr',
): string {
  switch (phase) {
    case 'off_season':
    case 'off-season':
      return tr('cycle_off_season', lang)
    case 'pre_season':
    case 'pre-season':
      return tr('cycle_pre_season', lang)
    case 'in_season':
    case 'in-season':
      return tr('cycle_in_season', lang)
    case 'playoffs':
      return tr('cycle_playoffs', lang)
  }
}

/** Mappe trainingLevel ('starter'|'builder'|'performance') → label localisé. */
export function trainingLevelLabel(
  level: 'starter' | 'builder' | 'performance' | string,
  lang: Lang = 'fr',
): string {
  switch (level) {
    case 'starter':
      return tr('level_starter', lang)
    case 'builder':
      return tr('level_builder', lang)
    case 'performance':
      return tr('level_performance', lang)
    default:
      return level
  }
}

// ── Day-of-week helpers (DayOfWeek 0=Sun, 1=Mon, ..., 6=Sat) ──────────────

const DAY_KEY_BY_DOW: Record<number, AppLabelKey> = {
  0: 'day_sunday',
  1: 'day_monday',
  2: 'day_tuesday',
  3: 'day_wednesday',
  4: 'day_thursday',
  5: 'day_friday',
  6: 'day_saturday',
}
const DAY_SHORT_KEY_BY_DOW: Record<number, AppLabelKey> = {
  0: 'day_sunday_short',
  1: 'day_monday_short',
  2: 'day_tuesday_short',
  3: 'day_wednesday_short',
  4: 'day_thursday_short',
  5: 'day_friday_short',
  6: 'day_saturday_short',
}
const DAY_ABBR_KEY_BY_DOW: Record<number, AppLabelKey> = {
  0: 'day_sunday_abbr',
  1: 'day_monday_abbr',
  2: 'day_tuesday_abbr',
  3: 'day_wednesday_abbr',
  4: 'day_thursday_abbr',
  5: 'day_friday_abbr',
  6: 'day_saturday_abbr',
}

/** Long form (Monday / Lundi). */
export function dayLabel(dow: number, lang: Lang = 'fr'): string {
  return tr(DAY_KEY_BY_DOW[dow] ?? 'day_monday', lang)
}
/** Single-letter form (M / L). */
export function dayShort(dow: number, lang: Lang = 'fr'): string {
  return tr(DAY_SHORT_KEY_BY_DOW[dow] ?? 'day_monday_short', lang)
}
/** Three-letter form (Mon / Lun). */
export function dayAbbr(dow: number, lang: Lang = 'fr'): string {
  return tr(DAY_ABBR_KEY_BY_DOW[dow] ?? 'day_monday_abbr', lang)
}

/** Tableau de 7 abbr (Sun..Sat) pour usage type DAY_LABELS array indexed by dow. */
export function dayAbbrArray(lang: Lang = 'fr'): readonly string[] {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => dayAbbr(d, lang))
}
