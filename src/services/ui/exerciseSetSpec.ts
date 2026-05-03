/**
 * Parse a single exercise prescription into a typed spec.
 *
 * Mother-session prescriptions follow a small grammar:
 *   <sets>x<value>[unit][/side|/côté|/direction]
 *   <value>[unit][/side|...]              (no leading set count)
 *   <value> reps                          (explicit reps directive)
 *   <number> progressive sets             (directive — not loggable)
 *
 * `value` may be a single number ("8") or a range ("10-12", "20-30").
 * `unit` may be empty (= reps), `s|sec` (= time), `min` (= time), `m` (= distance).
 *
 * The parser is intentionally tolerant: anything we can't classify falls into
 * `kind: 'unknown'`, callers fall back to the legacy load/reps inputs.
 */

export type ExerciseSetSpec =
  | {
      kind: 'reps'
      sets: number
      repsLow: number
      repsHigh: number
      perSide: boolean
    }
  | {
      kind: 'time'
      sets: number
      durationLow: number
      durationHigh: number
      /** True for "/côté" or "/side" — chrono runs left then right. */
      perSide: boolean
      /** True for "/direction" — Banded Neck pattern (4 directions). */
      perDirection: boolean
    }
  | {
      kind: 'distance'
      sets: number
      distanceLow: number
      distanceHigh: number
      perSide: boolean
    }
  | { kind: 'unknown' }

const RE = {
  // "<setsLow>[-<setsHigh>]x<valLow>[-<valHigh>][unit][/qual]"
  // Examples: "4x6", "2-3x20-30s/side", "1x10m", "2x10s/direction"
  // Note: no trailing \b — JavaScript's word boundary doesn't recognize
  // non-ASCII letters (côté ends with `é`), so we just allow trailing text.
  withSets:
    /^\s*(\d+)(?:[-–](\d+))?\s*[x×]\s*(\d+)(?:[-–](\d+))?\s*(s|sec|min|m)?\s*(?:\/(side|côté|cote|direction))?/i,
  // No leading set count: "20-30s/side", "8 reps", "12-15 reps", "20m"
  noSets:
    /^\s*(\d+)(?:[-–](\d+))?\s*(s|sec|min|m|reps?)?\s*(?:\/(side|côté|cote|direction))?/i,
}

function isPerSide(qual: string | undefined): boolean {
  if (!qual) return false
  const q = qual.toLowerCase()
  return q === 'side' || q === 'côté' || q === 'cote'
}

function isPerDirection(qual: string | undefined): boolean {
  return (qual ?? '').toLowerCase() === 'direction'
}

/** Map raw unit to seconds when applicable. Defaults: s/sec → seconds, min → minutes. */
function durationToSeconds(value: number, unit: string): number {
  return unit === 'min' ? value * 60 : value
}

/**
 * Parse an exercise prescription string.
 * Returns kind=`unknown` when the format isn't recognized — callers should
 * keep the existing load/reps fallback for those cases.
 */
export function parseExerciseSetSpec(prescription: string): ExerciseSetSpec {
  const text = prescription.trim()
  if (!text) return { kind: 'unknown' }

  // Directive-style: "2 progressive sets", "max distance", etc.
  // Any prescription containing "progressive sets" or "max" is treated as
  // unknown so the UI doesn't try to render a chrono.
  if (/progressive\s+sets/i.test(text)) return { kind: 'unknown' }

  // Compound notes that the simple grammar can't capture:
  // "2x5 (5s per position: T, Y, I)" — has the "(...)" annotation.
  // We still extract the leading "2x5" as reps, ignoring the parenthesis.
  const sanitized = text.replace(/\s*\([^)]*\)/g, '').replace(/[`*]/g, '').trim()

  const matchWith = RE.withSets.exec(sanitized)
  if (matchWith) {
    const sets = Number(matchWith[2] ?? matchWith[1])
    const valLow = Number(matchWith[3])
    const valHigh = Number(matchWith[4] ?? matchWith[3])
    const unit = (matchWith[5] ?? '').toLowerCase()
    const qual = matchWith[6]
    return classifyByUnit({
      sets,
      valLow,
      valHigh,
      unit,
      qual,
    })
  }

  const matchNo = RE.noSets.exec(sanitized)
  if (matchNo) {
    const valLow = Number(matchNo[1])
    const valHigh = Number(matchNo[2] ?? matchNo[1])
    const rawUnit = (matchNo[3] ?? '').toLowerCase()
    const qual = matchNo[4]
    // "10-12 reps" — explicit reps with no sets → assume 1 set (the recipe
    // doesn't always include a leading set count; the block format owns
    // the round count). Don't fabricate a sets number > 1 from nothing.
    const unit = rawUnit === 'reps' || rawUnit === 'rep' ? '' : rawUnit
    return classifyByUnit({
      sets: 1,
      valLow,
      valHigh,
      unit,
      qual,
    })
  }

  return { kind: 'unknown' }
}

function classifyByUnit(args: {
  sets: number
  valLow: number
  valHigh: number
  unit: string
  qual: string | undefined
}): ExerciseSetSpec {
  const { sets, valLow, valHigh, unit, qual } = args
  if (!Number.isFinite(sets) || sets <= 0) return { kind: 'unknown' }
  if (!Number.isFinite(valLow) || !Number.isFinite(valHigh)) return { kind: 'unknown' }

  if (unit === 's' || unit === 'sec' || unit === 'min') {
    return {
      kind: 'time',
      sets,
      durationLow: durationToSeconds(valLow, unit),
      durationHigh: durationToSeconds(valHigh, unit),
      perSide: isPerSide(qual),
      perDirection: isPerDirection(qual),
    }
  }

  if (unit === 'm') {
    return {
      kind: 'distance',
      sets,
      distanceLow: valLow,
      distanceHigh: valHigh,
      perSide: isPerSide(qual),
    }
  }

  // Default: reps (with or without /side qualifier)
  return {
    kind: 'reps',
    sets,
    repsLow: valLow,
    repsHigh: valHigh,
    perSide: isPerSide(qual),
  }
}
