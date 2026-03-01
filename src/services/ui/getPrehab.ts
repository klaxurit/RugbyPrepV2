/**
 * getPrehab — retourne les exercices de prévention adaptés aux inconforts déclarés
 *
 * Principe :
 *   - Data-driven : les exercices sont dans prehab.v1.json (éditables sans code)
 *   - Un exercice apparaît dès qu'il cible AU MOINS un des inconforts du profil
 *   - Dédupliqué (un exercice ciblant 2 inconforts ne s'affiche qu'une fois)
 *   - Max 6 exercices par session pour ne pas surcharger l'échauffement
 *
 * Pour ajouter un exercice : éditer src/data/prehab.v1.json
 * Pour ajouter une catégorie d'inconfort : ajouter dans Contra (types/training.ts)
 *   puis créer des exercices avec le nouveau targetContra
 */

import prehab from '../../data/prehab.v1.json'
import type { Contra } from '../../types/training'

export interface PrehabilityExercise {
  id: string
  nameFr: string
  targetContra: string[]
  equipment: string[]
  sets: number
  reps: string
  notes: string
}

const MAX_EXERCISES = 6

export function getPrehab(injuries: Contra[]): PrehabilityExercise[] {
  if (injuries.length === 0) return []

  const injurySet = new Set<string>(injuries)

  const matched = (prehab as PrehabilityExercise[]).filter((ex) =>
    ex.targetContra.some((contra) => injurySet.has(contra))
  )

  // Sort: exercises targeting the most declared injuries first
  matched.sort((a, b) => {
    const aScore = a.targetContra.filter((c) => injurySet.has(c)).length
    const bScore = b.targetContra.filter((c) => injurySet.has(c)).length
    return bScore - aScore
  })

  return matched.slice(0, MAX_EXERCISES)
}

export const CONTRA_LABELS: Record<Contra, string> = {
  shoulder_pain: 'Épaule',
  elbow_pain: 'Coude',
  wrist_pain: 'Poignet',
  low_back_pain: 'Lombaires',
  knee_pain: 'Genou',
  groin_pain: 'Aine / pubis',
  neck_pain: 'Nuque / cervicales',
  ankle_pain: 'Cheville',
}
