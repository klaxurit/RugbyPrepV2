/**
 * Audit de couverture des ancres d'intensité.
 *
 * Une prescription `4x8-10` sans RIR ni %1RM laisse l'athlète libre de
 * sous-doser. Le moteur de progression suppose une zone d'effort (RIR 1-2 hors
 * saison, RIR 2-3 en saison) : cette zone doit être écrite dans la prescription
 * pour que le joueur et le log parlent le même langage.
 */

import type { MotherSession } from '../../../types/motherSession'
import { inferBlockIntent } from '../restTimes/inferBlockIntent'
import type { Intent } from '../restTimes/kbRanges'

/** Intents où une ancre d'effort est attendue sur les séries de reps. */
const ANCHORED_INTENTS: ReadonlySet<Intent> = new Set([
  'force',
  'hypertrophy',
  'dynamic',
  'dup_endurance',
  'power_contrast',
])

const SKIP_NAME_RE =
  /jump|throw|plyo|slam|swing|bound|hop|sprint|shuttle|skip|carry|hold|plank|crawl|stretch|isometric|pogo|sled|chest pass|band rotation/i

const SETS_X_REPS_RE = /^\s*\d+(?:[-–]\d+)?\s*[x×]\s*\d+(?:[-–]\d+)?/i
const HAS_ANCHOR_RE = /@|%|RIR|RPE/i
/** Intent max / vitesse : l'effort est déjà ancré en prose, pas en RIR. */
const INTENT_ANCHORED_RE = /\bmax\b|intention|speed/i
const NON_REPS_RE = /\d+\s*(s|sec|min|m)\b|progressive\s+sets/i

export interface MissingIntensityAnchor {
  sessionId: string
  cycle: string
  blockNum: number
  blockName: string
  exerciseName: string
  prescription: string
  intent: Intent
}

export function auditIntensityAnchors(sessions: MotherSession[]): MissingIntensityAnchor[] {
  const missing: MissingIntensityAnchor[] = []

  for (const session of sessions) {
    for (const block of session.blocks) {
      const intent = inferBlockIntent(block, session)
      if (!ANCHORED_INTENTS.has(intent)) continue

      for (const exercise of block.exercises) {
        const p = exercise.prescription ?? ''
        if (!p.trim()) continue
        if (SKIP_NAME_RE.test(exercise.name)) continue
        if (NON_REPS_RE.test(p)) continue
        if (!SETS_X_REPS_RE.test(p)) continue
        if (HAS_ANCHOR_RE.test(p) || INTENT_ANCHORED_RE.test(p)) continue

        missing.push({
          sessionId: session.metadata.id,
          cycle: session.metadata.cycle,
          blockNum: block.number,
          blockName: block.name,
          exerciseName: exercise.name,
          prescription: p,
          intent,
        })
      }
    }
  }

  return missing
}

export function formatMissingAnchor(m: MissingIntensityAnchor): string {
  return `${m.sessionId}#${m.blockNum} — ${m.exerciseName} \`${m.prescription}\` [${m.intent}]`
}
