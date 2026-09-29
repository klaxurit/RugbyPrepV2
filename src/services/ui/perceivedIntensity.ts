/**
 * Échelle d'intensité ressentie (1–10) — stockée en `rpe` côté données.
 * Libellés joueur : pas de jargon « RPE » en titre UI.
 */

export const PERCEIVED_INTENSITY_LABELS: Record<number, { fr: string; en: string }> = {
  1: { fr: 'Très léger', en: 'Very light' },
  2: { fr: 'Léger', en: 'Light' },
  3: { fr: 'Modéré léger', en: 'Light–moderate' },
  4: { fr: 'Modéré', en: 'Moderate' },
  5: { fr: 'Modéré+', en: 'Moderate+' },
  6: { fr: 'Un peu dur', en: 'Somewhat hard' },
  7: { fr: 'Dur', en: 'Hard' },
  8: { fr: 'Très dur', en: 'Very hard' },
  9: { fr: 'Extrême', en: 'Extremely hard' },
  10: { fr: 'Maximal', en: 'Maximal' },
}

export function clampPerceivedIntensity(value: number): number {
  return Math.min(10, Math.max(1, Math.round(value)))
}

export function perceivedIntensityLabel(
  value: number,
  lang: 'fr' | 'en' = 'fr',
): string {
  const n = clampPerceivedIntensity(value)
  return PERCEIVED_INTENSITY_LABELS[n][lang]
}
