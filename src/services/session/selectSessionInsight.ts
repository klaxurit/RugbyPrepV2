import type { SessionPR } from './detectSessionPRs'

export type SessionInsightTone = 'success' | 'info' | 'warn'

export interface SessionInsight {
  tone: SessionInsightTone
  /** Préfixe court (emoji ou pictogramme léger). */
  badge: string
  /** Message principal — 1 phrase max. */
  message: string
}

export interface SelectSessionInsightInputs {
  rpe: number | null
  /** Ratio sets validés / sets totaux (0..1). */
  completedRatio: number
  /** PRs détectés sur la séance. */
  prs: readonly SessionPR[]
  /**
   * Au moins une série a égalé ou battu la dernière séance (Weakley) —
   * sans être un PR all-time.
   */
  beatPreviousSession?: boolean
}

/**
 * Choisit un insight contextuel à afficher dans la modal de fin de séance.
 *
 * Priorité :
 *  1. PR battu — toujours célébré en premier.
 *  2. RPE ≥ 9 + reps incomplètes → suggérer un deload.
 *  3. RPE ≥ 9 + reps complètes → "limite atteinte, bonne séance".
 *  4. RPE ≤ 5 + completion totale → "trop facile, on augmentera".
 *  5. Battu dernière séance (Weakley) + séance bien remplie → encouragement.
 *  6. Sinon : pas d'insight (return null).
 */
export function selectSessionInsight({
  rpe,
  completedRatio,
  prs,
  beatPreviousSession = false,
}: SelectSessionInsightInputs): SessionInsight | null {
  if (prs.length > 0) {
    const top = prs[0]
    return {
      tone: 'success',
      badge: '🎯',
      message:
        prs.length === 1
          ? `Nouveau record : ${top.newBest} kg (avant ${top.previousBest} kg)`
          : `${prs.length} nouveaux records cette séance — bravo`,
    }
  }

  if (rpe == null) {
    if (beatPreviousSession && completedRatio >= 0.8) {
      return {
        tone: 'success',
        badge: '↑',
        message: 'Tu as battu ta dernière séance — le feedback paie.',
      }
    }
    return null
  }

  if (rpe >= 9 && completedRatio < 1) {
    return {
      tone: 'warn',
      badge: '⚠',
      message: 'Effort très haut sans tout boucler — envisage un deload.',
    }
  }

  if (rpe >= 9 && completedRatio >= 1) {
    return {
      tone: 'info',
      badge: '🔥',
      message: 'Limite atteinte mais série complétée — belle séance.',
    }
  }

  if (rpe <= 5 && completedRatio >= 1) {
    return {
      tone: 'info',
      badge: '💡',
      message: 'Séance confortable — on augmentera la charge la prochaine fois.',
    }
  }

  if (beatPreviousSession && completedRatio >= 0.8) {
    return {
      tone: 'success',
      badge: '↑',
      message: 'Au-dessus de ta dernière séance — continue comme ça.',
    }
  }

  return null
}
