/**
 * Parse le champ `format` (texte libre) d'un bloc d'entraînement pour détecter
 * s'il s'agit d'un format temporel structuré (EMOM, Tabata, AMRAP, For Time)
 * ou d'un format classique par tours (retourné en fallback `rounds`).
 *
 * Les formats temporels sont conduits par chrono et pilotent un overlay dédié
 * qui gère les transitions automatiquement. Les formats `rounds` continuent
 * d'utiliser le tour-tracker interactif (SessionTourTracker).
 *
 * Pur, synchrone, no-op sur entrée invalide → `{ type: 'rounds' }`.
 */

export type TimedBlockFormat =
  | {
      type: 'emom'
      /** Durée totale du bloc en secondes (ex. 8 × 60 = 480). */
      totalSeconds: number
      /** Durée d'une minute/intervalle (par défaut 60s). */
      intervalSeconds: number
      /** Nombre d'intervalles à exécuter. */
      rounds: number
    }
  | {
      type: 'tabata'
      /** Durée d'effort par round en secondes (ex. 20). */
      workSeconds: number
      /** Durée de repos par round en secondes (ex. 10). */
      restSeconds: number
      /** Nombre de rounds (work+rest) à exécuter. */
      rounds: number
      /** Durée totale en secondes = rounds × (work + rest). */
      totalSeconds: number
    }
  | {
      type: 'amrap'
      /** Durée totale du chrono en secondes. */
      totalSeconds: number
    }
  | {
      type: 'for_time'
    }
  | {
      type: 'rounds'
    }

function parseMinutesFromCommon(match: RegExpMatchArray | null): number | null {
  if (!match) return null
  const n = Number(match[1])
  if (!Number.isFinite(n) || n <= 0 || n > 60) return null
  return n
}

/**
 * Tente de reconnaître le format dans la chaîne. Insensible à la casse,
 * tolère les backticks, accents absents/présents, apostrophes typographiques.
 */
export function parseBlockFormat(format: string | undefined | null): TimedBlockFormat {
  if (!format) return { type: 'rounds' }
  // Normalisation : on retire les backticks décoratifs et on lowercase.
  const normalized = format
    .replace(/`/g, '')
    .replace(/\u2019/g, "'") // apostrophe typographique → simple
    .trim()
    .toLowerCase()

  // ── Tabata : "tabata 8x 20/10s", "tabata 8 rounds 20s/10s", etc.
  //   Capture : rounds (1..30), workSeconds, restSeconds.
  const tabata = normalized.match(
    /tabata[^\d]*?(\d+)\s*(?:x|×|rounds?|tours?)?[^\d]*?(\d+)\s*s?\s*(?:\/|\s)\s*(\d+)\s*s/i,
  )
  if (tabata) {
    const rounds = Number(tabata[1])
    const workSeconds = Number(tabata[2])
    const restSeconds = Number(tabata[3])
    if (
      Number.isFinite(rounds) && rounds > 0 && rounds <= 30 &&
      Number.isFinite(workSeconds) && workSeconds > 0 &&
      Number.isFinite(restSeconds) && restSeconds >= 0
    ) {
      return {
        type: 'tabata',
        workSeconds,
        restSeconds,
        rounds,
        totalSeconds: rounds * (workSeconds + restSeconds),
      }
    }
  }

  // ── AMRAP : "amrap 10'", "amrap 10 min"
  const amrap = normalized.match(/amrap\s+(\d+)\s*(?:'|min|m\b)?/i)
  if (amrap) {
    const minutes = parseMinutesFromCommon(amrap)
    if (minutes != null) {
      return { type: 'amrap', totalSeconds: minutes * 60 }
    }
  }

  // ── For Time : "for time", "a.f.a.p.", "au plus vite"
  if (/\bfor\s*time\b/i.test(normalized) || /\bafap\b/i.test(normalized)) {
    return { type: 'for_time' }
  }

  // ── EMOM : "emom 8'", "emom 6 min", "emom 9", "e.m.o.m. 8"
  const emom = normalized.match(/\bemom\b[^\d]*(\d+)\s*(?:'|min|m\b)?/i)
  if (emom) {
    const minutes = parseMinutesFromCommon(emom)
    if (minutes != null) {
      return {
        type: 'emom',
        totalSeconds: minutes * 60,
        intervalSeconds: 60,
        rounds: minutes,
      }
    }
  }

  return { type: 'rounds' }
}

export function isTimedFormat(format: TimedBlockFormat): format is Exclude<TimedBlockFormat, { type: 'rounds' }> {
  return format.type !== 'rounds'
}
