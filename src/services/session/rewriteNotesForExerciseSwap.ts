/**
 * Réécrit notes / fallback quand un exo est swapé, pour que les tips
 * coach ne restent pas calés sur le nom d’origine.
 */

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
  return out
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
