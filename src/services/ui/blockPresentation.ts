import type { Block } from '../../types/motherSession'
import type { Lang } from '../../services/motherSession/localizeMotherSessionExerciseName'
import { isDirectiveText } from '../motherSession/motherSessionExerciseMap'
import warmupAsset from '../../assets/echauffement_rufo.png'
import powerAsset from '../../assets/puissance_rufo.png'
import forceAsset from '../../assets/force_rufo.png'
import finisherAsset from '../../assets/finisher_rufo.png'
import cooldownAsset from '../../assets/calme_rufo.png'
import posteriorChainAsset from '../../assets/chaine_rufo.png'
import conditioningAsset from '../../assets/conditionnement_rufo.png'
import rewardAsset from '../../assets/recompense_rufo.png'
import defaultAsset from '../../assets/support_rufo.png'

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

// Illustrations DA "rufo" générées via ChatGPT — sérigraphie rugby zine.
// Les catégories sans entrée gardent leur emoji jusqu'à ce qu'une
// illustration soit générée et validée.
const ICON_ASSET: Record<BlockKind, string> = {
  warmup: warmupAsset,
  power: powerAsset,
  force: forceAsset,
  finisher: finisherAsset,
  cooldown: cooldownAsset,
  posterior_chain: posteriorChainAsset,
  conditioning: conditioningAsset,
  reward: rewardAsset,
  default: defaultAsset,
}

export function iconAssetForBlock(block: Block): string | null {
  return ICON_ASSET[classifyBlock(block)] ?? null
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

/**
 * Number of sets/tours this exercise expects (e.g. "3×10-12" → 3, "2x10" → 2).
 * Returns null when the prescription has no leading set count.
 */
export function parseExerciseSets(prescription: string): number | null {
  const match = prescription.match(/^\s*(\d+)\s*[x×]/i)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 && n <= 12 ? n : null
}

/** Affiche un repos inter-tours lisible (évite "2 min" pour 90 s). */
export function formatInterTourRest(seconds: number, lang: Lang = 'fr'): string {
  if (seconds <= 0) return ''
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) {
    return lang === 'fr' ? `${mins} min` : `${mins} min`
  }
  return lang === 'fr' ? `${mins} min ${secs}` : `${mins}:${String(secs).padStart(2, '0')}`
}

const parseSets = parseExerciseSets

/**
 * Extract inter-tour rest from a prescription/format string.
 *
 * Handles the full range of mother-session format conventions:
 *   - "`90-120s` rest after the pair"          → 120
 *   - "`75-90s` rest"                          → 90
 *   - "full rest `3 min` after each round"     → 180
 *   - "`2-3 min` rest between sets"            → 180
 *   - "`4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round"
 *                                              → 240 (takes the longer rest = inter-round)
 *   - "@ 90s" / "(60s)" / "repos 3 min"        → legacy patterns
 *
 * Rationale (KB strength-methods.md): when a range is given, prefer the upper
 * bound so the chrono guarantees adequate recovery — the user can always
 * shorten via the −10s / Skip controls.
 */
function parseRestSeconds(prescription: string): number | null {
  const text = prescription.replace(/`/g, ' ').replace(/\s+/g, ' ')
  const candidates: number[] = []

  const restQualifier =
    '(?:rest|between\\s+(?:rounds?|sets?|reps?|pairs?|triplets?|drills?|exercises)|after\\s+(?:each|the|every)\\s+(?:rounds?|sets?|pairs?|triplets?|reps?))'
  const patterns = [
    // "<num>[-<num>] (s|min) ... rest|between rounds|after each round" — number BEFORE qualifier
    new RegExp(
      `(\\d+)(?:\\s*[-–]\\s*(\\d+))?\\s*(min|sec|s)\\b[^,;]{0,30}?\\b${restQualifier}\\b`,
      'gi',
    ),
    // "rest <num>[-<num>] (s|min)"              — number AFTER rest (incl. "full rest")
    /\brest\s+(\d+)(?:\s*[-–]\s*(\d+))?\s*(min|sec|s)\b/gi,
    // "@<num> (s|min)" or "(<num>s)"            — legacy compact prescriptions
    /[@(]\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*(min|sec|s)\b/gi,
    // "repos [...] <num> min"                   — legacy French
    /\brepos(?:\s+\w+)?\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*(min|sec|s)\b/gi,
  ]

  for (const pattern of patterns) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const upper = m[2] ?? m[1]
      const unit = m[3].toLowerCase()
      const value = Number(upper)
      if (!Number.isFinite(value)) continue
      candidates.push(unit === 'min' ? value * 60 : value)
    }
  }

  if (candidates.length === 0) return null
  return Math.max(...candidates)
}

/**
 * Nombre de TOURS à exécuter pour ce bloc (enchaînement des exos).
 * Stratégie : lire le format ("3 tours", "4 rounds"), sinon prendre le MAX
 * des compteurs encodés sur les exos (prescription "4×5" → 4), sinon défaut à 3.
 *
 * On prend le max (et non le 1er exo) pour rester correct quand des exos
 * optionnels avec moins de séries (ex. "2×12-15") sont placés en fin de bloc.
 */
export function parseBlockTourCount(block: Block): number {
  if (block.format) {
    // "4 work sets" = séries lourdes sur le même exo, pas 4 tours du circuit.
    if (/\bwork\s*sets\b/i.test(block.format)) {
      return 1
    }
    const tourMatch = block.format.match(/(\d+)\s*(?:tour|round)/i)
    if (tourMatch) {
      const n = Number(tourMatch[1])
      if (Number.isFinite(n) && n > 0 && n <= 12) return n
    }
  }
  let max = 0
  for (const ex of block.exercises) {
    if (isDirectiveText(ex.name)) continue
    const n = parseSets(ex.prescription)
    if (n != null && n > max) max = n
  }
  if (max > 0) return max
  return 3
}

/**
 * Durée de repos inter-tours en secondes. Lue sur le format d'abord (ex. "Repos 3 min"),
 * sinon sur la 1ère prescription. Défaut 90s.
 */
export function parseBlockRestSeconds(block: Block): number {
  if (block.format) {
    const fromFormat = parseRestSeconds(block.format)
    if (fromFormat != null) return fromFormat
  }
  for (const ex of block.exercises) {
    if (isDirectiveText(ex.name)) continue
    const fromPrescription = parseRestSeconds(ex.prescription)
    if (fromPrescription != null) return fromPrescription
  }
  return 90
}

/**
 * Prescription à exécuter par tour pour un exo — strip le préfixe "N×" qui désigne
 * le nombre de tours global (repris depuis le bloc), on ne garde que la consigne
 * par tour (reps, temps, distance, …).
 */
export function perTourPrescription(prescription: string): string {
  const stripped = prescription.replace(/^\s*\d+\s*[x×]\s*/i, '').trim()
  return stripped.length > 0 ? stripped : prescription
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
