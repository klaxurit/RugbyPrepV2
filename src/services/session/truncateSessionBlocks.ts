/**
 * Application effective de `maxBlocks` et `variant` sur une séance.
 *
 * Le résolveur hebdomadaire positionne déjà ces deux champs dans huit
 * situations (décharge in-season, taper playoffs, fatigue haute et very_high,
 * readiness basse, tendance de détente en baisse, longue absence, fin de
 * saison) mais rien ne les consommait au rendu : la séance servie restait
 * intégrale. Ce module est le maillon manquant.
 *
 * Tronquer `MotherSession.blocks` en amont suffit : le rendu, le mode run, le
 * curseur de progression, les timers et la validation de série dérivent tous
 * de cette liste.
 */

import type { Block, MotherSession } from '../../types/motherSession'
import { parseBlockTourCount, parseExerciseSets } from '../ui/blockPresentation'

export interface TruncateOptions {
  /** Nombre de blocs visé. Absent = aucune troncature. */
  maxBlocks?: number
  /** `light` réduit aussi le nombre de tours des blocs conservés. */
  variant?: 'normal' | 'light'
}

export interface TruncateResult {
  session: MotherSession
  /** Numéros des blocs retirés, dans l'ordre de retrait. */
  droppedBlockNumbers: number[]
  /** Numéros des blocs dont le nombre de tours a été réduit. */
  lightenedBlockNumbers: number[]
  /**
   * `maxBlocks` n'a pas pu être atteint : les blocs restants sont tous
   * protégés. La séance en sert plus que demandé, volontairement.
   */
  flooredByProtectedBlocks: boolean
}

/** Une séance garde toujours au moins un bloc, quelle que soit la consigne. */
const MIN_BLOCKS = 1

/** Après coupe de blocs, si le volume restant est déjà ≤ 65 %, pas d’allègement. */
const DELOAD_REMAINING_CEILING = 0.65

function sessionSetVolume(session: Pick<MotherSession, 'blocks'>): number {
  let total = 0
  for (const block of session.blocks) {
    for (const exercise of block.exercises) {
      total += parseExerciseSets(exercise.prescription) ?? parseBlockTourCount(block)
    }
  }
  return total
}

/**
 * Ordre de retrait quand la séance ne déclare pas `reduction_order` :
 * blocs optionnels d'abord, puis les blocs les plus tardifs — ce qui laisse
 * mécaniquement le bloc 1, porteur de la qualité principale, en dernier.
 */
function fallbackReductionOrder(blocks: Block[]): number[] {
  return [...blocks]
    .sort((a, b) => {
      if (a.isOptional !== b.isOptional) return a.isOptional ? -1 : 1
      return b.number - a.number
    })
    .map((b) => b.number)
}

function resolveReductionOrder(session: MotherSession): number[] {
  const declared = session.metadata.reductionOrder
  if (!declared || declared.length === 0) return fallbackReductionOrder(session.blocks)
  const existing = new Set(session.blocks.map((b) => b.number))
  return declared.filter((n) => existing.has(n))
}

/** Remplace le compteur de tours d'une chaîne de format (« 3 rounds » → « 2 rounds »). */
function rewriteRoundsInFormat(format: string, from: number, to: number): string {
  return format
    .replace(
      new RegExp(`\\b${from}\\s*(tours?|rounds?)\\b`, 'gi'),
      (_match, unit: string) => `${to} ${unit}`,
    )
    .replace(
      new RegExp(`\\b${from}\\s*(work\\s*sets?)\\b`, 'gi'),
      (_match, unit: string) => `${to} ${unit}`,
    )
}

/** Remplace le préfixe de séries d'une prescription (« 4×5 » → « 3×5 »). */
function rewriteSetsInPrescription(prescription: string, from: number, to: number): string {
  return prescription.replace(
    new RegExp(`(^|[\\s\`(])${from}\\s*([x×])`, 'g'),
    (_match, lead: string, sign: string) => `${lead}${to}${sign}`,
  )
}

/**
 * Volume à réduire sur un bloc. Un bloc « 4 work sets » enchaîne quatre séries
 * sur le même exercice et ne compte donc qu'un seul tour : c'est le nombre de
 * séries qui porte le volume, pas le nombre de tours.
 */
function blockVolumeCount(block: Block): number {
  const workSets = block.format?.match(/\b(\d+)\s*work\s*sets?\b/i)
  if (workSets) {
    const n = Number(workSets[1])
    if (Number.isFinite(n) && n > 0) return n
  }
  return parseBlockTourCount(block)
}

/**
 * Un cran de volume en moins sur un bloc. Les blocs déjà à deux tours ou deux
 * séries sont laissés intacts : en dessous, le bloc perd son sens plutôt que
 * sa fatigue.
 */
function lightenBlock(block: Block): { block: Block; changed: boolean } {
  const volume = blockVolumeCount(block)
  if (volume <= 2) return { block, changed: false }
  const target = volume - 1

  return {
    block: {
      ...block,
      format: rewriteRoundsInFormat(block.format, volume, target),
      exercises: block.exercises.map((exercise) => ({
        ...exercise,
        prescription: rewriteSetsInPrescription(exercise.prescription, volume, target),
      })),
    },
    changed: true,
  }
}

export function truncateSessionBlocks(
  session: MotherSession,
  { maxBlocks, variant }: TruncateOptions,
): TruncateResult {
  const isLight = variant === 'light'

  let droppedBlockNumbers: number[] = []
  let blocks = session.blocks

  // Garde-fou séances déjà très courtes (≤ 2 blocs) : on n’arrache pas un
  // bloc via maxBlocks — seul `light` (−1 tour) s’applique.
  // Cible décharge : ≈ −40 % volume, intensité inchangée. Si la coupe de
  // blocs suffit (reste ≤ 65 %), on n’allège plus les séries.
  const softFloorShortSession = session.blocks.length <= 2
  const effectiveMaxBlocks =
    softFloorShortSession || maxBlocks == null
      ? undefined
      : Math.max(MIN_BLOCKS, maxBlocks)

  if (effectiveMaxBlocks != null && session.blocks.length > effectiveMaxBlocks) {
    const order = resolveReductionOrder(session)
    const dropCount = Math.min(session.blocks.length - effectiveMaxBlocks, order.length)
    droppedBlockNumbers = order.slice(0, dropCount)
    const droppedSet = new Set(droppedBlockNumbers)
    blocks = session.blocks.filter((b) => !droppedSet.has(b.number))
  }

  const lightenedBlockNumbers: number[] = []
  const originalVolume = sessionSetVolume(session)
  const remainingVolume = sessionSetVolume({ ...session, blocks })
  const alreadyAtDeloadTarget =
    originalVolume > 0 && remainingVolume / originalVolume <= DELOAD_REMAINING_CEILING

  if (isLight && !alreadyAtDeloadTarget) {
    blocks = blocks.map((block) => {
      const { block: next, changed } = lightenBlock(block)
      if (changed) lightenedBlockNumbers.push(block.number)
      return next
    })
  }

  const unchanged = droppedBlockNumbers.length === 0 && lightenedBlockNumbers.length === 0
  return {
    session: unchanged ? session : { ...session, blocks },
    droppedBlockNumbers,
    lightenedBlockNumbers,
    flooredByProtectedBlocks:
      effectiveMaxBlocks != null && blocks.length > effectiveMaxBlocks,
  }
}
