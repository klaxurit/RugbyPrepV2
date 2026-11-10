/**
 * Identité joueur / club / niveau pour la carte de partage post-séance.
 *
 * Fonction pure : aucune valeur par défaut inventée. Chaque champ absent du
 * profil reste `null` et disparaît de la carte (séparateurs compris).
 */
import { getClubLogoUrl } from '../ui/clubLogos'

/** Source réelle du logo sur l’image finale (PostHog `logo_source`). */
export type ShareLogoSource = 'ffr' | 'fallback' | 'none'

export interface ShareCardIdentityInput {
  firstName?: string | null
  positionLabel?: string | null
  /** Nom du club tel que stocké sur le profil (souvent en capitales FFR). */
  clubName?: string | null
  /** Nom court si on en dispose un jour (prioritaire sur clubName). */
  clubShortName?: string | null
  /** Code FFR du club (clé des datasets logo). */
  clubCode?: string | null
  /** Compétition choisie à la synchro FFR (ex. « Régionale 2 - Poule 3 »). */
  competitionName?: string | null
  /** Toggle « Afficher mon club » de la feuille de partage. */
  showClub?: boolean
}

export interface ShareCardClub {
  name: string
  /** Initiales 2 à 4 lettres pour l’écusson de secours (ex. « DUC »). */
  shortCode: string | null
  /** URL issue des données club déjà stockées — jamais générée. */
  logoUrl: string | null
}

export interface ShareCardCompetition {
  label: string
  short: string
}

export interface ShareCardData {
  firstName: string | null
  positionLabel: string | null
  club: ShareCardClub | null
  competition: ShareCardCompetition | null
  /** true si au moins le nom du club est affiché. */
  clubShown: boolean
}

export interface ShareCardDataDeps {
  resolveClubLogoUrl?: (clubCode?: string) => string | null
}

const STOP_WORDS = new Set(['DE', 'DU', 'DES', 'LA', 'LE', 'LES', 'ET', 'D', 'L', 'AU', 'AUX', 'EN'])

/** Sigles fréquents dans les noms de clubs FFR, gardés en capitales. */
const KEEP_UPPER = new Set([
  'AC', 'AS', 'ASM', 'CA', 'CO', 'CS', 'ES', 'FC', 'JO', 'OC', 'RC', 'RCT', 'RFC',
  'SA', 'SC', 'SCO', 'SO', 'SU', 'UA', 'UC', 'US', 'USO', 'XIII', 'XV',
])

function clean(text?: string | null): string | null {
  const t = text?.replace(/\s+/g, ' ').trim()
  return t ? t : null
}

/** « DIEPPE UNIVERSITAIRE CLUB » → « Dieppe Universitaire Club ». Casse mixte conservée. */
export function formatClubDisplayName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim()
  if (name !== name.toUpperCase()) return name
  return name
    .split(' ')
    .map((word, index) => {
      if (KEEP_UPPER.has(word)) return word
      const lower = word.toLowerCase()
      if (index > 0 && STOP_WORDS.has(word)) return lower
      return lower.replace(/(^|[-'’])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
    })
    .join(' ')
}

/** Initiales 2 à 4 lettres : « Dieppe Universitaire Club » → « DUC ». */
export function computeClubInitials(name?: string | null): string | null {
  const cleaned = clean(name)
  if (!cleaned) return null
  const tokens = cleaned
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .split(/[\s\-'’.]+/)
    .filter((t) => /[A-Z0-9]/.test(t) && !STOP_WORDS.has(t))
  if (tokens.length === 0) return null
  if (tokens.length === 1) {
    const only = tokens[0]!.replace(/[^A-Z0-9]/g, '')
    return only.length >= 2 ? only.slice(0, 3) : null
  }
  const initials = tokens
    .map((t) => t.replace(/[^A-Z0-9]/g, '')[0] ?? '')
    .join('')
    .slice(0, 4)
  return initials.length >= 2 ? initials : null
}

const DIVISION_PATTERNS: ReadonlyArray<{ re: RegExp; label: (n: string) => string; short: (n: string) => string }> = [
  { re: /f[ée]d[ée]rale\s*([1-3])\b/i, label: (n) => `Fédérale ${n}`, short: (n) => `F${n}` },
  { re: /r[ée]gionale\s*([1-3])\b/i, label: (n) => `Régionale ${n}`, short: (n) => `R${n}` },
  { re: /nationale\s*(2)\b/i, label: (n) => `Nationale ${n}`, short: (n) => `N${n}` },
]

/**
 * « Régionale 2 - Poule 3 » → { label: « Régionale 2 », short: « R2 » }.
 * Division non reconnue → label complet, short = label (fallback).
 */
export function mapCompetition(name?: string | null): ShareCardCompetition | null {
  const raw = clean(name)
  if (!raw) return null
  for (const pattern of DIVISION_PATTERNS) {
    const m = pattern.re.exec(raw)
    if (m) return { label: pattern.label(m[1]!), short: pattern.short(m[1]!) }
  }
  if (/^nationale\b/i.test(raw)) return { label: 'Nationale', short: 'Nationale' }
  return { label: raw, short: raw }
}

export function buildShareCardData(
  input: ShareCardIdentityInput,
  deps: ShareCardDataDeps = {},
): ShareCardData {
  const resolveLogo = deps.resolveClubLogoUrl ?? getClubLogoUrl
  const showClub = input.showClub !== false
  const firstName = clean(input.firstName)
  const positionLabel = clean(input.positionLabel)

  const rawClub = clean(input.clubShortName) ?? clean(input.clubName)
  const club: ShareCardClub | null =
    showClub && rawClub
      ? {
          name: formatClubDisplayName(rawClub),
          shortCode: computeClubInitials(rawClub),
          logoUrl: clean(resolveLogo(clean(input.clubCode) ?? undefined)),
        }
      : null

  const competition = showClub && club ? mapCompetition(input.competitionName) : null

  return {
    firstName,
    positionLabel,
    club,
    competition,
    clubShown: club !== null,
  }
}

/** Segment du pied « Prénom · [écusson] Club · R2 ». */
export type ShareFooterSegment =
  | { kind: 'name'; text: string }
  | { kind: 'club'; text: string; withCrest: boolean }
  | { kind: 'level'; text: string }

export const SHARE_FOOTER_SEPARATOR = ' · '

/**
 * Budget en caractères du groupe gauche du pied, à la taille de rendu.
 * Au-delà : niveau abrégé, puis ellipse CSS sur le nom du club (jamais 2 lignes).
 */
export const SHARE_FOOTER_CHAR_BUDGET = 38

export function buildShareFooterSegments(
  data: ShareCardData,
  options: { charBudget?: number } = {},
): ShareFooterSegment[] {
  const budget = options.charBudget ?? SHARE_FOOTER_CHAR_BUDGET
  const segments: ShareFooterSegment[] = []
  if (data.firstName) segments.push({ kind: 'name', text: data.firstName })
  if (data.club) {
    segments.push({
      kind: 'club',
      text: data.club.name,
      withCrest: Boolean(data.club.logoUrl || data.club.shortCode),
    })
  }
  if (data.competition) {
    const full = data.competition.label
    const fullLength = segments.reduce((n, s) => n + s.text.length, 0) +
      full.length +
      SHARE_FOOTER_SEPARATOR.length * segments.length
    segments.push({ kind: 'level', text: fullLength > budget ? data.competition.short : full })
  }
  return segments
}

/** Texte brut du pied (tests, accessibilité) — jamais de « · · ». */
export function formatShareFooterText(segments: readonly ShareFooterSegment[]): string {
  return segments.map((s) => s.text).join(SHARE_FOOTER_SEPARATOR)
}
