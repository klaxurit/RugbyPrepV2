export type AppLang = 'fr' | 'en'

// ─── Generic labels ──────────────────────────────────────────

const MS_LABELS: Record<string, Record<AppLang, string>> = {
  warm_up:               { fr: 'Échauffement',          en: 'Warm-up' },
  format:                { fr: 'Format',                 en: 'Format' },
  coaching_notes:        { fr: 'Notes de coaching',      en: 'Coaching notes' },
  alternatives:          { fr: 'Alternatives',           en: 'Alternatives' },
  block:                 { fr: 'Bloc',                   en: 'Block' },
  optional:              { fr: 'Optionnel',              en: 'Optional' },
  progression_rules:     { fr: 'Règles de progression',  en: 'Progression rules' },
  position_accent:       { fr: 'Accent positionnel',     en: 'Position accent' },
  coaching_warnings:     { fr: 'Alertes coaching',       en: 'Coaching warnings' },
  injury_substitutions:  { fr: 'Adaptations blessures',  en: 'Injury substitutions' },
  notes:                 { fr: 'Notes',                  en: 'Notes' },
  remove:                { fr: 'Retirer',                en: 'Remove' },
  replace:               { fr: 'Remplacer',              en: 'Replace' },
  rehab:                 { fr: 'Rééducation',            en: 'Rehab' },
  shoulder:              { fr: 'Épaule',                 en: 'Shoulder' },
  knee:                  { fr: 'Genou',                  en: 'Knee' },
  low_back:              { fr: 'Bas du dos',             en: 'Low Back' },
  companion_conditioning:{ fr: 'Conditionnement compagnon', en: 'Companion conditioning' },
  see_annual_plan:       { fr: 'Voir le plan annuel',    en: 'See annual plan' },
  annual_plan:           { fr: 'Plan annuel',            en: 'Annual plan' },
  sessions_of_week:      { fr: 'Séances de la semaine',  en: 'Sessions of the week' },
  out_of_gym:            { fr: 'Hors gym',               en: 'Out of gym' },
  recovery_priority:     { fr: 'Récupération prioritaire', en: 'Priority recovery' },
  light_week:            { fr: 'Semaine allégée',         en: 'Light week' },
  recovery_explanation:  { fr: 'Cette semaine est allégée pour favoriser ta récupération.', en: 'This week is lighter to support your recovery.' },
  session_early_week:    { fr: 'Début de semaine',        en: 'Early week' },
  session_mid_week:      { fr: 'Milieu de semaine',       en: 'Mid week' },
  session_late_week:     { fr: 'Fin de semaine',          en: 'Late week' },
  this_week:             { fr: 'Cette semaine',           en: 'This week' },
  light_week_chip:       { fr: 'Semaine allégée',         en: 'Light week' },
  recovery_why_title:    { fr: 'Pourquoi ?',              en: 'Why?' },
  recovery_why_body:     { fr: 'Ton ACWR indique une charge très élevée. Le programme est allégé pour favoriser ta récupération et éviter le surmenage.', en: 'Your ACWR indicates very high load. The program is lighter to support recovery and prevent overtraining.' },
  understand_session:    { fr: 'Comprendre cette séance', en: 'Understand this session' },
  sessions_unavailable:  { fr: 'Séances indisponibles',   en: 'Sessions unavailable' },
  glossary_title:        { fr: 'Lexique',                  en: 'Glossary' },
}

export function msLabel(key: string, lang: AppLang): string {
  return MS_LABELS[key]?.[lang] ?? MS_LABELS[key]?.en ?? key
}

// ─── Bridge helpers (enum value → label) ─────────────────────

const CYCLE_LABELS: Record<string, Record<AppLang, string>> = {
  in_season:  { fr: 'En saison',    en: 'In-season' },
  off_season: { fr: 'Inter-saison',  en: 'Off-season' },
  pre_season: { fr: 'Pré-saison',   en: 'Pre-season' },
  playoffs:   { fr: 'Playoffs',     en: 'Playoffs' },
}

export function msCycleLabel(cycle: string, lang: AppLang): string {
  return CYCLE_LABELS[cycle]?.[lang] ?? cycle
}

const SESSION_TYPE_LABELS: Record<string, Record<AppLang, string>> = {
  upper:             { fr: 'Haut du corps',       en: 'Upper' },
  lower:             { fr: 'Bas du corps',         en: 'Lower' },
  full:              { fr: 'Corps complet',        en: 'Full' },
  full_light_primer: { fr: 'Power-up',             en: 'Full (light primer)' },
  speed_power:       { fr: 'Vitesse / puissance',  en: 'Speed / power' },
}

export function msSessionTypeLabel(type: string, lang: AppLang): string {
  return SESSION_TYPE_LABELS[type]?.[lang] ?? type
}

const TARGET_LEVEL_LABELS: Record<string, Record<AppLang, string>> = {
  starter:     { fr: 'Fondations',     en: 'Foundations' },
  builder:     { fr: 'Avancé',         en: 'Advanced' },
  performance: { fr: 'Avancé',         en: 'Performance' },
}

export function msTargetLevelLabel(level: string, lang: AppLang): string {
  return TARGET_LEVEL_LABELS[level]?.[lang] ?? level
}

const POSITION_GROUP_LABELS: Record<string, Record<AppLang, string>> = {
  front_row:  { fr: 'Avants',         en: 'Front row' },
  back_three: { fr: 'Ligne arrière',  en: 'Back three' },
}

export function msPositionGroupLabel(group: string, lang: AppLang): string {
  const exact = POSITION_GROUP_LABELS[group]?.[lang]
  if (exact) return exact

  const humanized = group
    .replace(/front_row/gi, lang === 'fr' ? 'Avants' : 'Front row')
    .replace(/front row/gi, lang === 'fr' ? 'Avants' : 'Front row')
    .replace(/back_three/gi, lang === 'fr' ? 'Ligne arrière' : 'Back three')
    .replace(/back three/gi, lang === 'fr' ? 'Back three' : 'Back three')
    .replace(/\(common base with light accents\)/gi, lang === 'fr' ? '(base commune avec accents légers)' : '(common base with light accents)')
    .replace(/\(common base\)/gi, lang === 'fr' ? '(base commune)' : '(common base)')
    .replace(/\(phase 1 common base\)/gi, lang === 'fr' ? '(base commune phase 1)' : '(phase 1 common base)')
    .replace(/\(phase 1 common terrain base\)/gi, lang === 'fr' ? '(base terrain commune phase 1)' : '(phase 1 common terrain base)')
    .replace(/\(phase 2 common base with marked accents\)/gi, lang === 'fr' ? '(base commune phase 2 avec accents marqués)' : '(phase 2 common base with marked accents)')
    .replace(/\(phase 2 common terrain base with marked accents\)/gi, lang === 'fr' ? '(base terrain commune phase 2 avec accents marqués)' : '(phase 2 common terrain base with marked accents)')
    .replace(/\s+\+\s+/g, ' + ')
    .replace(/_/g, ' ')

  return humanized
}

const EQUIPMENT_LABELS: Record<string, Record<AppLang, string>> = {
  full_gym: { fr: 'Salle complète', en: 'Full gym' },
  minimal:  { fr: 'Minimal',        en: 'Minimal' },
}

export function msEquipmentLabel(eq: string, lang: AppLang): string {
  return EQUIPMENT_LABELS[eq]?.[lang] ?? eq.replace(/_/g, ' ')
}

// ─── Text cleanup ────────────────────────────────────────────

function collapseApproximationRanges(s: string): string {
  return s
    .replace(/\b\d+\s*min\s*\d+\s*to\s*(\d+)\s*min\b/gi, '$1 min')
    .replace(/(?<!\d-)(\+?\d+(?:\.\d+)?)\s+to\s+(\+?\d+(?:\.\d+)?)(?=\s*(?:kg|kgs|reps?|rounds?|tours?|sets?|m\b))/gi, '$2')
    .replace(/(?<!\d-)\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(?=\s*x)/g, '$2')
    .replace(/(?<=x)(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(?!-\d)/g, '$2')
    .replace(
      /(?<!\d-)\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(?!-\d)(?=\s*(?:reps?|rounds?|tours?|tour|sets?|drills?|progressive|ramp-up|rehearsal|easy|very light|light|work|min\b|kg\b|m\b|\/side|\/côté))/gi,
      '$2',
    )
}

export function stripBackticks(s: string): string {
  return collapseApproximationRanges(s.replace(/`/g, ''))
}
