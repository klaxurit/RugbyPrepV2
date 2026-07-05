/** Statut editorial / pipeline de la mother session */
export type MotherSessionStatus = 'draft' | 'validated' | 'ready_for_mapping'

/** Cycle annuel rugby */
export type MotherSessionCycle = 'off_season' | 'pre_season' | 'in_season'

/** Type de séance normalisé (legacy `speed_field` → `speed_power` au parse) */
export type MotherSessionType =
  | 'upper'
  | 'lower'
  | 'full'
  | 'full_light_primer'
  | 'speed_power'

/** Niveau cible (front-matter `target_level`) */
export type MotherSessionTargetLevel = 'starter' | 'builder' | 'performance'

export interface MotherSessionMetadata {
  /** Identifiant = nom de fichier sans extension */
  id: string
  status: MotherSessionStatus
  /** Ex. `V1` depuis le front-matter */
  version: string
  cycle: MotherSessionCycle
  sessionType: MotherSessionType
  targetLevel: MotherSessionTargetLevel
  /** Libellé libre (ex. front_row, front_row + back_three) */
  targetPositionGroup: string
  /** Ex. full_gym */
  equipment: string
  /** Ex. 50-60 min */
  targetDuration: string
}

export interface Exercise {
  name: string
  /** Résolu dynamiquement quand une adaptation de niveau remplace l'exercice source. */
  exerciseId?: string
  prescription: string
  role?: 'prime' | 'contrast' | 'support'
  /** Ex. minute 1, minute 2 (EMOM) */
  slotLabel?: string
  /** Repos après validation d'une série (secondes). Prioritaire sur l'inférence bloc. */
  restAfterSetSeconds?: number
  /** Skippable en cas de fatigue accumulée. La session reste valide sans cet exo. */
  isOptional?: boolean
}

export interface Block {
  number: number
  name: string
  format: string
  exercises: Exercise[]
  coachingNotes: string[]
  fallbackOptions?: string[]
  isOptional?: boolean
}

export interface WarmUp {
  exercises: { name: string; prescription: string }[]
  notes: string[]
}

export type InjurySubstitutionArea = 'shoulder_pain' | 'knee_pain' | 'low_back_pain'

export interface InjurySubstitution {
  area: InjurySubstitutionArea
  remove: string[]
  replaceWith: string[]
  rehabFinisher: string[]
}

export interface MotherSession {
  metadata: MotherSessionMetadata
  /** Titre H1 si présent */
  title?: string
  goal: string[]
  sessionIdentity: string[]
  warmUp: WarmUp
  blocks: Block[]
  progressionRules: string[]
  positionAccent: string[]
  injurySubstitutions: InjurySubstitution[]
  coachingWarnings: string[]
  /** Chaque entrée = ligne brute (liens markdown conservés) */
  sourceReferences: string[]
}
