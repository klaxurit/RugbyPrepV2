import { exercisesList, getExerciseById } from '../../data/exercises'
import {
  normalizeExerciseName,
  resolveExerciseId,
  resolveExerciseIdForSessionRun,
} from '../motherSession/motherSessionExerciseMap'

const BACKTICK_RE = /`([^`]+)`/g

/** Extrait les libellés entre backticks d’une ligne Alternatives MD. */
export function extractBacktickLabels(text: string): string[] {
  const labels: string[] = []
  for (const match of text.matchAll(BACKTICK_RE)) {
    const label = match[1]?.trim()
    if (label) labels.push(label)
  }
  return labels
}

/**
 * Résout un libellé MD / catalogue vers un exerciseId.
 * Tolère « Front Squat », « Front squat barre », etc.
 */
export function resolveExerciseLabelToId(label: string): string | undefined {
  const trimmed = label.trim()
  if (!trimmed) return undefined

  const fromMap = resolveExerciseIdForSessionRun(trimmed)
  if (fromMap) return fromMap

  const normalized = normalizeExerciseName(trimmed)
  const stripped = normalized
    .replace(/\s+(barre|haltères|halteres|dumbbells?|db|machine|cable|band)$/i, '')
    .trim()
  if (stripped && stripped !== normalized) {
    const fromStripped = resolveExerciseId(stripped)
    if (fromStripped) return fromStripped
  }

  const aliases: Record<string, string> = {
    'pin squat': 'squat__pin_squat__barbell',
    'pin squat barre': 'squat__pin_squat__barbell',
    'front squat barre': 'squat__front_squat__barbell',
    'box squat barre': 'squat__box_squat__barbell',
  }
  if (aliases[normalized]) return aliases[normalized]
  if (aliases[stripped]) return aliases[stripped]

  for (const ex of exercisesList) {
    const id = ex.exerciseId ?? ex.id
    if (!id) continue
    if (normalizeExerciseName(ex.nameFr ?? '') === normalized) return id
    if (normalizeExerciseName(ex.name ?? '') === normalized) return id
  }

  return undefined
}

export type ParsedFallbackMention = {
  sourceLine: string
  exerciseIds: string[]
  unresolvedLabels: string[]
}

export function parseFallbackOptionLine(line: string): ParsedFallbackMention {
  const labels = extractBacktickLabels(line)
  const exerciseIds: string[] = []
  const unresolvedLabels: string[] = []
  for (const label of labels) {
    const id = resolveExerciseLabelToId(label)
    if (id) exerciseIds.push(id)
    else unresolvedLabels.push(label)
  }
  return { sourceLine: line, exerciseIds, unresolvedLabels }
}

const PATTERN_FAMILIES: ReadonlyArray<ReadonlySet<string>> = [
  new Set(['squat', 'lower_squat', 'lower_lunge', 'lower_step']),
  new Set(['hinge', 'hamstring']),
  new Set(['push_horizontal', 'push_vertical']),
  new Set(['pull_horizontal', 'pull_vertical']),
  new Set(['power', 'lower_jump']),
  new Set(['core_anti_rotation', 'core_rotation', 'activation']),
  new Set(['groin_adductors']),
  new Set(['prehab_shoulder', 'neck']),
]

function patternFamily(pattern: string | undefined): ReadonlySet<string> | null {
  if (!pattern) return null
  for (const family of PATTERN_FAMILIES) {
    if (family.has(pattern)) return family
  }
  return new Set([pattern])
}

export function patternsCompatible(
  prescribedPattern: string | undefined,
  candidatePattern: string | undefined,
): boolean {
  if (!prescribedPattern || !candidatePattern) return false
  if (prescribedPattern === candidatePattern) return true
  const family = patternFamily(prescribedPattern)
  return family?.has(candidatePattern) ?? false
}

export type BlockExerciseRef = {
  exerciseIndex: number
  exerciseId: string
  name: string
  role?: string
}

export type AttributedBlockFallbacks = {
  byExerciseIndex: Record<number, string[]>
  residualLines: string[]
}

/**
 * Rattache les alternatives MD d’un bloc aux exos du bloc (même famille de pattern).
 * Clés = `exerciseIndex` du ref (pas l’index du tableau filtré).
 */
export function attributeFallbackOptionsToBlockExercises(
  fallbackOptions: readonly string[] | undefined,
  blockExercises: readonly BlockExerciseRef[],
): AttributedBlockFallbacks {
  const hosts = blockExercises.filter((ex) => Boolean(ex.exerciseId))
  const byExerciseIndex: Record<number, string[]> = {}
  const residualLines: string[] = []

  const pushAlt = (exerciseIndex: number, altId: string) => {
    const host = hosts.find((h) => h.exerciseIndex === exerciseIndex)
    if (!host || altId === host.exerciseId) return
    const list = byExerciseIndex[exerciseIndex] ?? []
    if (!list.includes(altId)) list.push(altId)
    byExerciseIndex[exerciseIndex] = list
  }

  const findHostByMention = (ids: string[]): number | null => {
    for (const id of ids) {
      const host = hosts.find((ex) => ex.exerciseId === id)
      if (host) return host.exerciseIndex
    }
    return null
  }

  const findHostByPattern = (candidateId: string): number | null => {
    const candidate = getExerciseById(candidateId)
    if (!candidate?.pattern) return null

    const matches = hosts.filter((ex) => {
      const host = getExerciseById(ex.exerciseId)
      return patternsCompatible(host?.pattern, candidate.pattern)
    })

    if (matches.length === 0) return null
    const prime = matches.find((m) => m.role === 'prime')
    return (prime ?? matches[0]).exerciseIndex
  }

  for (const line of fallbackOptions ?? []) {
    const parsed = parseFallbackOptionLine(line)
    if (parsed.exerciseIds.length === 0) {
      residualLines.push(line)
      continue
    }

    const mentionedHost = findHostByMention(parsed.exerciseIds)
    const altIds =
      mentionedHost != null
        ? parsed.exerciseIds.filter(
            (id) => id !== hosts.find((h) => h.exerciseIndex === mentionedHost)?.exerciseId,
          )
        : parsed.exerciseIds

    if (altIds.length === 0) {
      residualLines.push(line)
      continue
    }

    let attributed = false
    if (mentionedHost != null) {
      for (const altId of altIds) {
        pushAlt(mentionedHost, altId)
        attributed = true
      }
    } else {
      for (const altId of altIds) {
        const host = findHostByPattern(altId)
        if (host == null) continue
        pushAlt(host, altId)
        attributed = true
      }
    }

    if (!attributed) residualLines.push(line)
  }

  return { byExerciseIndex, residualLines }
}

export type BuiltAlternativeGroup = {
  exerciseIndex: number
  prescribedId: string
  currentId: string
  hostName: string
  mdAlternativeIds: string[]
}

/**
 * Construit les groupes Alternatives pour un bloc (prescrit vs affiché).
 */
export function buildBlockAlternativeGroups(args: {
  preparedExercises: readonly {
    name: string
    exerciseId?: string
    role?: string
  }[]
  displayExercises: readonly {
    name: string
    exerciseId?: string
  }[]
  fallbackOptions?: readonly string[]
}): { groups: BuiltAlternativeGroup[]; residualLines: string[] } {
  const refs: BlockExerciseRef[] = args.preparedExercises.map((exo, exerciseIndex) => ({
    exerciseIndex,
    exerciseId: resolveExerciseIdForSessionRun(exo.name ?? '', exo.exerciseId) ?? '',
    name: exo.name,
    role: exo.role,
  }))

  const attributed = attributeFallbackOptionsToBlockExercises(args.fallbackOptions, refs)

  const groups: BuiltAlternativeGroup[] = []
  for (const ref of refs) {
    if (!ref.exerciseId) continue
    const display = args.displayExercises[ref.exerciseIndex]
    const currentId =
      resolveExerciseIdForSessionRun(display?.name ?? '', display?.exerciseId) ??
      ref.exerciseId
    groups.push({
      exerciseIndex: ref.exerciseIndex,
      prescribedId: ref.exerciseId,
      currentId,
      hostName: ref.name,
      mdAlternativeIds: attributed.byExerciseIndex[ref.exerciseIndex] ?? [],
    })
  }

  return { groups, residualLines: attributed.residualLines }
}
