/**
 * Réécrit notes / fallback quand un exo est swapé, pour que les tips
 * coach ne restent pas calés sur le nom d’origine.
 *
 * Important : les notes FR gardent souvent le libellé EN mother (`Bench Press`)
 * alors que le catalogue / l’UI affiche « Développé couché barre ».
 */

import { getExerciseName } from '../../data/exercises'
import { localizeMotherSessionExerciseName } from '../motherSession/localizeMotherSessionExerciseName'
import { listMotherSessionNamesForExerciseId } from '../motherSession/motherSessionExerciseMap'

function uniqueNonEmpty(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  // Plus long d’abord : « Bench Press » avant « Bench ».
  return out.sort((a, b) => b.length - a.length)
}

function titleCaseWords(value: string): string {
  return value.replace(/\b[a-zà-ÿ]/gi, (ch) => ch.toUpperCase())
}

/** Formes dérivées de l’id catalogue (`…__bench_press__…` → bench press / Bench Press). */
function aliasesFromExerciseId(exerciseId: string): string[] {
  const parts = exerciseId.split('__').filter(Boolean)
  if (parts.length < 2) return []
  const movement = parts[1]?.replace(/_/g, ' ').trim()
  if (!movement) return []
  return [movement, titleCaseWords(movement)]
}

/**
 * Toutes les formes de nom à chercher dans les notes pour un exo prescrit.
 */
export function buildExerciseSwapSources(
  previousName: string,
  previousExerciseId: string | undefined,
): string[] {
  const raw: Array<string | undefined> = [previousName]
  if (previousExerciseId) {
    raw.push(getExerciseName(previousExerciseId, 'fr'))
    raw.push(getExerciseName(previousExerciseId, 'en'))
    raw.push(...aliasesFromExerciseId(previousExerciseId))
    for (const msName of listMotherSessionNamesForExerciseId(previousExerciseId)) {
      raw.push(msName)
      raw.push(titleCaseWords(msName))
      raw.push(localizeMotherSessionExerciseName(msName, 'fr'))
      raw.push(localizeMotherSessionExerciseName(titleCaseWords(msName), 'fr'))
    }
  }
  return uniqueNonEmpty(raw)
}

export type ExerciseNameSwap = {
  /** Formes du nom d’origine à remplacer (EN, FR, libellé affiché…). */
  sources: string[]
  /** Nom de la variante choisie (celui affiché en séance). */
  target: string
}

/** Remplace chaque source (exact + casse-insensible) par `target`. */
export function applyExerciseNameSwaps(value: string, swaps: ExerciseNameSwap[]): string {
  return swaps.reduce((next, swap) => {
    const target = swap.target.trim()
    if (!target) return next
    let result = next
    for (const source of uniqueNonEmpty(swap.sources)) {
      if (!source || source.toLowerCase() === target.toLowerCase()) continue
      result = result.split(source).join(target)
      const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      result = result.replace(new RegExp(escaped, 'gi'), target)
    }
    return result
  }, value)
}

export function rewriteNotesForExerciseSwaps(
  notes: string[] | undefined,
  swaps: ExerciseNameSwap[],
): string[] | undefined {
  if (!notes || swaps.length === 0) return notes
  return notes.map((note) => applyExerciseNameSwaps(note, swaps))
}
