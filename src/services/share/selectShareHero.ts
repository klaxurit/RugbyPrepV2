/**
 * Carte de partage v2 — choix du héros et des chips (fonctions pures).
 *
 * Priorité du héros : a) record battu › b) semaine de match (J-1 à J-7)
 * › c) progression › d) par défaut (séance + durée + focus).
 * Le tonnage n’est jamais le héros : il peut seulement apparaître en chip.
 */
import type { Lang } from '../../i18n/appLabels'
import type { SessionSharePayload, ShareNextMatch, ShareProgression } from './sessionShareTypes'

export type { ShareNextMatch, ShareProgression }

export type ShareHero =
  | {
      kind: 'record'
      exerciseName: string
      kg: number
      deltaKg: number | null
      previousKg: number | null
      extraRecords: number
    }
  | { kind: 'match'; daysUntil: number; opponent: string | null; venue: 'home' | 'away' | null }
  | { kind: 'progression'; progression: ShareProgression }
  | { kind: 'session'; title: string; focus: string | null; durationMin: number }

export interface ShareChip {
  text: string
  filled?: boolean
  posts?: boolean
}

const MAX_CHIPS = 3
const MAX_FOCUS_LENGTH = 16

function stripFinalPeriod(text: string): string {
  return text.trim().replace(/[.。]+$/u, '').trim()
}

/** « Bas du corps · Puissance » → { title: « Bas du corps », focus: « Puissance » }. */
export function splitSessionLabel(label: string): { title: string; focus: string | null } {
  const raw = stripFinalPeriod(label)
  const parts = raw
    .split(/\s*[·•|]\s*|\s+-\s+/)
    .map((p) => stripFinalPeriod(p))
    .filter(Boolean)
  if (parts.length >= 2) {
    const focus = parts[parts.length - 1]!
    const title = parts.slice(0, -1).join(' ')
    if (focus.length <= MAX_FOCUS_LENGTH) return { title, focus }
    return { title: parts.join(' '), focus: null }
  }
  return { title: raw || '—', focus: null }
}

const OPPONENT_GENERIC = new Set([
  'RUGBY', 'CLUB', 'RC', 'RFC', 'US', 'AS', 'CA', 'SA', 'SC', 'STADE', 'UNION', 'SPORTIVE',
  'SPORTIF', 'OLYMPIQUE', 'XV', 'ASSOCIATION', 'ATHLETIQUE', 'ATHLÉTIQUE', 'ENTENTE', 'CS', 'ES',
])
const LEADING_ARTICLES = new Set(['DE', 'DU', 'DES', 'LA', 'LE', 'LES', "D'", "L'"])

function titleCaseWord(word: string): string {
  if (word !== word.toUpperCase()) return word
  return word
    .toLowerCase()
    .replace(/(^|[-'’])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
}

/** « Rugby Club Hérouvillais » → « Hérouvillais » ; « RC Caen » → « Caen ». */
export function normalizeOpponentName(raw?: string | null): string | null {
  const cleaned = raw?.replace(/\s+/g, ' ').trim()
  if (!cleaned) return null
  const words = cleaned.split(' ')
  const kept = words.filter((w) => !OPPONENT_GENERIC.has(w.toUpperCase()))
  while (kept.length > 1 && LEADING_ARTICLES.has(kept[0]!.toUpperCase())) kept.shift()
  const result = (kept.length > 0 ? kept : words).map(titleCaseWord).join(' ')
  return result || null
}

/** Prochain match à J-1…J-7 dans une liste d’événements calendrier. */
export function findShareNextMatch(
  events: ReadonlyArray<{
    date: string
    type: string
    opponent?: string | null
    is_home?: boolean | null
    is_neutral?: boolean | null
    user_hidden?: boolean | null
  }>,
  todayIso: string,
): ShareNextMatch | null {
  const today = Date.parse(`${todayIso}T00:00:00Z`)
  if (Number.isNaN(today)) return null
  let best: ShareNextMatch | null = null
  for (const event of events) {
    if (event.type !== 'match' || event.user_hidden) continue
    const day = Date.parse(`${event.date}T00:00:00Z`)
    if (Number.isNaN(day)) continue
    const daysUntil = Math.round((day - today) / 86_400_000)
    if (daysUntil < 1 || daysUntil > 7) continue
    if (best && best.daysUntil <= daysUntil) continue
    best = {
      daysUntil,
      opponent: event.opponent?.trim() || null,
      isHome: event.is_neutral ? null : (event.is_home ?? null),
    }
  }
  return best
}

export function selectShareHero(payload: SessionSharePayload): ShareHero {
  const pr = payload.prs[0]
  if (pr && pr.newBestKg > 0) {
    const previous = pr.previousBestKg > 0 ? pr.previousBestKg : null
    const delta = previous != null ? Math.round((pr.newBestKg - previous) * 10) / 10 : null
    return {
      kind: 'record',
      exerciseName: stripFinalPeriod(pr.exerciseName),
      kg: pr.newBestKg,
      deltaKg: delta != null && delta > 0 ? delta : null,
      previousKg: previous,
      extraRecords: Math.max(0, payload.prs.length - 1),
    }
  }

  const match = payload.nextMatch
  if (match && match.daysUntil >= 1 && match.daysUntil <= 7) {
    return {
      kind: 'match',
      daysUntil: match.daysUntil,
      opponent: normalizeOpponentName(match.opponent),
      venue: match.isHome == null ? null : match.isHome ? 'home' : 'away',
    }
  }

  const progression = payload.progression
  if (progression) {
    if (progression.kind === 'load' && progression.percent >= 5) {
      return { kind: 'progression', progression }
    }
    if (progression.kind === 'streak' && progression.weeks >= 3) {
      return { kind: 'progression', progression }
    }
  }

  const { title, focus } = splitSessionLabel(payload.sessionLabel)
  return {
    kind: 'session',
    title,
    focus,
    durationMin: Math.max(0, Math.round(payload.durationMin)),
  }
}

function formatKg(kg: number): string {
  const rounded = Math.round(kg * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',')
}

export function formatShareLoad(kg: number): string {
  return formatKg(kg)
}

/** 5600 → « 5,6 t soulevées » ; 850 → « 850 kg soulevés ». */
export function formatShareTonnageChip(kg: number | null, lang: Lang): string | null {
  if (kg == null || kg <= 0) return null
  if (kg < 1000) return lang === 'en' ? `${Math.round(kg)} kg lifted` : `${Math.round(kg)} kg soulevés`
  const tonnes = Math.round(kg / 100) / 10
  const t = Number.isInteger(tonnes) ? String(tonnes) : String(tonnes).replace('.', lang === 'en' ? '.' : ',')
  return lang === 'en' ? `${t} t lifted` : `${t} t soulevées`
}

/** Un seul indicateur de régularité. */
export function buildRegularityChip(payload: SessionSharePayload): ShareChip | null {
  const en = payload.lang === 'en'
  const streak = payload.progression?.kind === 'streak' ? payload.progression.weeks : 0
  if (streak >= 2) {
    return { text: en ? `${streak} weeks in a row` : `${streak} sem. d’affilée`, filled: true, posts: true }
  }
  const m = /(\d+)\s*\/\s*(\d+)/.exec(payload.sessionOrdinalLabel ?? '')
  if (!m) return null
  const done = Number(m[1])
  const planned = Number(m[2])
  if (!planned) return null
  if (done >= planned) return { text: en ? `Week ${planned}/${planned}` : `Semaine ${planned}/${planned}` }
  return { text: en ? `Session ${done}/${planned}` : `Séance ${done}/${planned}` }
}

/** Chips secondaires : max 3, jamais la donnée déjà dans le héros. */
export function buildShareChips(payload: SessionSharePayload, hero: ShareHero): ShareChip[] {
  const { focus } = splitSessionLabel(payload.sessionLabel)
  const durationMin = Math.max(0, Math.round(payload.durationMin))
  const candidates: Array<ShareChip | null> = []

  if (hero.kind !== 'session') {
    candidates.push(focus ? { text: focus } : null)
    candidates.push(durationMin > 0 ? { text: `${durationMin} min` } : null)
  }
  const heroIsStreak = hero.kind === 'progression' && hero.progression.kind === 'streak'
  candidates.push(heroIsStreak ? null : buildRegularityChip(payload))
  candidates.push(
    payload.isPremium ? (() => {
      const t = formatShareTonnageChip(payload.tonnageKg, payload.lang)
      return t ? { text: t } : null
    })() : null,
  )
  if (payload.totalSets > 0) {
    candidates.push({ text: `${payload.completedSets}/${payload.totalSets} sets` })
  }
  if (hero.kind === 'record' && hero.extraRecords > 0) {
    candidates.unshift({ text: `+${hero.extraRecords} record${hero.extraRecords > 1 ? 's' : ''}` })
  }
  return candidates.filter((c): c is ShareChip => c !== null).slice(0, MAX_CHIPS)
}

/** Taille du titre (1 ligne) selon sa longueur — l’ellipse CSS reste le dernier recours. */
export function pickTitleSize(text: string, steps: readonly [number, number][], min: number): number {
  for (const [maxChars, size] of steps) {
    if (text.length <= maxChars) return size
  }
  return min
}
