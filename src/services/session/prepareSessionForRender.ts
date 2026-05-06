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
import { getSessionFrOrFallback } from '../motherSession/motherSessionContentFr'

interface PrepareInputs {
  session: MotherSession
  trainingLevel: TrainingLevel | undefined
  equipment: Equipment[] | undefined
  lang: 'fr' | 'en'
}

/**
 * Pipeline de préparation d'une `MotherSession` pour rendu :
 *  1. Adaptation Foundations (si starter) — substitue Pin Back Squat → Goblet Squat / Leg Press
 *  2. Adaptation Equipment — substitue selon ce que possède le profil
 *  3. Localisation FR (si lang='fr') — applique les noms FR sur les blocs et exos
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
  const adaptedEn = adaptMotherSessionForEquipmentAlternatives(foundationsSession, equipment)

  if (lang !== 'fr') return adaptedEn

  // 3. Pipeline FR : raw FR → Foundations FR → Equipment FR → merge dans la session.
  const rawFr = getSessionFrOrFallback(session)
  const foundationsFr = isFoundationsLevel(trainingLevel)
    ? adaptSessionContentFrForFoundations(session, rawFr, equipment)
    : rawFr
  const finalFr = adaptSessionContentFrForEquipmentAlternatives(
    foundationsSession,
    foundationsFr,
    equipment,
  )

  if (!finalFr) return adaptedEn

  // Merge des noms FR sur les blocs et exos. Format/coachingNotes/fallbackOptions
  // restent ceux de l'EN si pas surchargés en FR.
  const blocks = adaptedEn.blocks.map((block, blockIndex) => {
    const frBlock = finalFr.blocks[blockIndex]
    if (!frBlock) return block
    return {
      ...block,
      name: frBlock.name || block.name,
      format: frBlock.format || block.format,
      exercises: block.exercises.map((exo, exoIndex) => {
        const frExo = frBlock.exercises[exoIndex]
        if (!frExo) return exo
        return {
          ...exo,
          name: frExo.name || exo.name,
          prescription: frExo.prescription || exo.prescription,
        }
      }),
      coachingNotes: frBlock.coachingNotes ?? block.coachingNotes,
      fallbackOptions: frBlock.fallbackOptions ?? block.fallbackOptions,
    }
  })

  return { ...adaptedEn, blocks }
}
