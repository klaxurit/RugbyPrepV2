/**
 * Bloc poste fin (PROP / HOOKER / …) — ajouté en fin de séance éligible.
 * Ne retire aucun bloc existant. Coupé en premier via reductionOrder.
 *
 * BW + full_gym Upper/Lower (cycle annuel). Sur salle, `gymExerciseIds` prime.
 * Theme-week (W1 contact / W2 power / W3 skill) + focus A/B runtime.
 * Nuque déjà présente → slots neck omis.
 */

import type { Block, MotherSession } from '../../types/motherSession'
import type { RugbyPositionGroup, TrainingLevel } from '../../types/training'
import { getExerciseName } from '../../data/exercises'
import { isFoundationsLevel } from '../motherSession/foundationsSessionAdaptations'
import {
  filterPositionAccentSlots,
  getPositionAccentBlockForRugbyPosition,
  pickPositionAccentExerciseId,
  POSITION_ACCENT_ALL_SESSION_IDS,
  type PositionAccentBlock,
  type PositionAccentEquipmentMode,
  type PositionAccentSlot,
} from '../equipment/positionAccentRegistry'
import {
  positionAccentThemeHint,
  positionAccentThemeLabel,
  resolveEffectiveAccentTheme,
  type PositionAccentFocus,
  type PositionAccentTheme,
} from '../equipment/positionAccentTheme'
import { sessionAlreadyHasNeckWork } from './applyNeckIsometricBlock'

const BLOCK_TOKEN_FR = 'Accent poste'
const BLOCK_TOKEN_EN = 'Position accent'

export function resolvePositionAccentEquipmentMode(
  session: MotherSession,
): PositionAccentEquipmentMode {
  if (/full_gym/i.test(session.metadata.equipment)) return 'full_gym'
  return 'bodyweight'
}

export function isPositionAccentEligible(session: MotherSession): boolean {
  const type = session.metadata.sessionType
  const id = session.metadata.id
  // Primer / Recovery : pas d’accent (volume / intention)
  if (type === 'full_light_primer' || /LIGHT_PRIMER|RECOVERY/i.test(id)) return false

  const eq = session.metadata.equipment
  const isBwOrGym = /bodyweight|bw/i.test(eq) || /full_gym/i.test(eq)

  if (type === 'full') return isBwOrGym

  if (type !== 'upper' && type !== 'lower') return false
  if (POSITION_ACCENT_ALL_SESSION_IDS.has(session.metadata.id)) return true
  return isBwOrGym
}

function buildAccentBlock(
  number: number,
  accent: PositionAccentBlock,
  slots: PositionAccentSlot[],
  lang: 'fr' | 'en',
  mode: PositionAccentEquipmentMode,
  theme: PositionAccentTheme | null,
): Block {
  const transfer = lang === 'en' ? accent.transferEn : accent.transferFr
  const themeLabel = theme ? positionAccentThemeLabel(theme, lang) : null
  const name =
    lang === 'en'
      ? themeLabel
        ? `${BLOCK_TOKEN_EN} — ${accent.packId} · ${themeLabel}`
        : `${BLOCK_TOKEN_EN} — ${accent.packId}`
      : themeLabel
        ? `${BLOCK_TOKEN_FR} — ${accent.packId} · ${themeLabel}`
        : `${BLOCK_TOKEN_FR} — ${accent.packId}`

  return {
    number,
    name,
    format:
      lang === 'en'
        ? `${accent.format}, rest ${accent.rest}`
        : `${accent.format}, repos ${accent.rest}`,
    isOptional: true,
    exercises: slots.map((slot) => {
      const id = pickPositionAccentExerciseId(slot, mode)
      return {
        name: getExerciseName(id, lang),
        exerciseId: id,
        prescription: slot.prescription,
        slotLabel: lang === 'en' ? slot.labelEn : slot.labelFr,
        isOptional: true,
      }
    }),
    coachingNotes:
      lang === 'en'
        ? [
            transfer,
            theme ? positionAccentThemeHint(theme, 'en') : null,
            'Added on top of the main session — never replaces main lifts. Drop first if short on time or club fatigue is high.',
          ].filter(Boolean) as string[]
        : [
            transfer,
            theme ? positionAccentThemeHint(theme, 'fr') : null,
            'Ajouté en plus de la séance principale — ne remplace aucun bloc. Coupé en premier si manque de temps ou fatigue club.',
          ].filter(Boolean) as string[],
  }
}

export function applyPositionAccentBlock(
  session: MotherSession,
  opts: {
    rugbyPosition?: RugbyPositionGroup | string | null
    mesoWeek: 1 | 2 | 3 | 4
    trainingLevel?: TrainingLevel
    lang?: 'fr' | 'en'
    /** Micro-choix focus du jour : A = thème de la semaine, B = complémentaire. */
    positionAccentFocus?: PositionAccentFocus
    /** Semaine de match / J-2 : pas d’accent sur Full. */
    isMatchWeek?: boolean
    preMatchNoHeavy?: boolean
  },
): MotherSession {
  if (!isPositionAccentEligible(session)) return session
  if (opts.mesoWeek === 4) return session
  if (isFoundationsLevel(opts.trainingLevel)) return session

  const isFull = session.metadata.sessionType === 'full'
  if (isFull && (opts.isMatchWeek || opts.preMatchNoHeavy)) return session

  const accent = getPositionAccentBlockForRugbyPosition(opts.rugbyPosition)
  if (!accent) return session

  if (session.blocks.some((b) => /accent poste|position accent/i.test(b.name))) {
    return session
  }

  const theme = resolveEffectiveAccentTheme(opts.mesoWeek, opts.positionAccentFocus ?? 'a')
  const skipNeck = sessionAlreadyHasNeckWork(session)
  const slots = filterPositionAccentSlots(accent, {
    skipNeck,
    sessionType: session.metadata.sessionType,
    theme,
    maxSlots: isFull ? 2 : 3,
  })
  if (slots.length === 0) return session

  const mode = resolvePositionAccentEquipmentMode(session)
  const nextNumber = Math.max(0, ...session.blocks.map((b) => b.number)) + 1
  const lang = opts.lang ?? 'fr'
  const block = buildAccentBlock(nextNumber, accent, slots, lang, mode, theme)
  const reductionOrder = [nextNumber, ...(session.metadata.reductionOrder ?? [])]
  const themeBit =
    theme != null
      ? lang === 'en'
        ? ` · ${positionAccentThemeLabel(theme, 'en')}`
        : ` · ${positionAccentThemeLabel(theme, 'fr')}`
      : ''
  const positionLine =
    lang === 'en'
      ? `Position pack ${accent.packId}${themeBit}: ${accent.transferEn}`
      : `Pack poste ${accent.packId}${themeBit} : ${accent.transferFr}`

  return {
    ...session,
    metadata: { ...session.metadata, reductionOrder },
    blocks: [...session.blocks, block],
    positionAccent: [...session.positionAccent, positionLine],
  }
}
