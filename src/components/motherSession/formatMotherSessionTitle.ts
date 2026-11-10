import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import {
  contentFamilyLabel,
  parseUpperLaneTokenFromSessionId,
  upperContrastLaneLabel,
  type ContentFamily,
} from '../../data/contentFamily'
import {
  benchWaveLabel,
  resolveBenchWavePhase,
} from '../../services/session/applyBenchWavePrescription'

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
    'SECOND',
    'HALF',
    'BACKS',
    'CENTERS',
    'COMMON',
    'BASE',
    'PHASE',
    // Variantes A/B ou rotation in-season : pas de valeur pour le joueur dans le titre.
    'B',
    'TBRDL',
    'FRONTSQUAT',
    'PAUSEJUMP',
    'RDL',
    'SLHIP',
    'SHRUG',
    'CHESTPASS',
    'LANDMINE',
    'SUPINE',
    'PLYO',
    'ROTATIONAL',
    'PUSHPRESS',
    'BW',
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
  OFFSEASON: 'Inter-saison',
  TRANSITION: 'Transition',
}

const TITLE_OVERRIDES: Record<string, Record<AppLang, string>> = {
  // Pack = lane avants 1–8 (pas « 1ère ligne »). Affiné via contentFamily (3ème / 2ème ligne).
  FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1:  { fr: 'Power-up · Pack',                    en: 'Light Primer · Pack' },
  FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_B_V1:{ fr: 'Power-up · Pack',                    en: 'Light Primer · Pack' },
  FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1: { fr: 'Power-up · Ligne arrière',           en: 'Light Primer · Back Three' },
  FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_B_V1:{ fr: 'Power-up · Ligne arrière',          en: 'Light Primer · Back Three' },
  FULL_BODY_IN_SEASON_FRONT_ROW_V1:          { fr: 'Corps complet · Pack',                en: 'Full Body · Pack' },
  FULL_BODY_IN_SEASON_FRONT_ROW_B_V1:        { fr: 'Corps complet · Pack',                en: 'Full Body · Pack' },
  FULL_BODY_IN_SEASON_BACK_THREE_V1:         { fr: 'Corps complet · Ligne arrière',       en: 'Full Body · Back Three' },
  FULL_BODY_IN_SEASON_BACK_THREE_B_V1:       { fr: 'Corps complet · Ligne arrière',       en: 'Full Body · Back Three' },
  // Recovery sessions — titre correct pour off-season ET recovery override in-season.
  FULL_OFFSEASON_RECOVERY_A_V1:              { fr: 'Récupération · Début de semaine',     en: 'Recovery · Early week' },
  FULL_OFFSEASON_RECOVERY_B_V1:              { fr: 'Récupération · Fin de semaine',       en: 'Recovery · Late week' },
}

/** Libellé lane pack pour titres FULL_*_FRONT_ROW (jamais « Avants » / FRONT_ROW brut). */
export function packLaneTitleLabel(
  family: ContentFamily | null | undefined,
  lang: AppLang = 'fr',
): string {
  if (family === 'back_row' || family === 'second_row') {
    return contentFamilyLabel(family, lang === 'en' ? 'en' : 'fr')
  }
  return lang === 'en' ? 'Pack' : 'Pack'
}

function refineFrontRowPackTitle(
  title: string,
  id: string,
  lang: AppLang,
  family: ContentFamily | null | undefined,
): string {
  if (!/_FRONT_ROW/i.test(id)) return title
  const lane = packLaneTitleLabel(family, lang)
  const refined = title
    .replace(/· Avants$/i, `· ${lane}`)
    .replace(/· Front Row$/i, `· ${lane}`)
    .replace(/· Pack$/i, `· ${lane}`)
  if (refined !== title) return refined
  // Pré Power etc. : pas de suffixe pack → ajouter 2ᵉ/3ᵉ ligne seulement.
  if (family === 'back_row' || family === 'second_row') {
    const sep = lang === 'fr' ? ' · ' : ' - '
    if (!title.includes(lane)) return `${title}${sep}${lane}`
  }
  return title
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
 * `opts.contentFamily` affine Pack → 3ème / 2ème ligne sur IDs `*_FRONT_ROW*`.
 */
export function formatTitleFromMotherSessionId(
  id: string,
  lang: AppLang = 'en',
  opts?: { contentFamily?: ContentFamily | null },
): string {
  const override = TITLE_OVERRIDES[id]
  let title: string
  if (override) {
    title = override[lang]
  } else {
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
      if (restMeaningful.length === 0) {
        title = primer
      } else {
        const labels = restMeaningful.map((t) => tokenToLabel(t, lang)).filter(Boolean)
        title = labels.length === 0 ? primer : `${primer}${sep}${labels[labels.length - 1]}`
      }
    } else {
      const meaningful = tokens.filter(
        (t) => !/^\d+$/.test(t) && !POSITION_CYCLE_SKIP.has(t.toUpperCase())
      )
      if (meaningful.length === 0) {
        title = titleCaseToken(core.replace(/_/g, ' ').trim()) || id
      } else {
        const labels = meaningful.map((t) => tokenToLabel(t, lang)).filter(Boolean)
        if (labels.length === 0) title = id
        else if (labels.length === 1) title = labels[0]
        else {
          const first = labels[0]
          const last = labels[labels.length - 1]
          title = first === last ? first : `${first}${sep}${last}`
        }
      }
    }
  }

  return refineFrontRowPackTitle(title, id, lang, opts?.contentFamily)
}

const FAMILY_FROM_ID: Record<string, ContentFamily> = {
  FRONT_ROW: 'front_row',
  SECOND_ROW: 'second_row',
  BACK_ROW: 'back_row',
  HALF_BACKS: 'half_backs',
  CENTERS: 'centers',
  BACK_THREE: 'back_three',
}

export function contentFamilyFromMotherSessionId(id: string): ContentFamily | null {
  const m = id.match(
    /^(?:UPPER|LOWER)(?:_BW)?_IN_SEASON_(FRONT_ROW|SECOND_ROW|BACK_ROW|HALF_BACKS|CENTERS|BACK_THREE)/i,
  )
  if (!m) return null
  return FAMILY_FROM_ID[m[1].toUpperCase()] ?? null
}

function bwAbVariantFromSessionId(id: string): 'A' | 'B' | null {
  const m = id.match(/_BW_IN_SEASON_[A-Z_]+_(A|B)_V1$/i)
  if (!m) return null
  return m[1].toUpperCase() as 'A' | 'B'
}

/**
 * Sous-titre résolu : famille + variante Upper (jamais « lane 2 » ni BACK_ROW brut).
 */
export function formatMotherSessionSubtitle(
  id: string,
  lang: AppLang = 'fr',
  opts?: {
    mesocycleWeek?: 1 | 2 | 3 | 4
    trainingLevel?: string | null
    isMatchWeek?: boolean
    isDeloadWeek?: boolean
    preMatchNoHeavy?: boolean
    dayPreference?: 'early_week' | 'mid_week' | 'late_week' | 'pre_match' | null
  },
): string | null {
  const family = contentFamilyFromMotherSessionId(id)
  if (!family) return null
  const familyLabel = contentFamilyLabel(family, lang === 'en' ? 'en' : 'fr')
  const parts: string[] = [familyLabel]

  const bwAb = bwAbVariantFromSessionId(id)
  if (bwAb) {
    const week = opts?.mesocycleWeek
    const held =
      week != null && week <= 2
        ? lang === 'en'
          ? 'W1–W2'
          : 'S1–S2'
        : week != null
          ? lang === 'en'
            ? 'W3–W4'
            : 'S3–S4'
          : null
    parts.push(
      held
        ? lang === 'en'
          ? `Variant ${bwAb} (${held})`
          : `Variante ${bwAb} (${held})`
        : lang === 'en'
          ? `Variant ${bwAb}`
          : `Variante ${bwAb}`,
    )
    return parts.join(' · ')
  }

  if (id.startsWith('UPPER_IN_SEASON_') && !/_BW_/i.test(id)) {
    const token = parseUpperLaneTokenFromSessionId(id)
    let contrast =
      token === 'BASE'
        ? lang === 'en'
          ? 'Plyo push contrast'
          : 'Contraste plyo poussée'
        : upperContrastLaneLabel(token, lang === 'en' ? 'en' : 'fr')
    // backs lane 0 non-match = landmine stored as LANDMINE token
    if (token === 'BASE' && /BACK_THREE|HALF_BACKS|CENTERS/i.test(id)) {
      contrast =
        lang === 'en' ? 'Landmine / chest-pass contrast' : 'Contraste landmine / chest pass'
    }
    if (contrast) parts.push(contrast)

    const week = opts?.mesocycleWeek
    if (week != null) {
      const phase = resolveBenchWavePhase({
        mesocycleWeek: week,
        isDeloadWeek: opts?.isDeloadWeek,
        isMatchWeek: opts?.isMatchWeek,
        preMatchNoHeavy: opts?.preMatchNoHeavy,
        dayPreference: opts?.dayPreference,
      })
      parts.push(
        `${benchWaveLabel(phase, lang === 'en' ? 'en' : 'fr')} (S${week})`,
      )
    }
  }

  const week = opts?.mesocycleWeek
  const level = opts?.trainingLevel
  if (week != null && (level === 'performance' || level === 'builder') && !id.startsWith('UPPER_IN_SEASON_')) {
    parts.push(
      lang === 'en'
        ? `Week ${week} of block · variant held 2 weeks`
        : `Semaine ${week} du bloc · variante conservée 2 semaines`,
    )
  } else if (week != null && !id.startsWith('UPPER_IN_SEASON_')) {
    parts.push(
      lang === 'en' ? `Week ${week} of block` : `Semaine ${week} du bloc`,
    )
  }

  return parts.join(lang === 'fr' ? ' · ' : ' · ')
}
