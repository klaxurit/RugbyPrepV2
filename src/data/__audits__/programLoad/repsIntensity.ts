/**
 * Audit cohérence répétitions × %1RM.
 *
 * Une prescription du type `4x4-5 @ 85-90%` promet implicitement que le pire
 * cas (reps hautes à l'intensité haute) reste réalisable. Or 5 répétitions
 * correspondent déjà à ~87 % du 1RM à 0 RIR : demander 5 reps à 90 % est
 * arithmétiquement impossible, a fortiori quand la note de coaching réclame
 * 1-2 RIR de réserve.
 *
 * Source de la table : consensus Brzycki / Epley / NSCA, aligné sur
 * `estimateOneRM.ts` (Brzycki en dessous de 6 reps).
 */

import type { MotherSession } from '../../../types/motherSession'

/** % du 1RM théoriquement mobilisable pour N répétitions à 0 RIR. */
const REP_MAX_TABLE: Record<number, number> = {
  1: 100,
  2: 95,
  3: 92.5,
  4: 90,
  5: 87,
  6: 85,
  7: 82.5,
  8: 80,
  9: 77.5,
  10: 75,
  12: 70,
  15: 65,
}

/** Plafond d'intensité pour un nombre de reps donné (interpolation basse). */
export function ceilingPctForReps(reps: number): number {
  const exact = REP_MAX_TABLE[reps]
  if (exact != null) return exact
  const keys = Object.keys(REP_MAX_TABLE).map(Number)
  const below = keys.filter((k) => k <= reps)
  if (below.length === 0) return 100
  return REP_MAX_TABLE[Math.max(...below)]
}

export interface RepsIntensityFinding {
  sessionId: string
  cycle: string
  blockNum: number
  blockName: string
  exerciseName: string
  prescription: string
  /** Répétitions hautes de la fourchette prescrite. */
  repsHigh: number
  /** Intensité haute de la fourchette prescrite (% 1RM). */
  pctHigh: number
  /** Plafond théorique pour `repsHigh`. */
  ceilingPct: number
  /** Points de % au-dessus du plafond. > 0 = incohérent. */
  gapPoints: number
}

interface ParsedSpec {
  repsHigh: number
  pctHigh: number
}

/**
 * Extrait reps hautes et % haut d'une prescription.
 * Reconnaît `4x4-5 @ 85-90%`, `3x3 @ 82-85%`, `4x3 @ 85%`, `3x3 @ ~70-75%, max intent`.
 * Retourne null si la prescription ne porte pas de %1RM (cas majoritaire).
 */
export function parseRepsAndIntensity(prescription: string): ParsedSpec | null {
  if (!prescription) return null
  const text = prescription.replace(/`/g, '')

  const repsMatch = text.match(/[x×]\s*(\d+)(?:\s*[-–]\s*(\d+))?/i)
  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?\s*%/)
  if (!repsMatch || !pctMatch) return null

  const repsHigh = Number(repsMatch[2] ?? repsMatch[1])
  const pctHigh = Number(pctMatch[2] ?? pctMatch[1])
  if (!Number.isFinite(repsHigh) || !Number.isFinite(pctHigh)) return null

  return { repsHigh, pctHigh }
}

/** Toutes les prescriptions du corpus qui portent un %1RM. */
export function collectIntensityPrescriptions(
  sessions: MotherSession[],
): RepsIntensityFinding[] {
  const rows: RepsIntensityFinding[] = []
  for (const session of sessions) {
    for (const block of session.blocks) {
      for (const exercise of block.exercises) {
        const parsed = parseRepsAndIntensity(exercise.prescription)
        if (!parsed) continue
        const ceilingPct = ceilingPctForReps(parsed.repsHigh)
        rows.push({
          sessionId: session.metadata.id,
          cycle: session.metadata.cycle,
          blockNum: block.number,
          blockName: block.name,
          exerciseName: exercise.name,
          prescription: exercise.prescription,
          repsHigh: parsed.repsHigh,
          pctHigh: parsed.pctHigh,
          ceilingPct,
          gapPoints: Math.round((parsed.pctHigh - ceilingPct) * 10) / 10,
        })
      }
    }
  }
  return rows
}

/** Prescriptions dont le pire cas dépasse le plafond théorique. */
export function auditRepsIntensity(sessions: MotherSession[]): RepsIntensityFinding[] {
  return collectIntensityPrescriptions(sessions).filter((r) => r.gapPoints > 0)
}

export function formatFinding(f: RepsIntensityFinding): string {
  return (
    `${f.sessionId} #${f.blockNum} "${f.blockName}" — ${f.exerciseName} \`${f.prescription}\` : ` +
    `${f.repsHigh} reps à ${f.pctHigh}% dépasse de ${f.gapPoints} points le plafond ${f.ceilingPct}%`
  )
}
