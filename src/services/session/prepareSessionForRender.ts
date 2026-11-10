import type { MotherSession } from '../../types/motherSession'
import type { Equipment, RugbyPositionGroup, TrainingLevel } from '../../types/training'
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
import { localizeMotherSessionExerciseName } from '../motherSession/localizeMotherSessionExerciseName'
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
import { applyPositionAccentBlock } from './applyPositionAccentBlock'
import {
  applyBenchWavePrescription,
  type BenchWaveDayPreference,
} from './applyBenchWavePrescription'
import {
  applyPackPorteurAdaptation,
  isPackPorteurEligibleSession,
  isPackPorteurFamily,
} from './applyPackPorteurAdaptation'
import { applyContentFamilyCopyPolish } from './applyContentFamilyCopyPolish'
import { applySprintTrackCodBlock } from './applySprintTrackCodBlock'
import type { ClubContactProxy } from '../../types/annualPlanning'
import type { PositionAccentFocus } from '../equipment/positionAccentTheme'
import { resolveContentFamily, type ContentFamily } from '../../data/contentFamily'

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
  /** Rail J-2 calendaire : coupe les bumps volume même si isMatchWeek est false. */
  preMatchNoHeavy?: boolean
  /** Pack poste fin (PROP / HOOKER / …) — accent runtime V1. */
  rugbyPosition?: RugbyPositionGroup | string | null
  /** Micro-choix focus accent (A = thème semaine, B = complémentaire). */
  positionAccentFocus?: PositionAccentFocus
  /** Préférence jour du slot (match week → SPEED/DELOAD). */
  dayPreference?: BenchWaveDayPreference | null
  contentFamily?: ContentFamily | null
}

/** Prefer explicit family; else derive from onboarding poste (Plan A copy). */
function resolveRenderContentFamily(
  contentFamily: ContentFamily | null | undefined,
  rugbyPosition: RugbyPositionGroup | string | null | undefined,
): ContentFamily | null {
  if (contentFamily) return contentFamily
  if (!rugbyPosition) return null
  return resolveContentFamily(rugbyPosition).family
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
 *  9. Vague Bench in-season (overlay meso week — ancre stable)
 * 10. Mini-bloc cou Upper (optionnel, coupé en premier)
 * 11. Finisher rugby optionnel hors saison (portage, coupé en premier)
 * 12. Pack porteur (2ᵉ/3ᵉ ligne) — DNA pré Power / Primer / Full FRONT_ROW, silencieux
 * 13. COD piste si `sprint_track` (off/pré ; Full hors match) — silencieux
 * 14. Accent poste fin (Upper/Lower BW + salle) — ajouté, theme-week + focus A/B
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
  preMatchNoHeavy,
  rugbyPosition,
  positionAccentFocus,
  dayPreference,
  contentFamily: contentFamilyInput,
}: PrepareInputs): MotherSession {
  const contentFamily = resolveRenderContentFamily(contentFamilyInput, rugbyPosition)

  // 1+2. Adaptations EN (Foundations puis Equipment).
  const foundationsSession = isFoundationsLevel(trainingLevel)
    ? adaptMotherSessionForFoundations(session, equipment)
    : session
  const bodyweightSession = adaptMotherSessionForBodyweightEquipment(foundationsSession, equipment)
  const adaptedEn = adaptMotherSessionForEquipmentAlternatives(bodyweightSession, equipment)
  const mesoWeek = resolveNordicMesoWeek({ mesocycleWeek, weekNumber })
  const weekCtx = {
    isMatchWeek,
    isDeloadWeek,
    clubContactProxy,
    preMatchNoHeavy,
    rugbyPosition,
    positionAccentFocus,
    dayPreference,
    contentFamily,
  }

  // Pack porteur sur noms EN (avant FR) — sinon les libellés FR cassent les swaps.
  const porteurEn = applyPackPorteurAdaptation(adaptedEn, {
    contentFamily,
    lang: 'en',
  })
  const copyPolishedEn = applyContentFamilyCopyPolish(porteurEn, {
    contentFamily,
    lang: 'en',
  })

  if (lang !== 'fr') {
    return finishPrepared(copyPolishedEn, mesoWeek, equipment, lang, trainingLevel, weekCtx)
  }

  // 3. Pipeline FR : raw FR → Foundations FR → Equipment FR → merge dans la session.
  // Skip merge FR indexé seulement si les exos ont été swapés (pré/Full/Primer FRONT_ROW).
  const porteurMutated =
    isPackPorteurFamily(contentFamily) && isPackPorteurEligibleSession(adaptedEn)
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
    return finishPrepared(copyPolishedEn, mesoWeek, equipment, lang, trainingLevel, weekCtx)
  }

  // Merge des noms FR sur les blocs et exos. Format/coachingNotes/fallbackOptions
  // restent ceux de l'EN si pas surchargés en FR.
  //
  // ⚠️ Toujours résoudre `exerciseId` depuis le nom EN *avant* d'appliquer le libellé FR :
  // le catalogue / MS_EXERCISE_MAP est anglophone ; sans ça, lang=fr casse le moteur
  // (`findCurrentPending` → pas de « Valider ») et les démos (bouton œil).
  const blocksMerged = copyPolishedEn.blocks.map((block, blockIndex) => {
    const frBlock = !porteurMutated ? finalFr.blocks[blockIndex] : undefined
    return {
      ...block,
      name: frBlock?.name || block.name,
      format: frBlock?.format || block.format,
      exercises: block.exercises.map((exo, exoIndex) => {
        const catalogId = resolveExerciseIdForSessionRun(exo.name, exo.exerciseId)
        const frExo = frBlock?.exercises[exoIndex]
        const lexiconFr = localizeMotherSessionExerciseName(exo.name, 'fr')
        const lexiconTranslated =
          Boolean(lexiconFr) &&
          lexiconFr.trim().toLowerCase() !== exo.name.trim().toLowerCase()
        const localizedName = lexiconTranslated
          ? lexiconFr
          : catalogId != null
            ? getExerciseName(catalogId, 'fr')
            : frExo?.name
        if (!frExo) {
          return {
            ...exo,
            name: localizedName || exo.name,
            ...(catalogId ? { exerciseId: catalogId } : {}),
          }
        }
        return {
          ...exo,
          name: localizedName || frExo.name || exo.name,
          prescription: frExo.prescription || exo.prescription,
          ...(catalogId ? { exerciseId: catalogId } : {}),
        }
      }),
      coachingNotes: frBlock?.coachingNotes ?? block.coachingNotes,
      fallbackOptions: frBlock?.fallbackOptions ?? block.fallbackOptions,
    }
  })

  // Re-polish FR : le merge FR peut réintroduire « Premières Lignes » depuis le corpus.
  const frPolished = applyContentFamilyCopyPolish(
    {
      ...copyPolishedEn,
      blocks: blocksMerged,
      warmUp: copyPolishedEn.warmUp
        ? {
            ...copyPolishedEn.warmUp,
            notes: finalFr.warmUpNotes.length > 0 ? finalFr.warmUpNotes : copyPolishedEn.warmUp.notes,
            exercises: copyPolishedEn.warmUp.exercises.map((exo, i) => {
              const frExo = finalFr.warmUpExercises[i]
              if (!frExo) return exo
              return {
                ...exo,
                name: frExo.name || exo.name,
                prescription: frExo.prescription || exo.prescription,
              }
            }),
          }
        : copyPolishedEn.warmUp,
      goal: finalFr.goals?.length ? finalFr.goals : copyPolishedEn.goal,
      sessionIdentity: finalFr.sessionIdentity?.length
        ? finalFr.sessionIdentity
        : copyPolishedEn.sessionIdentity,
    },
    { contentFamily, lang: 'fr' },
  )

  return finishPrepared(frPolished, mesoWeek, equipment, lang, trainingLevel, weekCtx)
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
    preMatchNoHeavy?: boolean
    rugbyPosition?: RugbyPositionGroup | string | null
    positionAccentFocus?: PositionAccentFocus
    dayPreference?: BenchWaveDayPreference | null
    contentFamily?: ContentFamily | null
  } = {},
): MotherSession {
  const withNordic = applyProgressiveNordic(session, mesoWeek)
  const withSpeed = applyGymSpeedFallback(withNordic, equipment, lang)
  const withHyp = applyHypertrophyPrimeBump(withSpeed, {
    mesoWeek,
    trainingLevel,
    lang,
    preMatchNoHeavy: weekCtx.preMatchNoHeavy,
  })
  const withInSeason = applyInSeasonNoMatchPrimeBump(withHyp, {
    mesoWeek,
    trainingLevel,
    lang,
    isMatchWeek: weekCtx.preMatchNoHeavy ? true : weekCtx.isMatchWeek,
    isDeloadWeek: weekCtx.isDeloadWeek,
    clubContactProxy: weekCtx.clubContactProxy,
  })
  const withBenchWave = applyBenchWavePrescription(withInSeason, {
    mesocycleWeek: mesoWeek,
    lang,
    isDeloadWeek: weekCtx.isDeloadWeek,
    isMatchWeek: weekCtx.isMatchWeek,
    preMatchNoHeavy: weekCtx.preMatchNoHeavy,
    dayPreference: weekCtx.dayPreference,
    contentFamily: weekCtx.contentFamily,
    rugbyPosition: weekCtx.rugbyPosition,
  })
  const withNeck = applyNeckIsometricBlock(withBenchWave, { mesoWeek, trainingLevel, lang })
  const withFinisher = applyOptionalOffSeasonFinisher(withNeck, {
    mesoWeek,
    trainingLevel,
    equipment,
    lang,
  })
  // Pack porteur déjà appliqué en amont (noms EN). Ici : COD piste seulement.
  const withSprintCod = applySprintTrackCodBlock(withFinisher, {
    equipment,
    isMatchWeek: weekCtx.isMatchWeek,
    lang,
  })
  return applyPositionAccentBlock(withSprintCod, {
    rugbyPosition: weekCtx.rugbyPosition,
    mesoWeek,
    trainingLevel,
    lang,
    positionAccentFocus: weekCtx.positionAccentFocus,
    isMatchWeek: weekCtx.isMatchWeek,
    preMatchNoHeavy: weekCtx.preMatchNoHeavy,
  })
}
