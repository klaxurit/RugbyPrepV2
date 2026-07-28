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

/** Premier mot du display name → prénom pour personnifier la carte. */
export function resolveShareFirstName(displayName?: string | null): string | null {
  const trimmed = displayName?.trim()
  if (!trimmed) return null
  return trimmed.split(/\s+/)[0] ?? null
}

function withFirstName(label: string, firstName?: string | null): string {
  const name = firstName?.trim()
  return name ? `${label}, ${name}` : label
}

/**
 * Mappe la note d'effort (RPE) → ambiance visuelle.
 * 1–3 fluide · 4–7 intensité · 8–10 à fond.
 */
export function resolveSessionShareDifficulty(
  rpe: number,
  lang: Lang,
  firstName?: string | null,
): SessionShareDifficulty {
  const safe = Math.min(10, Math.max(1, Math.round(rpe)))

  if (safe <= 3) {
    return {
      tier: 'easy',
      label: withFirstName(lang === 'en' ? 'Smooth session' : 'Séance fluide', firstName),
      detail: `RPE ${safe}`,
      imageSrc: '/images/illu/rufo_1.png',
    }
  }
  if (safe <= 7) {
    return {
      tier: 'solid',
      label: withFirstName(lang === 'en' ? 'Solid work' : 'Belle intensité', firstName),
      detail: `RPE ${safe}`,
      imageSrc: '/images/illu/rufo_2.png',
    }
  }
  return {
    tier: 'beast',
    label: withFirstName(lang === 'en' ? 'All-out' : 'À fond', firstName),
    detail: `RPE ${safe}`,
    imageSrc: '/images/illu/rufo_3.png',
  }
}
