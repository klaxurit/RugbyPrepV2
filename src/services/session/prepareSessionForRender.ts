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
import {
  applyProgressiveNordic,
  resolveNordicMesoWeek,
} from './applyProgressiveNordic'
import { applyGymSpeedFallback } from './applyGymSpeedFallback'
import { applyHypertrophyPrimeBump } from './applyHypertrophyPrimeBump'
import { applyInSeasonNoMatchPrimeBump } from './applyInSeasonNoMatchPrimeBump'
import { applyNeckIsometricBlock } from './applyNeckIsometricBlock'
import { applyOptionalOffSeasonFinisher } from './applyOptionalOffSeasonFinisher'
import type { ClubContactProxy } from '../../types/annualPlanning'

interface PrepareInputs {
  session: MotherSession
  trainingLevel: TrainingLevel | undefined
  equipment: Equipment[] | undefined
  lang: 'fr' | 'en'
  /** Semaine du mésocycle 3:1 (deload = 4) — progression NHE Severo. */
  mesocycleWeek?: 1 | 2 | 3 | 4 | null
  /** Numéro de semaine de cycle (fallback si pas de mésocycle). */
  weekNumber?: number | null
  isMatchWeek?: boolean
  isDeloadWeek?: boolean
  clubContactProxy?: ClubContactProxy
}

/**
 * Pipeline de préparation d'une `MotherSession` pour rendu :
 *  1. Adaptation Foundations (si starter)
 *  2. Adaptation BW matériel (si bodyweight_minimal) — variantes selon bandes / home gym
 *  3. Adaptation Equipment (med ball → câble, etc.)
 *  4. Localisation FR
 *  5. Progression NHE (Severo) si Lower éligible
 *  6. Speed salle/maison : fallback sans piste si pas de `sprint_track`
 *  7. Hypertrophie off : +1 série sur 2 primes (4→5), hors décharge / starter
 *  8. In-season hors match : +1 série bloc force (3→4), hors club dur / décharge
 *  9. Mini-bloc cou Upper (optionnel, coupé en premier)
 * 10. Finisher rugby optionnel hors saison (portage, coupé en premier)
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
  mesocycleWeek,
  weekNumber,
  isMatchWeek,
  isDeloadWeek,
  clubContactProxy,
}: PrepareInputs): MotherSession {
  // 1+2. Adaptations EN (Foundations puis Equipment).
  const foundationsSession = isFoundationsLevel(trainingLevel)
    ? adaptMotherSessionForFoundations(session, equipment)
    : session
  const bodyweightSession = adaptMotherSessionForBodyweightEquipment(foundationsSession, equipment)
  const adaptedEn = adaptMotherSessionForEquipmentAlternatives(bodyweightSession, equipment)
  const mesoWeek = resolveNordicMesoWeek({ mesocycleWeek, weekNumber })

  if (lang !== 'fr') {
    return finishPrepared(adaptedEn, mesoWeek, equipment, lang, trainingLevel, {
      isMatchWeek,
      isDeloadWeek,
      clubContactProxy,
    })
  }

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

  if (!finalFr) {
    return finishPrepared(adaptedEn, mesoWeek, equipment, lang, trainingLevel, {
      isMatchWeek,
      isDeloadWeek,
      clubContactProxy,
    })
  }

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

  return finishPrepared(
    {
      ...adaptedEn,
      blocks,
      warmUp: adaptedEn.warmUp
        ? {
            ...adaptedEn.warmUp,
            notes: finalFr.warmUpNotes.length > 0 ? finalFr.warmUpNotes : adaptedEn.warmUp.notes,
            exercises: adaptedEn.warmUp.exercises.map((exo, i) => {
              const frExo = finalFr.warmUpExercises[i]
              if (!frExo) return exo
              return {
                ...exo,
                name: frExo.name || exo.name,
                prescription: frExo.prescription || exo.prescription,
              }
            }),
          }
        : adaptedEn.warmUp,
    },
    mesoWeek,
    equipment,
    lang,
    trainingLevel,
    { isMatchWeek, isDeloadWeek, clubContactProxy },
  )
}

function finishPrepared(
  session: MotherSession,
  mesoWeek: 1 | 2 | 3 | 4,
  equipment: Equipment[] | undefined,
  lang: 'fr' | 'en',
  trainingLevel: TrainingLevel | undefined,
  weekCtx: {
    isMatchWeek?: boolean
    isDeloadWeek?: boolean
    clubContactProxy?: ClubContactProxy
  } = {},
): MotherSession {
  const withNordic = applyProgressiveNordic(session, mesoWeek)
  const withSpeed = applyGymSpeedFallback(withNordic, equipment, lang)
  const withHyp = applyHypertrophyPrimeBump(withSpeed, { mesoWeek, trainingLevel, lang })
  const withInSeason = applyInSeasonNoMatchPrimeBump(withHyp, {
    mesoWeek,
    trainingLevel,
    lang,
    isMatchWeek: weekCtx.isMatchWeek,
    isDeloadWeek: weekCtx.isDeloadWeek,
    clubContactProxy: weekCtx.clubContactProxy,
  })
  const withNeck = applyNeckIsometricBlock(withInSeason, { mesoWeek, trainingLevel, lang })
  return applyOptionalOffSeasonFinisher(withNeck, {
    mesoWeek,
    trainingLevel,
    equipment,
    lang,
  })
}
