import type { BlockIntent } from '../../types/training'

export const getRerCue = (intent: BlockIntent, rer?: number): string => {
  if (intent === 'neural') {
    return 'Qualité > fatigue. Stop avant dégradation.'
  }

  if (intent === 'activation' || intent === 'prehab') {
    return 'Contrôle, amplitude, pas de douleur.'
  }

  if (intent === 'contrast' || intent === 'force') {
    if (rer === 4 || rer === 3) {
      return 'Charge modérée, vitesse parfaite.'
    }
    if (rer === 2) {
      return 'Lourd mais contrôlé.'
    }
    if (rer === 1) {
      return 'Très lourd, stop dès perte de vitesse.'
    }
    if (rer === 0) {
      return 'Proche de l’échec, pas de grind, sécurité d’abord.'
    }
    return 'Charge progressive, priorité à la vitesse.'
  }

  return 'Exécution propre et régulière.'
}
