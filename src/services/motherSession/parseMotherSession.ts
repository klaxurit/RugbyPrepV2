import type {
  Block,
  Exercise,
  InjurySubstitution,
  InjurySubstitutionArea,
  MotherSession,
  MotherSessionCycle,
  MotherSessionMetadata,
  MotherSessionStatus,
  MotherSessionTargetLevel,
  MotherSessionType,
  WarmUp,
} from '../../types/motherSession'
import { parseRestSecondsFromText } from '../ui/blockPresentation'

function deriveIdFromPath(filePath?: string): string {
  if (!filePath || !filePath.trim()) return 'unknown'
  const base = filePath.split(/[/\\]/).pop() ?? ''
  return base.replace(/\.md$/i, '').trim() || 'unknown'
}

function normalizeSessionType(raw: string): MotherSessionType {
  const t = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
  if (t === 'speed_field') return 'speed_power'
  if (t === 'full_body') return 'full'
  const allowed: MotherSessionType[] = [
    'upper',
    'lower',
    'full',
    'full_light_primer',
    'speed_power',
  ]
  if (allowed.includes(t as MotherSessionType)) return t as MotherSessionType
  return 'full'
}

function normalizeStatus(raw: string): MotherSessionStatus {
  const s = raw.trim().toLowerCase()
  if (s === 'draft' || s === 'validated' || s === 'ready_for_mapping') return s
  return 'draft'
}

function normalizeCycle(raw: string): MotherSessionCycle {
  const c = raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  if (c === 'off_season' || c === 'pre_season' || c === 'in_season') return c
  return 'in_season'
}

function normalizeTargetLevel(raw: string): MotherSessionTargetLevel {
  const t = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
  if (t === 'starter' || t === 'beginner') return 'starter'
  if (t === 'builder' || t === 'intermediate') return 'builder'
  if (t === 'performance' || t === 'advanced' || t === 'elite') return 'performance'
  return 'builder'
}

function metaPick(meta: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = meta[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function parseMetadataBlock(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^-\s*`([^`]+)`:\s*(.+)$/)
    if (m) out[m[1].trim().toLowerCase()] = m[2].trim()
  }
  return out
}

/**
 * `reduction_order`: `4, 3, 2` → ordre de sacrifice des blocs.
 * Absent ou vide → aucune consigne, le consommateur applique son défaut.
 */
function parseReductionOrder(raw: string | undefined): number[] | undefined {
  if (!raw) return undefined
  const nums = raw
    .split(/[,\s]+/)
    .map((token) => Number(token.replace(/[^\d]/g, '')))
    .filter((n) => Number.isInteger(n) && n > 0)
  if (nums.length === 0) return undefined
  return [...new Set(nums)]
}

function splitPreamble(markdown: string): {
  title?: string
  metadataBlock: string
  body: string
} {
  const lines = markdown.split(/\r?\n/)
  let i = 0
  let title: string | undefined
  if (lines[0]?.startsWith('# ')) {
    title = lines[0].slice(2).trim()
    i = 1
  }
  while (i < lines.length && lines[i].trim() === '') i++
  let metaEnd = i
  while (metaEnd < lines.length && !/^## /.test(lines[metaEnd])) metaEnd++
  const metadataBlock = lines.slice(i, metaEnd).join('\n').trim()
  const body = lines.slice(metaEnd).join('\n')
  return { title, metadataBlock, body }
}

function splitSections(body: string): Map<string, string> {
  const map = new Map<string, string>()
  const lines = body.split(/\r?\n/)
  let current: string | null = null
  const buf: string[] = []
  const flush = () => {
    if (current !== null) map.set(current.toLowerCase().trim(), buf.join('\n').trim())
  }
  for (const line of lines) {
    const m = line.match(/^## (.+)\s*$/)
    if (m) {
      flush()
      current = m[1].trim()
      buf.length = 0
    } else if (current !== null) buf.push(line)
  }
  flush()
  return map
}

function bulletLines(section: string | undefined): string[] {
  if (!section) return []
  const out: string[] = []
  for (const line of section.split(/\r?\n/)) {
    const t = line.trim()
    if (/^-\s+/.test(t)) out.push(t.replace(/^-\s+/, '').trim())
  }
  return out
}

function parseWarmUpExerciseContent(content: string): { name: string; prescription: string } | null {
  const trimmed = content.trim()
  if (!trimmed) return null
  const segments = [...trimmed.matchAll(/`([^`]+)`/g)].map((r) => r[1])
  if (segments.length === 0) {
    return { name: trimmed, prescription: '' }
  }
  if (segments.length === 1) return { name: segments[0], prescription: '' }
  const prescription = segments[segments.length - 1]
  const name = segments.slice(0, -1).join(' or ')
  return { name, prescription }
}

function parseWarmUp(section: string | undefined): WarmUp {
  const exercises: { name: string; prescription: string }[] = []
  const notes: string[] = []
  if (!section) return { exercises, notes }

  const rec = section.match(/###\s*Recommended warm-up\s*([\s\S]*?)(?=###\s*Notes\b|$)/i)
  const notesPart = section.match(/###\s*Notes\s*([\s\S]*)/i)

  if (rec) {
    for (const line of rec[1].split(/\r?\n/)) {
      const t = line.trim()
      if (!t.startsWith('- ')) continue
      const parsed = parseWarmUpExerciseContent(t.slice(2))
      if (parsed) exercises.push(parsed)
    }
  }

  if (notesPart) {
    for (const line of notesPart[1].split(/\r?\n/)) {
      const t = line.trim()
      if (/^-\s+/.test(t)) notes.push(t.replace(/^-\s+/, '').trim())
    }
  }

  return { exercises, notes }
}

/** Parse `- Exercise A: ...` avec backticks, minute N, rôle optionnel */
export function parseExerciseLine(rawLine: string): Exercise | null {
  const line = rawLine.trim()
  const m = line.match(/^-\s*Exercise\s+([A-Z])\s*:\s*(.+)$/i)
  if (!m) return null
  let rest = m[2].trim()

  let role: Exercise['role']
  const roleM = rest.match(/^\((prime|contrast|support)\)\s*/i)
  if (roleM) {
    role = roleM[1].toLowerCase() as Exercise['role']
    rest = rest.slice(roleM[0].length).trim()
  }

  let slotLabel: string | undefined
  const minM = rest.match(/^(minute\s+\d+)\s+/i)
  if (minM) {
    slotLabel = minM[1]
    rest = rest.slice(minM[0].length).trim()
  }

  // Strip and remember a trailing "*(optional)*" or "(optional)" marker.
  let isOptional = false
  const optionalM = rest.match(/\s*\*?\(\s*optional\s*\)\*?\s*$/i)
  if (optionalM) {
    isOptional = true
    rest = rest.slice(0, optionalM.index).trim()
  }

  const segments = [...rest.matchAll(/`([^`]+)`/g)].map((r) => r[1])
  let result: Exercise
  if (segments.length === 0) {
    result = { name: rest, prescription: '', role, slotLabel }
  } else if (segments.length === 1) {
    result = { name: segments[0], prescription: '', role, slotLabel }
  } else {
    let prescription = segments[segments.length - 1]
    let name = segments.slice(0, -1).join(' or ')
    let restAfterSetSeconds: number | undefined

    if (segments.length >= 3) {
      const maybeRest = segments[segments.length - 1]
      const parsedRest = parseRestSecondsFromText(`rest ${maybeRest}`)
      if (parsedRest != null && /^(?:rest|repos)\b/i.test(maybeRest.trim())) {
        restAfterSetSeconds = parsedRest
        prescription = segments[segments.length - 2]
        name = segments.slice(0, -2).join(' or ')
      }
    }

    result = { name, prescription, role, slotLabel }
    if (restAfterSetSeconds != null) result.restAfterSetSeconds = restAfterSetSeconds
  }
  if (isOptional) result.isOptional = true
  return result
}

function splitFallbackFromCoaching(
  coachingRawLines: string[]
): { coachingNotes: string[]; fallbackOptions: string[] } {
  const coachingRawAccum: string[] = []
  const fallbackOptions: string[] = []
  let inFallback = false
  let fallbackBaseIndent = 0

  for (const raw of coachingRawLines) {
    if (!raw.trim()) {
      if (!inFallback) coachingRawAccum.push(raw)
      continue
    }

    const trimmed = raw.trim()
    const indent = raw.match(/^(\s*)/)?.[1].length ?? 0

    if (/^-\s*Fallback options:\s*$/i.test(trimmed)) {
      inFallback = true
      fallbackBaseIndent = indent
      continue
    }

    if (inFallback) {
      if (/^\s*-\s+/.test(raw) && indent > fallbackBaseIndent) {
        fallbackOptions.push(trimmed.replace(/^-\s+/, '').trim())
        continue
      }
      if (/^\s*-\s+/.test(raw) && indent <= fallbackBaseIndent) {
        inFallback = false
      }
    }

    if (!inFallback) coachingRawAccum.push(raw)
  }

  return {
    coachingNotes: coachingRawAccum
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- '))
      .map((l) => l.slice(2).trim()),
    fallbackOptions,
  }
}

function parseBlockChunk(chunk: string): Block | null {
  const lines = chunk.split(/\r?\n/)
  const first = lines[0]?.trim() ?? ''
  const header = first.match(/^###\s+(Optional\s+)?Block\s+(\d+)\s*-\s*(.+)$/i)
  if (!header) return null

  const isOptional = Boolean(header[1]?.trim())
  const number = parseInt(header[2], 10)
  const name = header[3].trim()

  let format = ''
  const exerciseLines: string[] = []
  const coachingRaw: string[] = []
  let phase: 'pre' | 'coaching' = 'pre'

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (/^-\s*Format:\s*/i.test(trimmed)) {
      format = trimmed.replace(/^-\s*Format:\s*/i, '').trim()
      continue
    }

    if (/^-\s*Coaching notes:\s*$/i.test(trimmed)) {
      phase = 'coaching'
      continue
    }

    if (phase === 'coaching') {
      coachingRaw.push(line)
      continue
    }

    if (/^-\s*Exercise\s+[A-Z]\s*:/i.test(trimmed)) {
      exerciseLines.push(trimmed)
    }
  }

  const exercises: Exercise[] = []
  for (const el of exerciseLines) {
    const ex = parseExerciseLine(el)
    if (ex) exercises.push(ex)
  }

  const { coachingNotes, fallbackOptions } = splitFallbackFromCoaching(coachingRaw)

  const block: Block = {
    number,
    name,
    format,
    exercises,
    coachingNotes,
  }
  if (isOptional) block.isOptional = true
  if (fallbackOptions.length > 0) block.fallbackOptions = fallbackOptions

  return block
}

function parseVisibleBlocks(section: string | undefined): Block[] {
  if (!section) return []
  const parts = section.split(/\n(?=###\s+)/)
  const blocks: Block[] = []
  for (const part of parts) {
    const t = part.trim()
    if (!t.startsWith('###')) continue
    const b = parseBlockChunk(t)
    if (b) blocks.push(b)
  }
  return blocks
}

const INJURY_HEADINGS: { pattern: RegExp; area: InjurySubstitutionArea }[] = [
  { pattern: /^###\s*Shoulder pain\s*$/im, area: 'shoulder_pain' },
  { pattern: /^###\s*Knee pain\s*$/im, area: 'knee_pain' },
  { pattern: /^###\s*Low back pain\s*$/im, area: 'low_back_pain' },
]

/**
 * Structure le corps d'une zone injury (Remove / Replace with / Rehab finisher).
 * Les puces sans en-tête de section sont rattachées à `remove` (contenu minimal / tests).
 */
function structureInjuryBody(lines: string[]): Pick<
  InjurySubstitution,
  'remove' | 'replaceWith' | 'rehabFinisher'
> {
  const remove: string[] = []
  const replaceWith: string[] = []
  const rehabFinisher: string[] = []
  type Bucket = 'remove' | 'replaceWith' | 'rehabFinisher' | null
  let bucket: Bucket = null

  for (const raw of lines) {
    const l = raw.trim()
    if (/^-\s*Remove:\s*$/i.test(l)) {
      bucket = 'remove'
      continue
    }
    if (/^-\s*Replace\s+with:\s*$/i.test(l)) {
      bucket = 'replaceWith'
      continue
    }
    if (/^-\s*Rehab\s+finisher:\s*$/i.test(l)) {
      bucket = 'rehabFinisher'
      continue
    }
    if (/^-\s+/.test(l)) {
      const content = l.replace(/^-\s+/, '').trim()
      if (bucket === 'remove') remove.push(content)
      else if (bucket === 'replaceWith') replaceWith.push(content)
      else if (bucket === 'rehabFinisher') rehabFinisher.push(content)
      else remove.push(content)
    }
  }

  return { remove, replaceWith, rehabFinisher }
}

function parseInjurySubstitutions(section: string | undefined): InjurySubstitution[] {
  if (!section) return []
  const out: InjurySubstitution[] = []
  for (const { pattern, area } of INJURY_HEADINGS) {
    const m = section.match(pattern)
    if (!m || m.index === undefined) continue
    const start = m.index + m[0].length
    const rest = section.slice(start)
    const next = rest.search(/\n###\s+/)
    const body = (next === -1 ? rest : rest.slice(0, next)).trim()
    const lines = body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    const structured = structureInjuryBody(lines)
    out.push({ area, ...structured })
  }
  return out
}

function parseSourceReferences(section: string | undefined): string[] {
  if (!section) return []
  return section
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^-\s+/.test(l))
    .map((l) => l.replace(/^-\s+/, '').trim())
}

/**
 * Parse le markdown d'une mother session en structure typée (fonction pure).
 */
export function parseMotherSession(markdown: string, filePath?: string): MotherSession {
  const { title, metadataBlock, body } = splitPreamble(markdown)
  const metaRaw = parseMetadataBlock(metadataBlock)
  const sections = splitSections(body)

  const idFromPath = deriveIdFromPath(filePath)
  const resolvedId =
    idFromPath !== 'unknown' ? idFromPath : title?.replace(/\s+/g, '_') ?? 'unknown'

  const metadata: MotherSessionMetadata = {
    id: resolvedId,
    status: normalizeStatus(metaRaw.status ?? 'draft'),
    version: metaPick(metaRaw, 'version'),
    cycle: normalizeCycle(metaRaw.cycle ?? 'in_season'),
    sessionType: normalizeSessionType(metaRaw.session_type ?? metaRaw.sessiontype ?? 'full'),
    targetLevel: normalizeTargetLevel(metaPick(metaRaw, 'target_level', 'targetlevel')),
    targetPositionGroup: metaPick(metaRaw, 'target_position_group', 'targetpositiongroup'),
    equipment: metaPick(metaRaw, 'equipment'),
    targetDuration: metaPick(metaRaw, 'target_duration', 'targetduration'),
    reductionOrder: parseReductionOrder(
      metaPick(metaRaw, 'reduction_order', 'reductionorder') || undefined,
    ),
  }

  return {
    metadata,
    title,
    goal: bulletLines(sections.get('goal')),
    sessionIdentity: bulletLines(sections.get('session identity')),
    warmUp: parseWarmUp(sections.get('warm-up')),
    blocks: parseVisibleBlocks(sections.get('visible blocks')),
    progressionRules: bulletLines(sections.get('progression rules')),
    positionAccent: bulletLines(sections.get('position accent')),
    injurySubstitutions: parseInjurySubstitutions(sections.get('injury substitutions')),
    coachingWarnings: bulletLines(sections.get('coaching warnings')),
    sourceReferences: parseSourceReferences(sections.get('source references')),
  }
}
