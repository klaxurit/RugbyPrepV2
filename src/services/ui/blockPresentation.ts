import type { Block } from '../../types/motherSession'
import { isDirectiveText } from '../motherSession/motherSessionExerciseMap'

export type BlockKind =
  | 'warmup'
  | 'force'
  | 'power'
  | 'posterior_chain'
  | 'finisher'
  | 'reward'
  | 'cooldown'
  | 'conditioning'
  | 'default'

const ICON: Record<BlockKind, string> = {
  warmup: '🔥',
  force: '💪',
  power: '⚡',
  posterior_chain: '🔗',
  finisher: '🏁',
  reward: '🎁',
  cooldown: '🧘',
  conditioning: '💨',
  default: '🏋️',
}

function hasAny(text: string, needles: string[]): boolean {
  const lower = text.toLowerCase()
  return needles.some((n) => lower.includes(n))
}

/**
 * Heuristique légère pour classer un bloc à partir de son nom + format.
 * Ne couvre pas tous les cas — tombe sur `default` plutôt que d'inventer.
 */
export function classifyBlock(block: Block): BlockKind {
  const name = block.name ?? ''
  const format = block.format ?? ''
  const combined = `${name} ${format}`

  if (hasAny(combined, ['échauff', 'echauff', 'warm-up', 'warmup', 'activation'])) {
    return 'warmup'
  }
  if (hasAny(combined, ['récompense', 'recompense', 'reward', 'bras', 'finition bras'])) {
    return 'reward'
  }
  if (hasAny(combined, ['finisher', 'emom', '1re ligne', '1res lignes', 'premiere ligne', 'support 1'])) {
    return 'finisher'
  }
  if (hasAny(combined, ['chaîne post', 'chaine post', 'posterior', 'hinge'])) {
    return 'posterior_chain'
  }
  if (hasAny(combined, ['contraste', 'puissance', 'vitesse', 'speed', 'plyo', 'saut', 'cmj', 'power'])) {
    return 'power'
  }
  if (hasAny(combined, ['conditionnement', 'condition', 'cardio', 'aérobie', 'aerobie', 'lactique'])) {
    return 'conditioning'
  }
  if (hasAny(combined, ['mobilité', 'mobilite', 'étirement', 'etirement', 'récup', 'recup', 'cool-down', 'cooldown'])) {
    return 'cooldown'
  }
  if (hasAny(combined, ['force', 'hypertrophy', 'hypertrophie', 'développé', 'squat', 'deadlift'])) {
    return 'force'
  }
  return 'default'
}

export function iconForBlock(block: Block): string {
  return ICON[classifyBlock(block)]
}

// ── Duration estimation ─────────────────────────────────────────────────────

function parseSets(prescription: string): number | null {
  const match = prescription.match(/^\s*(\d+)\s*[x×]/i)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 && n <= 12 ? n : null
}

function parseRestSeconds(prescription: string): number | null {
  const sec = prescription.match(/@\s*(\d+)\s*s/i)
  if (sec) {
    const n = Number(sec[1])
    return Number.isFinite(n) ? n : null
  }
  const min = prescription.match(/(?:@|repos)\s*(\d+)\s*min/i)
  if (min) {
    const n = Number(min[1])
    return Number.isFinite(n) ? n * 60 : null
  }
  return null
}

/**
 * Estime la durée d'exécution d'un bloc en secondes.
 * Modèle simple : somme des exos × (sets × (~40s travail + repos)).
 * Pas précis mais donne un ordre de grandeur utile pour l'aperçu.
 */
export function estimateBlockSeconds(block: Block): number {
  const loggable = block.exercises.filter((ex) => !isDirectiveText(ex.name))
  if (loggable.length === 0) return 0
  const WORK_PER_SET_SEC = 40
  let total = 0
  for (const ex of loggable) {
    const sets = parseSets(ex.prescription) ?? 3
    const rest = parseRestSeconds(ex.prescription) ?? 90
    total += sets * (WORK_PER_SET_SEC + rest)
  }
  return total
}

export function estimateBlockMinutes(block: Block): number {
  return Math.max(1, Math.round(estimateBlockSeconds(block) / 60))
}

/**
 * Génère un résumé court des exercices (2-3 noms) pour le mode Aperçu fermé.
 */
export function summarizeBlockExercises(
  block: Block,
  resolveName: (exerciseId: string, fallback: string) => string,
  limit = 3,
): string {
  const names: string[] = []
  for (const ex of block.exercises) {
    if (isDirectiveText(ex.name)) continue
    names.push(resolveName(ex.exerciseId ?? '', ex.name))
    if (names.length >= limit) break
  }
  return names.join(' · ')
}
