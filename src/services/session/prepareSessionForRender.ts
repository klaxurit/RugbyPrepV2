import type { MotherSession } from '../../types/motherSession'
import type { Equipment, TrainingLevel } from '../../types/training'
import {
  adaptMotherSessionForFoundations,
  adaptSessionContentFrForFoundations,
  isFoundationsLevel,
} from '../motherSession/foundationsSessionAdaptations'
import {
  adaptMotherSessionForEquipmentAlternatives,
  adaptSessionContentFrForEquipmentAlternatives,
} from '../motherSession/equipmentAlternativeAdaptations'
import { adaptMotherSessionForBodyweightEquipment } from '../motherSession/bodyweightEquipmentAdaptations'
import { getSessionFrOrFallback } from '../motherSession/motherSessionContentFr'
import { getExerciseName } from '../../data/exercises'
import { resolveExerciseIdForSessionRun } from '../motherSession/motherSessionExerciseMap'

interface PrepareInputs {
  session: MotherSession
  trainingLevel: TrainingLevel | undefined
  equipment: Equipment[] | undefined
  lang: 'fr' | 'en'
}

/**
 * Pipeline de préparation d'une `MotherSession` pour rendu :
 *  1. Adaptation Foundations (si starter)
 *  2. Adaptation BW matériel (si bodyweight_minimal) — variantes selon bandes / home gym
 *  3. Adaptation Equipment (med ball → câble, etc.)
 *  4. Localisation FR
 *
 * La session retournée est prête à être passée aux blocs de rendu (`SessionBlocks`)
 * sans qu'ils aient à connaître le système d'adaptations / contenu FR.
 *
 * Pur, pas d'effet de bord. Stable pour `useMemo`.
 */
export function prepareSessionForRender({
  session,
  trainingLevel,
  equipment,
  lang,
}: PrepareInputs): MotherSession {
  // 1+2. Adaptations EN (Foundations puis Equipment).
  const foundationsSession = isFoundationsLevel(trainingLevel)
    ? adaptMotherSessionForFoundations(session, equipment)
    : session
  const bodyweightSession = adaptMotherSessionForBodyweightEquipment(foundationsSession, equipment)
  const adaptedEn = adaptMotherSessionForEquipmentAlternatives(bodyweightSession, equipment)

  if (lang !== 'fr') return adaptedEn

  // 3. Pipeline FR : raw FR → Foundations FR → Equipment FR → merge dans la session.
  const rawFr = getSessionFrOrFallback(session)
  const foundationsFr = isFoundationsLevel(trainingLevel)
    ? adaptSessionContentFrForFoundations(session, rawFr, equipment)
    : rawFr
  const finalFr = adaptSessionContentFrForEquipmentAlternatives(
    bodyweightSession,
    foundationsFr,
    equipment,
  )

  if (!finalFr) return adaptedEn

  // Merge des noms FR sur les blocs et exos. Format/coachingNotes/fallbackOptions
  // restent ceux de l'EN si pas surchargés en FR.
  //
  // ⚠️ Toujours résoudre `exerciseId` depuis le nom EN *avant* d'appliquer le libellé FR :
  // le catalogue / MS_EXERCISE_MAP est anglophone ; sans ça, lang=fr casse le moteur
  // (`findCurrentPending` → pas de « Valider ») et les démos (bouton œil).
  const blocks = adaptedEn.blocks.map((block, blockIndex) => {
    const frBlock = finalFr.blocks[blockIndex]
    if (!frBlock) return block
    return {
      ...block,
      name: frBlock.name || block.name,
      format: frBlock.format || block.format,
      exercises: block.exercises.map((exo, exoIndex) => {
        const catalogId = resolveExerciseIdForSessionRun(exo.name, exo.exerciseId)
        const frExo = frBlock.exercises[exoIndex]
        const localizedName =
          catalogId != null ? getExerciseName(catalogId, 'fr') : frExo?.name
        if (!frExo) {
          return catalogId ? { ...exo, exerciseId: catalogId } : exo
        }
        return {
          ...exo,
          name: localizedName || frExo.name || exo.name,
          prescription: frExo.prescription || exo.prescription,
          ...(catalogId ? { exerciseId: catalogId } : {}),
        }
      }),
      coachingNotes: frBlock.coachingNotes ?? block.coachingNotes,
      fallbackOptions: frBlock.fallbackOptions ?? block.fallbackOptions,
    }
  })

  return { ...adaptedEn, blocks }
}
