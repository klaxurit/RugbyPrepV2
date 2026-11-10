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
import { positionShortLabel } from '../../i18n/appLabels'
import { isFoundationsLevel } from '../motherSession/foundationsSessionAdaptations'
import {
  filterPositionAccentSlots,
  getPositionAccentBlockForRugbyPosition,
  pickPositionAccentExerciseId,
  POSITION_ACCENT_ALL_SESSION_IDS,
  positionAccentMovementFamily,
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
import { buildPositionAccentTransferLine } from '../equipment/positionAccentTransfer'
import { resolveExerciseIdForSessionRun } from '../motherSession/motherSessionExerciseMap'
import { sessionAlreadyHasNeckWork } from './applyNeckIsometricBlock'

const BLOCK_TOKEN_FR = 'Accent poste'
const BLOCK_TOKEN_EN = 'Position accent'

/** Jamais de token technique (BACK_ROW…) — « 3ème ligne », « Pilier », etc. */
export function accentPackPlayerLabel(
  packId: string,
  lang: 'fr' | 'en' = 'fr',
): string {
  return (
    positionShortLabel(packId, lang) ??
    positionShortLabel(packId.toUpperCase(), lang) ??
    (lang === 'en' ? 'your position' : 'ton poste')
  )
}

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

function collectSessionExerciseUsage(session: MotherSession): {
  ids: Set<string>
  families: Set<string>
} {
  const ids = new Set<string>()
  const families = new Set<string>()
  for (const block of session.blocks) {
    for (const exo of block.exercises) {
      const id = resolveExerciseIdForSessionRun(exo.name, exo.exerciseId)
      if (!id) continue
      ids.add(id)
      families.add(positionAccentMovementFamily(id))
    }
  }
  return { ids, families }
}

/**
 * Place l’accent avant les blocs optionnels de fin (préhab, etc.) —
 * pas après un EMOM + préhab quand l’énergie est déjà basse.
 */
export function insertAccentBeforeTrailingOptional(
  blocks: Block[],
  accent: Block,
): Block[] {
  let insertAt = blocks.length
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    if (blocks[i].isOptional) insertAt = i
    else break
  }
  const next = [...blocks.slice(0, insertAt), accent, ...blocks.slice(insertAt)]
  return next.map((block, index) =>
    block.number === index + 1 ? block : { ...block, number: index + 1 },
  )
}

function buildAccentBlock(
  number: number,
  accent: PositionAccentBlock,
  slots: PositionAccentSlot[],
  lang: 'fr' | 'en',
  mode: PositionAccentEquipmentMode,
  theme: PositionAccentTheme | null,
  usage: { ids: Set<string>; families: Set<string> },
): Block | null {
  const themeLabel = theme ? positionAccentThemeLabel(theme, lang) : null
  const packLabel = accentPackPlayerLabel(accent.packId, lang)
  const name =
    lang === 'en'
      ? themeLabel
        ? `${BLOCK_TOKEN_EN} — ${packLabel} · ${themeLabel}`
        : `${BLOCK_TOKEN_EN} — ${packLabel}`
      : themeLabel
        ? `${BLOCK_TOKEN_FR} — ${packLabel} · ${themeLabel}`
        : `${BLOCK_TOKEN_FR} — ${packLabel}`

  const exercises: Block['exercises'] = []
  const chosenLabels: string[] = []
  for (const slot of slots) {
    const id = pickPositionAccentExerciseId(slot, mode, {
      usedExerciseIds: usage.ids,
      usedFamilies: usage.families,
    })
    if (!id) continue
    usage.ids.add(id)
    usage.families.add(positionAccentMovementFamily(id))
    chosenLabels.push(lang === 'en' ? slot.labelEn : slot.labelFr)
    exercises.push({
      name: getExerciseName(id, lang),
      exerciseId: id,
      prescription: slot.prescription,
      slotLabel: lang === 'en' ? slot.labelEn : slot.labelFr,
      isOptional: true,
    })
  }
  if (exercises.length === 0) return null

  const transfer = buildPositionAccentTransferLine(accent, chosenLabels, lang)

  return {
    number,
    name,
    format:
      lang === 'en'
        ? `${accent.format}, rest ${accent.rest}`
        : `${accent.format}, repos ${accent.rest}`,
    isOptional: true,
    exercises,
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
  const usage = collectSessionExerciseUsage(session)
  const lang = opts.lang ?? 'fr'
  // Numéro provisoire — renuméroté à l’insertion.
  const provisionalNumber = Math.max(0, ...session.blocks.map((b) => b.number)) + 1
  const block = buildAccentBlock(
    provisionalNumber,
    accent,
    slots,
    lang,
    mode,
    theme,
    usage,
  )
  if (!block) return session

  const blocks = insertAccentBeforeTrailingOptional(session.blocks, block)
  const accentNumber = blocks.find((b) => /accent poste|position accent/i.test(b.name))?.number
  // Accent coupé en premier ; ensuite les blocs de fin (préhab…) avant le cœur.
  const reductionOrder = [
    ...(accentNumber != null ? [accentNumber] : []),
    ...blocks
      .map((b) => b.number)
      .filter((n) => n !== accentNumber)
      .reverse(),
  ]
  const themeBit =
    theme != null
      ? lang === 'en'
        ? ` · ${positionAccentThemeLabel(theme, 'en')}`
        : ` · ${positionAccentThemeLabel(theme, 'fr')}`
      : ''
  const transferLine = buildPositionAccentTransferLine(
    accent,
    block.exercises.map((e) => e.slotLabel).filter((l): l is string => Boolean(l)),
    lang,
  )
  const packLabel = accentPackPlayerLabel(accent.packId, lang)
  const positionLine =
    lang === 'en'
      ? `${packLabel} accent${themeBit}: ${transferLine}`
      : `Accent ${packLabel}${themeBit} : ${transferLine}`

  return {
    ...session,
    metadata: { ...session.metadata, reductionOrder },
    blocks,
    positionAccent: [...session.positionAccent, positionLine],
  }
}
