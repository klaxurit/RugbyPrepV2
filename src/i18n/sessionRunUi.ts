import type { Lang } from './appLabels'

/** Libellé secondaire du timer de repos après la fin d'un tour (sticky séance). */
export function restTimerAfterTourLine(tourOneBased: number, lang: Lang): string {
  return lang === 'en' ? `End of round ${tourOneBased}` : `Fin du tour ${tourOneBased}`
}

/** Libellé timer repos après validation d'une série. */
export function restTimerAfterSetLine(params: {
  kind: 'intra_tour' | 'inter_tour'
  tourOneBased: number
  exerciseName?: string
  lang: Lang
}): string {
  const { kind, tourOneBased, exerciseName, lang } = params
  if (kind === 'intra_tour') {
    return lang === 'en' ? 'Next exercise' : 'Exercice suivant'
  }
  if (exerciseName) {
    return lang === 'en'
      ? `After set · round ${tourOneBased}`
      : `Après série · tour ${tourOneBased}`
  }
  return restTimerAfterTourLine(tourOneBased, lang)
}

/** Mot « Repos » / « Rest » dans la carte timer embarquée. */
export function sessionRestWord(lang: Lang): string {
  return lang === 'en' ? 'Rest' : 'Repos'
}

/** Mot « Tour » / « Round » pour sous-titres de série. */
export function sessionTourWord(lang: Lang): string {
  return lang === 'en' ? 'Round' : 'Tour'
}

/** CTA Passer le repos. */
export function sessionSkipRestLabel(lang: Lang): string {
  return lang === 'en' ? 'Skip' : 'Passer'
}

/** Accessibilité : bouton pour passer le countdown repos (overlay bas d’écran). */
export function restOverlaySkipAriaLabel(lang: Lang): string {
  return lang === 'en' ? 'Skip rest' : 'Passer le repos'
}

/** Valider · {exo} */
export function validateExerciseCtaLine(exerciseDisplayName: string, lang: Lang): string {
  return lang === 'en' ? `Validate · ${exerciseDisplayName}` : `Valider · ${exerciseDisplayName}`
}

/** Terminer la séance */
export function finishSessionCtaLabel(lang: Lang): string {
  return lang === 'en' ? 'End session' : 'Terminer la séance'
}
