import { MS_DIRECTIVE_FR_MAP } from './motherSessionDirectiveFr'
import { MS_EXERCISE_FR_MAP } from './motherSessionExerciseFr'
import { normalizeExerciseName } from './motherSessionExerciseMap'

export type Lang = 'fr' | 'en'

/**
 * Renvoie le nom d'un exercice Mother Session dans la langue voulue.
 *
 * Source de vérité unique : `docs/exercises-i18n-lexicon.md` (auto-généré en
 * `motherSessionExerciseFr.ts`).
 *
 *  - `lang === 'fr'` : lookup dans le lexique (clé EN normalisée). Si miss,
 *    renvoie le nom brut (anglais par convention dans les MD `docs/training/`).
 *  - `lang === 'en'` : renvoie le nom brut directement. Le catalogue
 *    `exercises.v1.json` est FR-only (`name` = `nameFr`), donc passer par lui
 *    pour l'anglais ne marche pas — le brut MD est la seule vraie source EN.
 *
 * Directives (ex. `2 progressive ramp-up sets`) : `motherSessionDirectiveFr.ts`.
 *
 * Catalogue `getExerciseName(id, lang)` reste utilisé en parallèle pour les
 * contextes loggables (PR cards, historique, ProgressPage). Ne pas réutiliser
 * ce helper-ci dans ces contextes — il est scopé aux mother sessions.
 */
export function localizeMotherSessionExerciseName(
  rawName: string | undefined,
  lang: Lang = 'fr',
): string {
  if (!rawName) return ''
  const trimmed = rawName.trim()
  if (!trimmed) return ''

  if (lang === 'fr') {
    const key = normalizeExerciseName(trimmed)
    const directiveFr = MS_DIRECTIVE_FR_MAP[key]
    if (directiveFr) return directiveFr
    const fr = MS_EXERCISE_FR_MAP[key]
    if (fr) return fr
  }

  return trimmed
}
