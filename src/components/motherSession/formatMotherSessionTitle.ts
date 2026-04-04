import type { AppLang } from '../../services/motherSession/motherSessionLabels'

/**
 * Tokens de cycle / poste à ignorer pour un titre court (sauf séquence FULL_LIGHT_PRIMER).
 */
const POSITION_CYCLE_SKIP = new Set(
  [
    'PRESEASON',
    'IN',
    'SEASON',
    'OFF',
    'BACK',
    'THREE',
    'FRONT',
    'ROW',
    'COMMON',
    'BASE',
    'PHASE',
  ].map((s) => s.toUpperCase())
)

const TOKEN_FR: Record<string, string> = {
  FULL: 'Corps complet',
  LOWER: 'Bas du corps',
  UPPER: 'Haut du corps',
  FORCE: 'Force',
  POWER: 'Puissance',
  RECOVERY: 'Récupération',
  PRIMER: 'Préparation',
  LIGHT: 'Léger',
  SPEED: 'Vitesse',
  HYPERTROPHY: 'Hypertrophie',
  BODY: '',
  OFFSEASON: 'Hors-saison',
  TRANSITION: 'Transition',
}

const TITLE_OVERRIDES: Record<string, Record<AppLang, string>> = {
  FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1:  { fr: 'Power-up · Avants',                  en: 'Light Primer · Front Row' },
  FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1: { fr: 'Power-up · Ligne arrière',           en: 'Light Primer · Back Three' },
  FULL_BODY_IN_SEASON_FRONT_ROW_V1:          { fr: 'Corps complet · Avants',              en: 'Full Body · Front Row' },
  FULL_BODY_IN_SEASON_BACK_THREE_V1:         { fr: 'Corps complet · Ligne arrière',       en: 'Full Body · Back Three' },
  // Recovery sessions — titre correct pour off-season ET recovery override in-season.
  FULL_OFFSEASON_RECOVERY_A_V1:              { fr: 'Récupération · Début de semaine',     en: 'Recovery · Early week' },
  FULL_OFFSEASON_RECOVERY_B_V1:              { fr: 'Récupération · Fin de semaine',       en: 'Recovery · Late week' },
}

function titleCaseToken(token: string): string {
  if (!token) return token
  const lower = token.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function tokenToLabel(token: string, lang: AppLang): string {
  if (lang === 'fr') {
    const fr = TOKEN_FR[token.toUpperCase()]
    if (fr !== undefined) return fr
  }
  return titleCaseToken(token)
}

function findFullLightPrimerIndex(tokens: string[]): number {
  for (let i = 0; i <= tokens.length - 3; i++) {
    if (
      tokens[i].toUpperCase() === 'FULL' &&
      tokens[i + 1].toUpperCase() === 'LIGHT' &&
      tokens[i + 2].toUpperCase() === 'PRIMER'
    ) {
      return i
    }
  }
  return -1
}

/**
 * Ex. `LOWER_PRESEASON_FORCE_V1` → FR: `Bas du corps · Force` / EN: `Lower - Force`
 */
export function formatTitleFromMotherSessionId(id: string, lang: AppLang = 'en'): string {
  const override = TITLE_OVERRIDES[id]
  if (override) return override[lang]

  const core = id.replace(/_V\d+$/i, '').trim()
  const tokens = core.split('_').filter(Boolean)
  if (tokens.length === 0) return id

  const sep = lang === 'fr' ? ' · ' : ' - '

  const primerIdx = findFullLightPrimerIndex(tokens)
  if (primerIdx >= 0) {
    const rest = [...tokens.slice(0, primerIdx), ...tokens.slice(primerIdx + 3)]
    const restMeaningful = rest.filter(
      (t) => !/^\d+$/.test(t) && !POSITION_CYCLE_SKIP.has(t.toUpperCase())
    )
    const primer = lang === 'fr' ? 'Power-up' : 'Full - Light Primer'
    if (restMeaningful.length === 0) return primer
    const labels = restMeaningful.map((t) => tokenToLabel(t, lang)).filter(Boolean)
    if (labels.length === 0) return primer
    return `${primer}${sep}${labels[labels.length - 1]}`
  }

  const meaningful = tokens.filter(
    (t) => !/^\d+$/.test(t) && !POSITION_CYCLE_SKIP.has(t.toUpperCase())
  )
  if (meaningful.length === 0) {
    return titleCaseToken(core.replace(/_/g, ' ').trim()) || id
  }

  const labels = meaningful.map((t) => tokenToLabel(t, lang)).filter(Boolean)
  if (labels.length === 0) return id
  if (labels.length === 1) return labels[0]

  const first = labels[0]
  const last = labels[labels.length - 1]
  if (first === last) return first
  return `${first}${sep}${last}`
}
