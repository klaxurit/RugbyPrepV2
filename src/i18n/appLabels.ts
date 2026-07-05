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

  /** Header — quitter la séance en cours (même action que l'ancien bouton flottant). */
  session_quit_workout_aria: {
    fr: 'Quitter la séance en cours',
    en: 'Leave current workout',
  },

  // ── Cycle / season phases ───────────────────────────────────────────────
  cycle_off_season: { fr: 'Inter-saison', en: 'Off-Season' },
  cycle_pre_season: { fr: 'Pré-saison', en: 'Pre-Season' },
  cycle_in_season: { fr: 'En saison', en: 'In-Season' },
  cycle_playoffs: { fr: 'Phase finale', en: 'Knockouts' },

  // ── Training levels ─────────────────────────────────────────────────────
  level_starter: { fr: 'Fondations', en: 'Foundations' },
  level_builder: { fr: 'Intermédiaire', en: 'Intermediate' },
  level_performance: { fr: 'Performance', en: 'Advanced' },

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
  step_equipment: { fr: 'Matériel', en: 'Equipment' },
  step_profile: { fr: 'Profil', en: 'Profile' },
  step_situation: { fr: 'Situation', en: 'Situation' },
  step_planning: { fr: 'Planning', en: 'Schedule' },
  step_morphology: { fr: 'Morphologie', en: 'Morphology' },
  step_summary: { fr: 'Résumé', en: 'Summary' },
  step0_title: { fr: 'Tu joues où ?', en: 'What position?' },
  step0_sub: { fr: 'Ton programme est calibré selon ton poste.', en: 'Your program is tuned to your position.' },
  step_equipment_title: { fr: 'Où tu t\'entraînes ?', en: 'Where do you train?' },
  step_equipment_sub: { fr: 'On adapte les exercices à ton matériel. Tu pourras le modifier dans ton profil.', en: 'We adapt exercises to your equipment. You can change this in your profile.' },
  equipment_preset_bodyweight: { fr: 'Poids de corps', en: 'Bodyweight' },
  equipment_preset_bodyweight_sub: { fr: 'Aucun matériel — table, chaise ou mur suffisent', en: 'No gear — table, chair or wall are enough' },
  equipment_preset_bands: { fr: 'Élastiques', en: 'Resistance bands' },
  equipment_preset_bands_sub: { fr: 'Bandes seules, à la maison', en: 'Bands only, at home' },
  equipment_preset_home: { fr: 'Home gym', en: 'Home gym' },
  equipment_preset_home_sub: { fr: 'Élastiques, haltères, banc, barre de traction', en: 'Bands, dumbbells, bench, pull-up bar' },
  equipment_preset_full_gym: { fr: 'Salle complète', en: 'Full gym' },
  equipment_preset_full_gym_sub: { fr: 'Barre, machines, câbles…', en: 'Barbell, machines, cables…' },
  equipment_check_band: { fr: 'Élastiques', en: 'Resistance bands' },
  equipment_check_band_hint: { fr: 'Pallof, face pull, nordiques assistés…', en: 'Pallof, face pull, assisted nordics…' },
  equipment_check_pullup_bar: { fr: 'Barre de traction / parc street workout', en: 'Pull-up bar / calisthenics park' },
  equipment_check_pullup_bar_hint: { fr: 'Tractions, dips parallèles…', en: 'Pull-ups, parallel dips…' },
  equipment_check_dumbbell: { fr: 'Haltères', en: 'Dumbbells' },
  equipment_check_dumbbell_hint: { fr: 'Goblet squat, rowing, développé…', en: 'Goblet squat, rows, press…' },
  equipment_check_kettlebell: { fr: 'Kettlebell', en: 'Kettlebell' },
  equipment_check_kettlebell_hint: { fr: 'Variantes haltéro / swing selon séance', en: 'DB / swing variants depending on session' },
  equipment_check_bench: { fr: 'Banc', en: 'Bench' },
  equipment_check_bench_hint: { fr: 'Développé, dips chaise, Copenhagen…', en: 'Bench press, chair dips, Copenhagen…' },
  equipment_check_squat_rack: { fr: 'Cage à squat', en: 'Squat rack' },
  equipment_check_squat_rack_hint: { fr: 'Squat barre au lieu du squat poids de corps', en: 'Barbell squat instead of bodyweight squat' },
  equipment_full_gym_cta: { fr: 'Salle complète', en: 'Full gym' },
  equipment_full_gym_cta_sub: { fr: 'Machines, câbles, séances dédiées salle', en: 'Machines, cables, dedicated gym sessions' },
  step1_title: { fr: 'Ton profil', en: 'Your profile' },
  step1_sub: { fr: 'Pour calibrer les charges et les volumes.', en: 'To tune loads and volumes.' },
  step1_title_home: { fr: 'Ton rythme', en: 'Your schedule' },
  step1_sub_home: { fr: 'Combien de séances muscu par semaine, en dehors du club.', en: 'How many strength sessions per week, outside club training.' },
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
  step5_row_equipment: { fr: 'Matériel', en: 'Equipment' },
  step5_row_level: { fr: 'Niveau', en: 'Level' },
  step5_row_sessions: { fr: 'Séances', en: 'Sessions' },
  step5_row_season: { fr: 'Saison', en: 'Season' },
  step5_row_gym: { fr: 'Muscu', en: 'Gym' },
  step5_row_morpho: { fr: 'Morpho', en: 'Morpho' },
  step5_sessions_per_week: { fr: '/ semaine', en: '/ week' },
  step5_cta: { fr: 'Voir mon programme', en: 'View my program' },
  onboarding_next: { fr: 'Suivant', en: 'Next' },
  onboarding_error: { fr: 'Une erreur est survenue. Vérifie ta connexion et réessaie.', en: 'An error occurred. Check your connection and try again.' },

  // ── ChatPage ────────────────────────────────────────────────────────────
  chat_page_title: { fr: 'Coach IA', en: 'AI Coach' },
  chat_phase_hypertrophy: { fr: 'Hypertrophie', en: 'Hypertrophy' },
  chat_phase_force: { fr: 'Force', en: 'Strength' },
  chat_phase_power: { fr: 'Puissance', en: 'Power' },
  chat_qp_nutrition: { fr: 'Nutrition avant la séance', en: 'Pre-session nutrition' },
  chat_qp_recovery: { fr: 'Récupération post-match', en: 'Post-match recovery' },
  chat_qp_sleep: { fr: 'Sommeil et performance', en: 'Sleep and performance' },
  chat_qp_injury: { fr: 'Prévenir les blessures rugby', en: 'Preventing rugby injuries' },
  chat_qp_phase_hyper: { fr: 'Conseils nutrition en phase volume', en: 'Nutrition tips during volume phase' },
  chat_qp_phase_force: { fr: 'Récupération entre séances lourdes', en: 'Recovery between heavy sessions' },
  chat_qp_phase_power: { fr: 'Activation neuromusculaire pré-séance', en: 'Pre-session neuromuscular activation' },
  chat_qp_deload: { fr: 'Que faire concrètement en semaine de décharge ?', en: 'What concretely to do during a deload week?' },
  chat_qp_prematch: { fr: 'Prépare mon match : plan 48h nutrition, récup, activation', en: 'Prepare my match: 48h plan nutrition, recovery, activation' },
  chat_no_response: { fr: 'Pas de réponse.', en: 'No response.' },
  chat_network_error: { fr: 'Erreur réseau — réessaie.', en: 'Network error — retry.' },
  chat_usage_counter_unavailable: {
    fr: 'Le suivi du quota coach est temporairement indisponible. Réessaie dans quelques minutes.',
    en: 'Usage tracking is temporarily unavailable. Please try again in a few minutes.',
  },
  chat_error_prefix: { fr: 'Erreur', en: 'Error' },
  chat_welcome_greeting: { fr: 'Salut ! Je suis ton coach IA RugbyForge 🏉', en: 'Hi! I am your RugbyForge AI coach 🏉' },
  chat_welcome_body: { fr: "Pose-moi n'importe quelle question sur l'entraînement, la nutrition, la récupération ou le sommeil. Je connais ton profil et ta semaine en cours.", en: 'Ask me any question about training, nutrition, recovery or sleep. I know your profile and your current week.' },
  chat_free_note: { fr: 'Mode Free: le coach reste disponible, mais les suggestions contextuelles avancées sont réservées au Pro.', en: 'Free mode: the coach stays available, but advanced contextual suggestions are reserved for Pro.' },
  chat_week_prefix: { fr: 'Semaine', en: 'Week' },
  chat_phase_prefix: { fr: 'Phase', en: 'Phase' },
  chat_fatigue_prefix: { fr: 'Fatigue', en: 'Fatigue' },
  chat_suggestions: { fr: 'Suggestions', en: 'Suggestions' },
  chat_upsell_title: { fr: 'Passe en Pro', en: 'Upgrade to Pro' },
  chat_upsell_body: { fr: 'Débloque les suggestions avancées liées à ta phase, à ta charge et à tes adaptations de programme.', en: 'Unlock advanced suggestions tied to your phase, load, and program adaptations.' },
  chat_payment_confirmed: { fr: 'Paiement confirmé. Activation Pro en cours...', en: 'Payment confirmed. Pro activation in progress...' },
  chat_activation_pending: { fr: 'Activation encore en attente. Clique sur vérifier ou consulte les logs webhook Stripe.', en: 'Activation still pending. Click verify or check Stripe webhook logs.' },
  chat_payment_detected: { fr: 'Retour de paiement détecté.', en: 'Payment return detected.' },
  chat_loading: { fr: 'Préparation…', en: 'Loading…' },
  chat_verify_premium: { fr: 'Vérifier mon statut Pro', en: 'Verify my Pro status' },
  chat_activate_premium: { fr: 'Activer Pro', en: 'Activate Pro' },
  chat_rate_limit_title: { fr: 'Tu as utilisé tes 3 messages du jour', en: 'You used your 3 messages for today' },
  chat_rate_limit_body: { fr: 'Le coach Pro te connaît — il sait ton poste, ta charge, tes blessures, et adapte chaque réponse. Messages illimités.', en: 'The Pro coach knows you — your position, load, injuries, and adapts every reply. Unlimited messages.' },
  chat_last_free_message: { fr: 'Dernier message gratuit du jour.', en: 'Last free message of the day.' },
  chat_remaining_suffix: { fr: "messages restants aujourd'hui.", en: 'messages remaining today.' },
  chat_input_placeholder: { fr: 'Pose ta question...', en: 'Ask your question...' },
  chat_disclaimer: { fr: 'Conseils sportifs uniquement — pas un avis médical', en: 'Sports advice only — not medical advice' },

  // ── ProgressPage ────────────────────────────────────────────────────────
  progress_page_title: { fr: 'Progression', en: 'Progress' },
  progress_trend_up: { fr: 'Progression', en: 'Progress' },
  progress_trend_down: { fr: 'Régression', en: 'Regression' },
  progress_trend_same: { fr: 'Stable', en: 'Stable' },
  progress_trend_unknown: { fr: '–', en: '–' },
  progress_tab_sessions: { fr: 'Séances', en: 'Sessions' },
  progress_tab_tests: { fr: 'Tests', en: 'Tests' },
  progress_tab_records: { fr: 'Records', en: 'Records' },
  progress_adherence_section: { fr: 'Adhérence programme', en: 'Program adherence' },
  progress_window_7d: { fr: '7 derniers jours', en: 'Last 7 days' },
  progress_window_28d: { fr: '28 derniers jours', en: 'Last 28 days' },
  progress_goal_basis_pre: { fr: 'Objectif basé sur ton niveau', en: 'Goal based on your level' },
  progress_goal_basis_suffix: { fr: 'séances/semaine.', en: 'sessions/week.' },
  progress_recent_sessions: { fr: 'Dernières séances', en: 'Recent sessions' },
  progress_view_prev_pre: { fr: 'Voir', en: 'View' },
  progress_view_prev_suffix_single: { fr: 'séance précédente', en: 'previous session' },
  progress_view_prev_suffix_plural: { fr: 'séances précédentes', en: 'previous sessions' },
  progress_stat_up: { fr: 'En hausse', en: 'Rising' },
  progress_stat_down: { fr: 'En baisse', en: 'Falling' },
  progress_stat_tracked: { fr: 'Suivis', en: 'Tracked' },
  progress_top_section: { fr: 'Top progrès (S1 → S4)', en: 'Top progress (W1 → W4)' },
  progress_no_data: { fr: 'Données insuffisantes', en: 'Not enough data' },
  progress_no_data_sub: { fr: 'Enregistre des séances en Semaine 1 et Semaine 4 pour voir ta progression.', en: 'Log sessions in Week 1 and Week 4 to see your progress.' },
  progress_go_train: { fr: "Aller s'entraîner →", en: 'Go train →' },
  progress_season: { fr: 'Progression saison', en: 'Season progress' },
  progress_season_sub: { fr: 'Tonnage hebdomadaire (kg × reps × séries)', en: 'Weekly tonnage (kg × reps × sets)' },
  progress_tonnage: { fr: 'Tonnage', en: 'Tonnage' },
  progress_curves_label: { fr: 'Courbes de progression', en: 'Progress curves' },
  progress_method_title: { fr: 'Méthode double progression', en: 'Double progression method' },
  progress_method_body: { fr: "Remplis d'abord ta plage de reps cible (ex: 4×8-12), puis ajoute +2.5kg. La force max se maintient jusqu'à 25-35j sans stimulation — régularité > intensité.", en: 'First fill your target rep range (e.g. 4×8-12), then add +2.5kg. Max strength holds up to 25-35d without stimulation — consistency > intensity.' },
  progress_tests_intro: { fr: 'Mesure tes performances athlétiques et suis leur évolution dans le temps.', en: 'Measure your athletic performances and track their evolution over time.' },
  progress_test_card_cmj: { fr: 'Counter-Movement Jump', en: 'Counter-Movement Jump' },
  progress_test_card_sprint: { fr: 'Sprint 10m', en: 'Sprint 10m' },
  progress_test_card_squat: { fr: '1RM Squat', en: '1RM Squat' },
  progress_test_card_deadlift: { fr: '1RM Soulevé de terre', en: '1RM Deadlift' },
  progress_test_card_yyir1: { fr: 'Yo-Yo IR1', en: 'Yo-Yo IR1' },
  progress_regression_warn: { fr: '⚠️ Régression >10%', en: '⚠️ Regression >10%' },
  progress_test_baseline: { fr: 'Baseline', en: 'Baseline' },
  progress_test_record: { fr: 'Record', en: 'Record' },
  progress_test_none: { fr: 'Aucun test enregistré', en: 'No test recorded' },

  // ── HistoryPage ─────────────────────────────────────────────────────────
  history_page_title: { fr: 'Historique', en: 'History' },
  history_clear_logs: { fr: 'Effacer', en: 'Clear' },
  history_upsell_title: { fr: 'Historique complet', en: 'Full history' },
  history_upsell_body: {
    fr: 'Retrouve toutes tes séances, charges et exercices. Suis ta progression semaine après semaine.',
    en: 'See all your sessions, loads and exercises. Track your progress week after week.',
  },
  history_stat_total: { fr: 'Séances totales', en: 'Total sessions' },
  history_stat_7d: { fr: '7 derniers jours', en: 'Last 7 days' },
  history_stat_28d: { fr: '28 derniers jours', en: 'Last 28 days' },
  history_stat_split: { fr: 'Annuel / Legacy', en: 'Annual / Legacy' },
  history_empty_title: { fr: 'Aucune séance', en: 'No sessions yet' },
  history_empty_body: {
    fr: 'Lance ta première séance depuis la page Semaine.',
    en: 'Start your first session from the Week page.',
  },
  history_empty_cta: { fr: 'Voir la semaine →', en: 'View week →' },
  history_fatigue_tired: { fr: 'Fatigue', en: 'Tired' },
  history_section_blocks: { fr: 'Détail des exercices', en: 'Exercise details' },
  history_unit_reps: { fr: 'rép.', en: 'reps' },

  progress_pos_front_row: { fr: '1ère ligne', en: 'Front row' },
  progress_pos_second_row: { fr: '2ème ligne', en: 'Second row' },
  progress_pos_back_row: { fr: '3ème ligne', en: 'Back row' },
  progress_pos_half_backs: { fr: 'Demi', en: 'Half-backs' },
  progress_pos_centers: { fr: 'Centres', en: 'Centres' },
  progress_pos_back_three: { fr: 'Arrières', en: 'Backs' },
  progress_modal_title: { fr: 'Ajouter un test', en: 'Add a test' },
  progress_modal_close: { fr: 'Fermer', en: 'Close' },
  progress_modal_new_test: { fr: 'Nouveau test', en: 'New test' },
  progress_modal_sub: { fr: 'Enregistre une mesure propre pour suivre ta progression semaine après semaine.', en: 'Log a clean measurement to track your progress week by week.' },
  progress_modal_direct: { fr: 'Direct', en: 'Direct' },
  progress_modal_direct_sub: { fr: 'Valeur testée', en: 'Measured value' },
  progress_modal_estim: { fr: 'Estimation', en: 'Estimate' },
  progress_modal_estim_sub: { fr: 'Charge + reps', en: 'Load + reps' },
  progress_modal_value_pre: { fr: 'Valeur', en: 'Value' },
  progress_modal_value_help: { fr: 'Entre ta mesure directement si tu as déjà le résultat.', en: 'Enter your measurement directly if you already have the result.' },
  progress_modal_estim_title: { fr: 'Estimation du 1RM', en: '1RM estimate' },
  progress_modal_estim_help: { fr: 'Charge + reps pour estimer ton niveau du moment.', en: 'Load + reps to estimate your current level.' },
  progress_modal_weight: { fr: 'Poids (kg)', en: 'Weight (kg)' },
  progress_modal_reps: { fr: 'Reps', en: 'Reps' },
  progress_modal_formula: { fr: 'Formule', en: 'Formula' },
  progress_modal_formula_brzycki: { fr: 'Brzycki — recommandé pour 3 à 6 reps', en: 'Brzycki — recommended for 3-6 reps' },
  progress_modal_formula_epley: { fr: 'Epley — utile sur des reps plus hautes', en: 'Epley — useful on higher reps' },
  progress_modal_instant_estim: { fr: 'Estimation instantanée', en: 'Instant estimate' },
  progress_modal_estimated_with_pre: { fr: '1RM estimé avec', en: '1RM estimated with' },
  progress_modal_notes: { fr: 'Notes', en: 'Notes' },
  progress_modal_notes_help: { fr: 'Optionnel. Exemple : fatigue, surface, contexte match, sensation.', en: 'Optional. Example: fatigue, surface, match context, feeling.' },
  progress_modal_notes_placeholder: { fr: 'Ex : après entraînement, jambes lourdes, terrain humide...', en: 'Ex: after training, heavy legs, wet field...' },
  progress_modal_cancel: { fr: 'Annuler', en: 'Cancel' },
  progress_modal_save: { fr: 'Enregistrer', en: 'Save' },
  progress_rate_at_this: { fr: 'À ce rythme,', en: 'At this rate,' },
  progress_rate_in: { fr: 'dans', en: 'in' },
  progress_rate_week_single: { fr: 'semaine', en: 'week' },
  progress_rate_week_plural: { fr: 'semaines', en: 'weeks' },
  progress_cmj_rule_title: { fr: 'Règle clinique CMJ', en: 'CMJ clinical rule' },
  progress_cmj_rule_body: { fr: '↓ CMJ ≥ 10% vs baseline = fatigue neuromusculaire non résolue → ne pas augmenter la charge cette semaine. Mesure idéalement le lundi matin à jeun.', en: '↓ CMJ ≥ 10% vs baseline = unresolved neuromuscular fatigue → do not raise load this week. Ideally measure Monday morning fasted.' },

  // ── Tours block (meta + ExerciseRow + PreviewExerciseRow) ───────────────
  tours_meta_round_single: { fr: 'tour', en: 'round' },
  tours_meta_round_plural: { fr: 'tours', en: 'rounds' },
  tours_meta_rest_prefix: { fr: 'Repos', en: 'Rest' },
  tours_tour_label: { fr: 'Tour', en: 'Round' },
  exercise_aria_validate: { fr: 'Valider', en: 'Validate' },
  exercise_aria_unvalidate: { fr: 'Marquer non fait', en: 'Mark not done' },
  exercise_aria_demo: { fr: 'Voir la démo', en: 'View demo' },
  exercise_validate_set: { fr: 'Valider set', en: 'Validate set' },
  exercise_premium_tracking_pre: { fr: 'Suivi set-par-set', en: 'Set-by-set tracking' },
  exercise_prefill_carry: { fr: 'Reprendre série préc.', en: 'Reuse previous set' },
  exercise_prefill_previous: { fr: 'Dernière séance', en: 'Last session' },
  exercise_prefill_suggestion: { fr: 'Utiliser la suggestion', en: 'Use suggestion' },
  exercise_journal_last_session: { fr: 'Dernière séance', en: 'Last session' },
  exercise_journal_current_session: { fr: 'Cette séance', en: 'This session' },

  // ── EMOM block ──────────────────────────────────────────────────────────
  emom_chrono_block: { fr: 'Bloc chronométré · EMOM', en: 'Timed block · EMOM' },
  emom_minutes_intro_pre: { fr: 'minutes — une nouvelle minute = un nouvel exercice.', en: 'minutes — a new minute = a new exercise.' },
  emom_start_chrono: { fr: 'Démarrer le chrono', en: 'Start chrono' },
  emom_chrono_active: { fr: "Chrono actif — consulte l'overlay", en: 'Chrono active — see overlay' },
  emom_block_done: { fr: 'Bloc terminé', en: 'Block done' },

  // ── ProfilePage · sections ──────────────────────────────────────────────
  profile_page_title: { fr: 'Mon Profil', en: 'My Profile' },
  profile_section_subscription: { fr: 'Mon abonnement', en: 'My subscription' },
  profile_section_photo: { fr: 'Photo de profil', en: 'Profile picture' },
  profile_section_photo_sub: { fr: 'Ajoute ta photo pour personnaliser ton compte.', en: 'Add your photo to personalize your account.' },
  profile_section_photo_uploading: { fr: 'Envoi en cours…', en: 'Uploading...' },
  profile_section_program: { fr: 'Mon programme', en: 'My program' },
  profile_section_program_sub: { fr: 'Poste, niveau et fréquence hebdo', en: 'Position, level and weekly frequency' },
  profile_section_equipment: { fr: 'Mon matériel', en: 'My equipment' },
  profile_section_equipment_sub: {
    fr: 'Vacances, déplacement ou pas de salle ? Bascule en poids de corps sans perdre ta place dans le cycle.',
    en: 'Holiday, travel or no gym? Switch to bodyweight without losing your place in the program.',
  },
  profile_equipment_stay_in_program: {
    fr: 'Tu restes à la même semaine et la même phase — seuls les exercices s\'adaptent à ton matériel.',
    en: 'You stay on the same week and phase — only the exercises adapt to your equipment.',
  },
  bodyweight_morpho_warning_title: {
    fr: 'Poids corps requis pour les charges d\'entrée',
    en: 'Body weight required for entry loads',
  },
  bodyweight_morpho_warning_body: {
    fr: 'En programme poids de corps, on estime la charge de chaque exercice (pompes, fentes…) à partir de ton poids renseigné. Sans morphologie dans le profil, les champs charge restent vides à la première séance.',
    en: 'On the bodyweight program, we estimate each exercise load (push-ups, lunges…) from your profile weight. Without morphology in your profile, load fields stay empty on your first session.',
  },
  bodyweight_morpho_warning_cta: {
    fr: 'Renseigner mon poids →',
    en: 'Add my weight →',
  },
  profile_section_play: { fr: 'Infos de jeu', en: 'Game info' },
  profile_section_play_sub: { fr: 'Saison détectée et prochain match', en: 'Detected season and next match' },
  profile_section_preferences: { fr: 'Préférences', en: 'Preferences' },
  profile_section_preferences_sub: { fr: 'Langue et morphologie', en: 'Language and body metrics' },
  profile_section_lang: { fr: 'Langue', en: 'Language' },
  profile_section_lang_sub: { fr: "Français ou English pour les noms d'exercices", en: 'French or English for exercise names' },
  profile_section_morpho: { fr: 'Morphologie', en: 'Morphology' },
  profile_section_morpho_sub: { fr: 'Taille, poids et IMC', en: 'Height, weight and BMI' },
  profile_section_progress: { fr: 'Ma progression', en: 'My progress' },
  profile_section_progress_sub: { fr: 'Adhérence, historique de séances, tests physiques et records.', en: 'Adherence, session history, physical tests and records.' },
  profile_section_progress_cta: { fr: 'Voir ma progression', en: 'View my progress' },
  profile_section_open: { fr: 'Ouvrir', en: 'Open' },
  profile_section_club_off: { fr: 'Mes séances, mon club', en: 'My sessions, my club' },
  profile_section_club_in: { fr: 'Mon club', en: 'My club' },
  profile_section_club_off_sub: { fr: 'Ton club + jours de muscu librement choisis en inter-saison.', en: 'Your club + freely chosen gym days during off-season.' },
  profile_section_club_in_sub: { fr: "Club FFR, compétition, planning d'entraînement et jour de match.", en: 'FFR club, competition, training schedule, and match day.' },
  profile_section_billing: { fr: 'Abonnement & accès', en: 'Subscription & access' },
  profile_section_billing_sub: { fr: 'La sécurité et le programme de base restent inclus, quel que soit le plan.', en: 'Security and the core program stay included, regardless of plan.' },
  profile_section_account: { fr: 'Compte & données', en: 'Account & data' },
  profile_section_account_sub: { fr: 'Gère tes informations légales, la confidentialité et la suppression de compte.', en: 'Manage your legal info, privacy and account deletion.' },
  profile_reset_label: { fr: 'Réinitialiser le profil', en: 'Reset profile' },
  profile_reset_hint: { fr: 'Efface tes réponses (poste, niveau, morphologie…) pour repartir de zéro. Ton compte et ton abonnement sont conservés.', en: 'Clears your answers (position, level, morphology…) to start fresh. Your account and subscription are kept.' },
  profile_reset_open: { fr: 'Réinitialiser', en: 'Reset' },
  profile_section_notifs: { fr: "Rappels d'entraînement", en: 'Training reminders' },

  // ── ProfilePage · form labels & helpers ─────────────────────────────────
  profile_label_position: { fr: 'Poste', en: 'Position' },
  profile_label_training_level: { fr: "Niveau d'entraînement", en: 'Training level' },
  profile_label_situation: { fr: 'Ma situation', en: 'My situation' },
  profile_situation_program_adapted: { fr: 'Programme adapté à :', en: 'Program adapted to:' },
  profile_situation_not_my_case: { fr: "Ce n'est pas mon cas ?", en: "That's not my case?" },
  profile_situation_home_banner_hint: {
    fr: 'Pour ajuster la fin de saison, utilise la suggestion sur l’accueil.',
    en: 'To adjust the end of season, use the suggestion on the home screen.',
  },
  profile_situation_treve_next_match_weeks: {
    fr: 'Prochain match dans {weeks} semaines — trêve au calendrier',
    en: 'Next match in {weeks} weeks — break detected on your calendar',
  },
  profile_situation_treve_detected: {
    fr: 'Trêve détectée au calendrier',
    en: 'Break detected on your calendar',
  },
  profile_situation_treve_readonly_hint: {
    fr: 'Le programme s’adapte automatiquement. Pas besoin de clôturer la saison ici.',
    en: 'Your program adapts automatically. No need to end the season here.',
  },
  profile_situation_auto_offseason_detected: {
    fr: 'Inter-saison détectée — {days} jours depuis ton dernier match',
    en: 'Off-season detected — {days} days since your last match',
  },
  profile_situation_auto_offseason_detected_short: {
    fr: 'Inter-saison détectée',
    en: 'Off-season detected',
  },
  profile_situation_auto_offseason_hint: {
    fr: 'Confirme pour enregistrer la fin de saison et adapter ton programme.',
    en: 'Confirm to record the end of season and adapt your program.',
  },
  profile_situation_confirm_end_season: {
    fr: 'Confirmer',
    en: 'Confirm',
  },
  profile_label_situation_change_q: { fr: 'Quelque chose a changé ?', en: 'Anything changed?' },
  profile_label_season_detected: { fr: 'Saison détectée', en: 'Detected season' },
  profile_label_next_match: { fr: 'Prochain match', en: 'Next match' },
  profile_label_no_match: { fr: 'Aucun match prévu', en: 'No match scheduled' },
  profile_label_sessions_per_week: { fr: 'Séances / semaine', en: 'Sessions / week' },
  profile_program_sessions_summary: {
    fr: 'Programme : {n} séances de préparation physique par semaine.',
    en: 'Program: {n} strength sessions per week.',
  },
  profile_sessions_gym_hint: {
    fr: 'Les jours de musculation au club se règlent dans',
    en: 'Gym days at the club are set in',
  },
  profile_sessions_gym_link: { fr: 'la section Mon club', en: 'the My club section' },
  profile_label_height: { fr: 'Taille (cm)', en: 'Height (cm)' },
  profile_label_weight: { fr: 'Poids (kg)', en: 'Weight (kg)' },
  profile_situation_offseason_active: { fr: 'Inter-saison active — programme adapté', en: 'Off-season active — program adapted' },
  profile_situation_preseason_active: { fr: 'Pré-saison active — programme de reprise', en: 'Pre-season active — return-to-training program' },
  profile_situation_return_hint: { fr: 'La saison reprend bientôt ? Indique ta date de reprise au club.', en: 'Season starts soon? Enter your club return date.' },
  profile_situation_modify: { fr: 'Modifier', en: 'Edit' },
  profile_skip_recovery_intro_hint: {
    fr: "Les 2 premières semaines d'inter-saison sont dédiées à la récupération (2 séances gym guidées). Tu peux les sauter si tu préfères enchaîner directement sur la phase Transition.",
    en: 'The first 2 off-season weeks focus on recovery (2 guided gym sessions). You can skip them if you prefer to jump straight into the Transition phase.',
  },
  profile_skip_recovery_intro_btn: { fr: 'Passer la récup guidée — passer à la Transition', en: 'Skip guided recovery — go to Transition' },
  profile_skip_recovery_intro_undo: { fr: 'Réactiver les semaines récupération du début', en: 'Bring back the opening recovery weeks' },

  // ── ProfilePage · BMI variants (Profile uses slightly different copy than Onboarding) ─
  profile_bmi_light_forward: { fr: 'Plutôt léger pour un avant', en: 'A bit light for a forward' },

  // ── ProfilePage · CYCLE_LABELS (situation card) ────────────────────────
  profile_cycle_playoffs: { fr: 'Phase finale', en: 'Knockouts' },

  // ── ProfilePage · cancel reasons (Stripe/Play cancellation) ────────────
  profile_cancel_too_expensive: { fr: 'Trop cher', en: 'Too expensive' },
  profile_cancel_not_useful: { fr: "Je n'utilise pas assez les fonctions Pro", en: "I don't use Pro features enough" },
  profile_cancel_missing_features: { fr: 'Il manque des fonctionnalités', en: 'Missing features' },
  profile_cancel_bugs: { fr: 'Trop de bugs ou problèmes techniques', en: 'Too many bugs or technical issues' },
  profile_cancel_season_over: { fr: 'Ma saison est terminée', en: 'My season is over' },
  profile_cancel_other: { fr: 'Autre', en: 'Other' },
  profile_cancel_thanks: { fr: 'Merci pour ton retour.', en: 'Thanks for your feedback.' },
  profile_cancel_redirect_play_pre: { fr: 'Tu vas être redirigé vers Google Play. Appuie sur', en: 'You will be redirected to Google Play. Tap' },
  profile_cancel_redirect_play_btn: { fr: "Annuler l'abonnement", en: 'Cancel subscription' },
  profile_cancel_redirect_play_suffix: { fr: 'pour finaliser.', en: 'to finalize.' },
  profile_cancel_placeholder: { fr: 'Un détail à partager ? (optionnel)', en: 'Anything to share? (optional)' },

  // ── ProfilePage · Pro upsell ────────────────────────────────────────
  profile_premium_upsell_title: { fr: 'Débloque les fonctionnalités avancées', en: 'Unlock advanced features' },
  profile_premium_upsell_body: { fr: 'Score de forme, bilan de semaine, records personnels, suggestions de charge, analytics détaillées et chat IA illimité.', en: 'Fitness score, weekly summary, personal records, load suggestions, detailed analytics and unlimited AI chat.' },
  profile_premium_go: { fr: 'Passer en Pro', en: 'Upgrade to Pro' },
  profile_plan_monthly: { fr: 'Mensuel', en: 'Monthly' },
  profile_plan_yearly: { fr: 'Annuel', en: 'Yearly' },
  profile_plan_monthly_legal: { fr: "Abonnement mensuel à 5,99 €/mois. Renouvellement automatique. Annulable à tout moment via Google Play.", en: 'Monthly subscription at €5.99/month. Auto-renewing. Cancel anytime via Google Play.' },
  profile_plan_yearly_legal: { fr: "Abonnement annuel à 64,99 €/an. Renouvellement automatique. Annulable à tout moment via Google Play.", en: 'Yearly subscription at €64.99/year. Auto-renewing. Cancel anytime via Google Play.' },
  profile_premium_activate: { fr: 'Activer Pro', en: 'Activate Pro' },
  profile_premium_preparing: { fr: 'Préparation…', en: 'Preparing…' },

  // ── ProfilePage · Account & data links ─────────────────────────────────
  profile_legal_link: { fr: 'Mentions légales et confidentialité', en: 'Legal & privacy' },
  profile_feedback_link: { fr: 'Envoyer un feedback', en: 'Send feedback' },
  profile_delete_link: { fr: 'Demander la suppression du compte', en: 'Request account deletion' },

  // ── ProfilePage · Notifications status ─────────────────────────────────
  profile_notif_subscribed: { fr: 'Activés — notification chaque jour de séance', en: 'On — notification each training day' },
  profile_notif_denied: { fr: 'Bloqués — autorise les notifs dans les réglages', en: 'Blocked — enable notifications in settings' },
  profile_notif_unsupported: { fr: 'Non supporté par ce navigateur', en: 'Not supported by this browser' },
  profile_notif_no_vapid: { fr: 'Configuration manquante (VAPID)', en: 'Missing configuration (VAPID)' },
  profile_notif_idle: { fr: 'Reçois un push chaque jour de séance', en: 'Get a push each training day' },
  profile_notif_rest_hint: {
    fr: 'Les alertes de fin de repos utilisent la même permission système.',
    en: 'Rest-timer alerts use the same system permission.',
  },

  // ── Notification opt-in (soft prompt) ───────────────────────────────────
  notif_prompt_onboarding_aria: { fr: 'Activer les rappels', en: 'Enable reminders' },
  notif_prompt_rest_aria: { fr: 'Alertes fin de repos', en: 'Rest timer alerts' },
  notif_prompt_onboarding_eyebrow: { fr: 'Dernière étape', en: 'Last step' },
  notif_prompt_rest_eyebrow: { fr: 'Pendant ta séance', en: 'During your session' },
  notif_prompt_onboarding_title: { fr: 'Activer les rappels ?', en: 'Enable reminders?' },
  notif_prompt_rest_title: { fr: 'Alerte quand le repos est fini ?', en: 'Alert when rest is over?' },
  notif_prompt_onboarding_body: {
    fr: 'Un petit rappel le matin de tes jours de séance — tu peux désactiver à tout moment dans ton profil.',
    en: 'A gentle reminder on your training mornings — you can turn it off anytime in your profile.',
  },
  notif_prompt_rest_body: {
    fr: 'Si tu quittes l’app pendant le repos, on te prévient quand c’est reparti. Pratique entre deux séries.',
    en: 'If you leave the app during rest, we notify you when time is up. Handy between sets.',
  },
  notif_prompt_onboarding_bullet_training: {
    fr: 'Rappel push le matin de tes jours de muscu',
    en: 'Push reminder on your gym days',
  },
  notif_prompt_onboarding_bullet_rest: {
    fr: 'Alerte locale à la fin du temps de repos',
    en: 'Local alert when rest ends',
  },
  notif_prompt_onboarding_bullet_profile: {
    fr: 'Désactivable à tout moment dans Profil',
    en: 'Can be turned off anytime in Profile',
  },
  notif_prompt_enable: { fr: 'Activer les rappels', en: 'Enable reminders' },
  notif_prompt_enable_rest: { fr: 'Activer les alertes', en: 'Enable alerts' },
  notif_prompt_later: { fr: 'Plus tard', en: 'Not now' },
  notif_prompt_enabling: { fr: 'Activation…', en: 'Enabling…' },
  notif_prompt_privacy_note: {
    fr: 'Tu choisis — aucune notification sans ton accord. Réglages dans Profil.',
    en: 'Your choice — no notifications without your consent. Manage in Profile.',
  },

  // ── ProfilePage · Avatar errors & UI ────────────────────────────────────
  profile_avatar_aria: { fr: 'Changer la photo de profil', en: 'Change profile picture' },
  profile_avatar_crop_title: { fr: 'Recadrer la photo', en: 'Crop photo' },
  profile_avatar_crop_sub: { fr: 'Centre ton visage puis ajuste le zoom.', en: 'Center your face then adjust zoom.' },
  profile_avatar_uploading: { fr: 'Envoi…', en: 'Uploading...' },
  profile_avatar_validate: { fr: 'Valider', en: 'Confirm' },
  profile_avatar_err_crop: { fr: "Impossible de recadrer l'image.", en: 'Unable to crop image.' },
  profile_avatar_err_update: { fr: 'Impossible de mettre à jour la photo.', en: 'Unable to update photo.' },
  profile_avatar_err_session: { fr: 'Session invalide. Reconnecte-toi.', en: 'Invalid session. Please sign in again.' },
  profile_avatar_err_rate: { fr: 'Trop de tentatives. Réessaie dans 1 à 2 minutes.', en: 'Too many attempts. Try again in 1-2 minutes.' },
  profile_avatar_err_email_conf: { fr: 'Confirme ton email pour continuer.', en: 'Confirm your email to continue.' },
  profile_avatar_err_file_type: { fr: 'Format invalide. Utilise une image JPG, PNG ou WEBP.', en: 'Invalid format. Use a JPG, PNG or WEBP image.' },
  profile_avatar_err_file_size: { fr: 'Image trop lourde. Taille max: 5 MB.', en: 'Image too large. Max size: 5 MB.' },
  profile_avatar_err_upload: { fr: 'Envoi impossible pour le moment.', en: 'Upload failed for now.' },

  // ── ProfilePage · footer ─────────────────────────────────────────────────
  profile_situation_resume: { fr: 'Je rejoue déjà', en: "I'm playing again" },
  profile_situation_no_match_now: { fr: "Je n'ai plus de match pour l'instant", en: 'No upcoming matches for now' },

  // ── BottomNav ───────────────────────────────────────────────────────────
  nav_home: { fr: 'Accueil', en: 'Home' },
  nav_program: { fr: 'Semaine', en: 'Week' },
  nav_profile: { fr: 'Profil', en: 'Profile' },
  nav_coach: { fr: 'Coach', en: 'Coach' },

  staff_players: { fr: 'Joueurs', en: 'Players' },
  staff_fatigue_alerts: { fr: 'Alertes fatigue', en: 'Fatigue alerts' },
  staff_empty_roster: {
    fr: 'Aucun joueur lié à ce club pour l’instant.',
    en: 'No players linked to this club yet.',
  },
  staff_empty_roster_hint: {
    fr: 'Chaque joueur doit avoir rejoint le club dans son profil (code FFR). Utilise le panneau admin → « Backfill clubs » si besoin.',
    en: 'Each player must join the club in their profile (FFR code). Use admin → “Backfill clubs” if needed.',
  },
  staff_club_id_mismatch: {
    fr: 'Le club_id coach ne correspond pas au code club de ton profil — corrige-le dans le panneau admin.',
    en: 'Coach club_id does not match your profile club code — fix it in the admin panel.',
  },
  admin_backfill_clubs: { fr: 'Backfill clubs (profils → joueurs)', en: 'Backfill clubs (profiles → players)' },
  admin_panel_link: { fr: 'Panneau admin', en: 'Admin panel' },

  // ── PageHeader (aria-labels) ────────────────────────────────────────────
  page_header_back: { fr: 'Retour', en: 'Back' },
  page_header_profile: { fr: 'Voir mon profil', en: 'View my profile' },

  // ── Badge de statut de compte (TierBadge) ───────────────────────────────
  account_tier_pro_label: { fr: 'PRO', en: 'PRO' },
  account_tier_free_label: { fr: 'FREE', en: 'FREE' },
  account_tier_pro_aria: { fr: 'Compte Pro', en: 'Pro account' },
  account_tier_free_aria: { fr: 'Compte gratuit — passer en Pro', en: 'Free account — upgrade to Pro' },

  // ── FoundingOffer modal ─────────────────────────────────────────────────
  founding_eyebrow: { fr: 'Offre Founding', en: 'Founding Offer' },
  founding_title_pre: { fr: 'Bloque ton tarif Founding', en: 'Lock your Founding rate' },
  founding_title_suffix: { fr: 'à vie', en: 'for life' },
  founding_body_1: { fr: "Tu as commencé ta préparation, tu sens que c'est sérieux. Cette offre est réservée aux premiers utilisateurs : 49€/an, à vie, même quand on monte les prix.", en: "You've started your prep — it's getting serious. This offer is for early users only: €49/year, for life, even when we raise prices later." },
  founding_body_2: { fr: "Inclut tout l'abonnement Pro : adaptations programme, analyses avancées, mode coach, support prioritaire. Annulable à tout moment.", en: 'Includes full Pro: program adaptations, advanced analytics, coach mode, priority support. Cancel anytime.' },
  founding_redirecting: { fr: 'Redirection…', en: 'Redirecting…' },
  founding_become: { fr: 'Devenir Founding — 49€/an à vie', en: 'Become Founding — €49/year for life' },
  founding_later: { fr: 'Plus tard', en: 'Later' },
  founding_cohort_sold_out_title: { fr: 'Offre Founding complète', en: 'Founding offer is full' },
  founding_cohort_sold_out_body: {
    fr: 'Les 100 premières places ont été attribuées. Tu peux toujours passer sur Pro depuis ton profil.',
    en: 'All 100 Founding spots are taken. You can still subscribe to Pro from your profile.',
  },
  founding_cohort_sold_out_note: {
    fr: 'Merci pour ton intérêt — on te prévient lors des prochaines ouvertures.',
    en: 'Thanks for your interest—we will share news on future openings.',
  },
  profile_founding_card_title: { fr: 'Offre Founding (premiers utilisateurs)', en: 'Founding offer (early users)' },
  profile_founding_card_body: {
    fr: '49€/an à vie tant que l’offre est disponible — tout Pro inclus. Tu peux aussi rouvrir la fenêtre depuis le lien ci-dessous.',
    en: '€49/year for life while the offer lasts — full Pro included. You can reopen the offer sheet via the link below.',
  },
  profile_founding_reopen: { fr: 'Rouvrir la fenêtre Founding', en: 'Re-open Founding sheet' },

  // ── CookieConsentBanner (CNIL) ──────────────────────────────────────────
  cookie_aria: { fr: 'Préférences cookies', en: 'Cookie preferences' },
  cookie_body: { fr: "Nous utilisons des cookies techniques (toujours actifs) pour faire fonctionner l'application. Avec ton accord, nous mesurons aussi son usage via PostHog (UE) pour l'améliorer.", en: 'We use technical cookies (always on) to run the app. With your consent, we also measure usage via PostHog (EU) to improve it.' },
  cookie_learn_more: { fr: 'En savoir plus', en: 'Learn more' },
  cookie_decline: { fr: 'Refuser', en: 'Decline' },
  cookie_accept: { fr: 'Accepter', en: 'Accept' },

  // ── FeedbackPage remaining ──────────────────────────────────────────────
  feedback_page_title: { fr: 'Envoyer un feedback', en: 'Send feedback' },
  feedback_intro_title: { fr: 'Aide-nous à améliorer RugbyForge', en: 'Help us improve RugbyForge' },
  feedback_intro_body: { fr: 'Décris en quelques mots ce qui ne marche pas, ce qui manque, ou ce qui te dérange. Tous les retours sont lus pendant la phase bêta.', en: "Tell us in a few words what doesn't work, what's missing, or what bothers you. All feedback is read during the beta phase." },
  feedback_kind_label: { fr: 'Type de retour', en: 'Feedback type' },
  feedback_message_label: { fr: 'Ton message', en: 'Your message' },
  feedback_message_placeholder: { fr: "Ex : sur l'écran Semaine, la carte du match disparaît si je passe en mode avion puis reviens…", en: 'Ex: on the Week screen, the match card disappears if I switch to airplane mode then back…' },
  feedback_send: { fr: 'Envoyer le feedback', en: 'Send feedback' },
  feedback_sending: { fr: 'Envoi…', en: 'Sending…' },
  feedback_sent: { fr: 'Envoyé', en: 'Sent' },
  feedback_footer_pre: { fr: 'Tu peux aussi écrire directement à', en: 'You can also email' },
  feedback_footer_or: { fr: 'ou retourner à', en: 'or go back to' },
  feedback_footer_profile: { fr: 'ton profil', en: 'your profile' },
  feedback_must_be_logged: { fr: 'Tu dois être connecté pour envoyer un feedback.', en: 'You must be signed in to send feedback.' },

  // ── BadgesStrip ─────────────────────────────────────────────────────────
  badges_eyebrow: { fr: 'Tes jalons', en: 'Your milestones' },
  badges_view_all: { fr: 'Tout voir', en: 'View all' },
  badges_new: { fr: 'Nouveau', en: 'New' },

  // ── StreakCard ──────────────────────────────────────────────────────────
  streak_eyebrow: { fr: 'Ta cadence', en: 'Your streak' },
  streak_session_single: { fr: 'séance', en: 'session' },
  streak_session_plural: { fr: 'séances', en: 'sessions' },

  // ── NextMatchEditorialCard ─────────────────────────────────────────────
  match_venue_neutral: { fr: 'Neutre', en: 'Neutral' },
  match_venue_home: { fr: 'Domicile', en: 'Home' },
  match_venue_away: { fr: 'Extérieur', en: 'Away' },
  match_opponent_tbd: { fr: 'Adversaire à confirmer', en: 'Opponent TBD' },
  match_in: { fr: 'Dans', en: 'In' },
  match_vs: { fr: 'vs.', en: 'vs.' },

  // ── PlayoffsThinBanner ──────────────────────────────────────────────────
  playoffs_aria: { fr: 'Activer le mode Playoffs', en: 'Enable Playoffs mode' },
  playoffs_title: { fr: 'Phase finale ?', en: 'Knockouts?' },
  playoffs_body: { fr: "Active le mode Playoffs · programme d'affûtage", en: 'Enable Playoffs mode · taper program' },

  // ── ScoreDeFormeTeaser ──────────────────────────────────────────────────
  score_teaser_aria: { fr: 'Score de forme — débloquer Pro', en: 'Fitness score — unlock Pro' },
  score_teaser_pro: { fr: 'Pro', en: 'Pro' },
  score_teaser_title_1: { fr: 'Mesure ta forme,', en: 'Track your fitness,' },
  score_teaser_title_2: { fr: 'jour après jour.', en: 'day after day.' },
  score_teaser_subtext: { fr: 'Charge · sommeil · récup · IA coach', en: 'Load · sleep · recovery · AI coach' },
  score_teaser_cta: { fr: 'Débloquer Pro', en: 'Unlock Pro' },

  // ── ScoreDeFormeCard (Pro) ───────────────────────────────────────────────
  score_card_eyebrow: { fr: 'Score de forme · Aujourd\'hui', en: 'Fitness score · Today' },
  score_card_composite_hint: {
    fr: 'Indicateur composite : charge ACWR, ressenti, récence séance et match à venir — pas un test physique.',
    en: 'Composite indicator: ACWR load, how you feel, session recency and upcoming match — not a physical test.',
  },
  score_card_trend: { fr: '7 derniers jours', en: 'Last 7 days' },
  score_card_coach: { fr: 'IA Coach', en: 'AI Coach' },
  score_card_pillar_soon: { fr: 'Bientôt', en: 'Coming soon' },

  // ── ClubSettingsSection (extras non couverts par les keys déjà existantes) ─
  club_no_fixed_day: { fr: 'Pas de jour fixe', en: 'No fixed day' },
  club_offseason_note: { fr: 'Pas de matchs ni de planning club en inter-saison — ces réglages reviendront à la reprise.', en: 'No matches or club schedule during off-season — these settings return at season restart.' },
  club_sessions_per_week_3: { fr: 'Jours muscu — 3 séances par semaine', en: 'Gym days — 3 sessions per week' },
  club_sessions_per_week_2: { fr: 'Jours muscu — 2 séances par semaine', en: 'Gym days — 2 sessions per week' },
  club_remove: { fr: 'Retirer', en: 'Remove' },
  club_label: { fr: 'Club', en: 'Club' },
  club_ffr_competition: { fr: 'Compétition FFR', en: 'FFR competition' },
  club_import_unavailable: { fr: 'Import auto non disponible pour ce club.', en: 'Auto-import unavailable for this club.' },
  club_sync_auto: { fr: 'Synchronisation automatique activée', en: 'Auto-sync enabled' },
  club_refresh_ffr: { fr: 'Actualiser FFR', en: 'Refresh FFR' },
  club_change_competition: { fr: 'Changer de compétition', en: 'Change competition' },
  club_training_days: { fr: "Jours d'entraînement club", en: 'Club training days' },
  club_match_day: { fr: 'Jour de match habituel', en: 'Usual match day' },
  club_gym_sessions: { fr: 'Séances muscu', en: 'Gym sessions' },
  club_toggle_auto: { fr: 'Auto', en: 'Auto' },
  club_toggle_manual: { fr: 'Manuel', en: 'Manual' },
  club_suggestion: { fr: 'Suggestion calculée', en: 'Computed suggestion' },
  club_suggestion_hint: { fr: 'Basé sur ton planning club et les règles de récup.', en: 'Based on your club schedule and recovery rules.' },
  club_no_suggestion: { fr: "Sélectionne tes jours d'entraînement club pour obtenir une suggestion.", en: 'Select your club training days to get a suggestion.' },

  // ── WeekPage · upsell match proche ──────────────────────────────────────
  week_upsell_match_title: { fr: 'Match dans les prochains jours', en: 'Match coming up soon' },
  week_upsell_match_body: {
    fr: 'Adapte ta semaine automatiquement en fonction du match — Pro.',
    en: 'Adapt your week automatically around the match — Pro.',
  },
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
      // Legacy profil DB : affiché comme Performance (plus de tier Builder à l’UI).
      return tr('level_performance', lang)
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

// ── Position helpers (rugby positions short form, used in ProgressPage) ────

const POSITION_SHORT_KEY: Record<string, AppLabelKey> = {
  FRONT_ROW: 'progress_pos_front_row',
  SECOND_ROW: 'progress_pos_second_row',
  BACK_ROW: 'progress_pos_back_row',
  HALF_BACKS: 'progress_pos_half_backs',
  CENTERS: 'progress_pos_centers',
  BACK_THREE: 'progress_pos_back_three',
}

/** Short form for rugby position used in tests baseline display ("1ère ligne"). */
export function positionShortLabel(value: string | null | undefined, lang: Lang = 'fr'): string | null {
  if (!value) return null
  const key = POSITION_SHORT_KEY[value]
  return key ? tr(key, lang) : null
}
