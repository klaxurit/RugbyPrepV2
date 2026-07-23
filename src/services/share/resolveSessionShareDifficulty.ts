import type { Lang } from '../../i18n/appLabels'

/** 3 paliers = 3 illustrations Rufo (rufo_1 / rufo_2 / rufo_3). */
export type SessionShareDifficultyTier = 'easy' | 'solid' | 'beast'

export interface SessionShareDifficulty {
  tier: SessionShareDifficultyTier
  /** Libellé court affiché près du Rufo. */
  label: string
  /** Sous-titre (ex. "RPE 8"). */
  detail: string
  /** Chemin public de l’illustration. */
  imageSrc: string
}

/**
 * Mappe la note d'effort (RPE) → ambiance visuelle.
 * 1–3 fluide · 4–7 intensité · 8–10 à fond.
 */
export function resolveSessionShareDifficulty(
  rpe: number,
  lang: Lang,
): SessionShareDifficulty {
  const safe = Math.min(10, Math.max(1, Math.round(rpe)))

  if (safe <= 3) {
    return {
      tier: 'easy',
      label: lang === 'en' ? 'Smooth session' : 'Séance fluide',
      detail: `RPE ${safe}`,
      imageSrc: '/images/illu/rufo_1.png',
    }
  }
  if (safe <= 7) {
    return {
      tier: 'solid',
      label: lang === 'en' ? 'Solid work' : 'Belle intensité',
      detail: `RPE ${safe}`,
      imageSrc: '/images/illu/rufo_2.png',
    }
  }
  return {
    tier: 'beast',
    label: lang === 'en' ? 'All-out' : 'À fond',
    detail: `RPE ${safe}`,
    imageSrc: '/images/illu/rufo_3.png',
  }
}
