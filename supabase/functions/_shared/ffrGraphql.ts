/**
 * GraphQL FFR côté Edge.
 * Keep mapping in sync with src/services/calendar/ffrMatchNormalization.ts
 *
 * L’API FFR a déjà 403 Deno depuis cet environnement : UA navigateur obligatoire.
 */

export const FFR_GRAPHQL_URL = 'https://api-agregateur.ffr.fr/graphql'

const FFR_BROWSER_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

export const QUERY_COMPETITION_CALENDAR = `
  query($compId: Int!) {
    Competition(id: $compId) {
      id nom
      Saison { nom }
      Journees {
        id nom numero
        Rencontres {
          id dateOfficielle dateEffective forfait scoreValide
          RencontreResultatLocale { pointsDeMarque }
          RencontreResultatVisiteuse { pointsDeMarque }
          Etat { nom }
          Journee { id nom numero }
          CompetitionEquipeLocale {
            id nom
            Structure { id code nom }
            Regroupement { id code nom }
          }
          CompetitionEquipeVisiteuse {
            id nom
            Structure { id code nom }
            Regroupement { id code nom }
          }
          Terrain { nom Adresse { localite } }
        }
      }
    }
  }
`

export interface FfrGraphqlResult {
  ok: boolean
  status: number
  json: unknown
}

export async function fetchFfrGraphql(
  query: string,
  variables: Record<string, unknown>,
): Promise<FfrGraphqlResult> {
  const res = await fetch(FFR_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': FFR_BROWSER_UA,
      Origin: 'https://rugbyforge.fr',
      Referer: 'https://rugbyforge.fr/',
    },
    body: JSON.stringify({ query, variables }),
  })
  return {
    ok: res.ok,
    status: res.status,
    json: await res.json().catch(() => null),
  }
}

export function isSafeFfrGraphqlQuery(query: unknown): query is string {
  if (typeof query !== 'string') return false
  if (query.length === 0 || query.length > 20_000) return false
  const lower = query.toLowerCase()
  if (lower.includes('mutation')) return false
  return /\bquery\b/.test(lower)
}

interface FfrEquipeShape {
  Structure?: { code?: string; nom?: string } | null
  Regroupement?: { code?: string; nom?: string } | null
  nom?: string
}

interface FfrRencontreResultatShape {
  pointsDeMarque?: number | null
}

interface FfrRencontreShape {
  id: string
  dateOfficielle?: string
  dateEffective?: string
  scoreValide?: string | null
  RencontreResultatLocale?: FfrRencontreResultatShape | null
  RencontreResultatVisiteuse?: FfrRencontreResultatShape | null
  Etat?: { nom?: string } | null
  Journee?: { id?: string; nom?: string; numero?: number } | null
  CompetitionEquipeLocale: FfrEquipeShape
  CompetitionEquipeVisiteuse: FfrEquipeShape
  Terrain?: { nom?: string; Adresse?: { localite?: string } } | null
}

interface FfrJourneeShape {
  nom?: string
  numero?: number
  Rencontres?: FfrRencontreShape[]
}

export interface NormalizedFfrMatch {
  external_id: string
  match_date: string
  kickoff_time?: string
  home_club_code: string
  home_club_name: string
  away_club_code: string
  away_club_name: string
  match_day?: number
  journee_name?: string
  venue?: string
  match_status: string
  score_locale?: number | null
  score_visiteur?: number | null
  score_valid?: boolean
}

function parseFfrRencontreScores(rencontre: FfrRencontreShape): {
  score_locale: number | null
  score_visiteur: number | null
  score_valid: boolean
} {
  const locale = rencontre.RencontreResultatLocale?.pointsDeMarque
  const visiteur = rencontre.RencontreResultatVisiteuse?.pointsDeMarque
  const scoreLocale = typeof locale === 'number' && Number.isFinite(locale) ? locale : null
  const scoreVisiteur = typeof visiteur === 'number' && Number.isFinite(visiteur) ? visiteur : null
  const validated = (rencontre.scoreValide ?? '').trim().toLowerCase()
  const scoreValid =
    (validated === 'validé' || validated === 'valide') &&
    scoreLocale != null &&
    scoreVisiteur != null
  return {
    score_locale: scoreLocale,
    score_visiteur: scoreVisiteur,
    score_valid: scoreValid,
  }
}

function getClubCode(equipe: FfrEquipeShape): string {
  return equipe?.Structure?.code ?? equipe?.Regroupement?.code ?? ''
}

function getClubName(equipe: FfrEquipeShape): string {
  return equipe?.Structure?.nom ?? equipe?.Regroupement?.nom ?? equipe?.nom ?? ''
}

function equipeMatchesClub(equipe: FfrEquipeShape, clubCode: string): boolean {
  return equipe?.Structure?.code === clubCode || equipe?.Regroupement?.code === clubCode
}

function mapFfrRencontreToNormalizedMatch(
  rencontre: FfrRencontreShape,
  journee: FfrJourneeShape,
  clubCode: string,
): NormalizedFfrMatch | null {
  if (
    !equipeMatchesClub(rencontre.CompetitionEquipeLocale, clubCode) &&
    !equipeMatchesClub(rencontre.CompetitionEquipeVisiteuse, clubCode)
  ) {
    return null
  }

  const dateStr = rencontre.dateEffective || rencontre.dateOfficielle
  if (!dateStr) return null

  const dt = new Date(dateStr)
  const matchDate = dt.toISOString().slice(0, 10)
  const hours = dt.getUTCHours().toString().padStart(2, '0')
  const minutes = dt.getUTCMinutes().toString().padStart(2, '0')
  const kickoff = hours === '00' && minutes === '00' ? undefined : `${hours}:${minutes}`
  const venue = rencontre.Terrain
    ? [rencontre.Terrain.nom, rencontre.Terrain.Adresse?.localite].filter(Boolean).join(', ')
    : undefined

  const journeeName = rencontre.Journee?.nom ?? journee.nom
  const journeeNumero =
    typeof rencontre.Journee?.numero === 'number' && rencontre.Journee.numero > 0
      ? rencontre.Journee.numero
      : typeof journee.numero === 'number' && journee.numero > 0
        ? journee.numero
        : undefined

  const scores = parseFfrRencontreScores(rencontre)

  return {
    external_id: rencontre.id,
    match_date: matchDate,
    kickoff_time: kickoff,
    home_club_code: getClubCode(rencontre.CompetitionEquipeLocale),
    home_club_name: getClubName(rencontre.CompetitionEquipeLocale),
    away_club_code: getClubCode(rencontre.CompetitionEquipeVisiteuse),
    away_club_name: getClubName(rencontre.CompetitionEquipeVisiteuse),
    match_day: journeeNumero,
    journee_name: journeeName?.trim() || undefined,
    venue,
    match_status: rencontre.Etat?.nom?.trim() || 'unknown',
    score_locale: scores.score_locale,
    score_visiteur: scores.score_visiteur,
    score_valid: scores.score_valid,
  }
}

export function extractClubMatchesFromCalendarJson(
  json: unknown,
  clubCode: string,
): { matches?: NormalizedFfrMatch[]; error?: string } {
  const payload = json as {
    errors?: Array<{ message: string }>
    data?: {
      Competition?: {
        Journees?: FfrJourneeShape[]
      }
    }
  }
  if (payload?.errors?.length) return { error: `ffr_graphql: ${payload.errors[0].message}` }

  const competition = payload?.data?.Competition
  if (!competition?.Journees) return { error: 'competition_not_found' }

  const todayStr = new Date().toISOString().slice(0, 10)
  const allClubMatches: NormalizedFfrMatch[] = []

  for (const journee of competition.Journees) {
    for (const r of journee.Rencontres ?? []) {
      const normalized = mapFfrRencontreToNormalizedMatch(r, journee, clubCode)
      if (normalized) allClubMatches.push(normalized)
    }
  }

  allClubMatches.sort((a, b) => a.match_date.localeCompare(b.match_date))
  const futureMatches = allClubMatches.filter((m) => m.match_date >= todayStr)
  const lastPast = allClubMatches.filter((m) => m.match_date < todayStr).slice(-1)
  return { matches: [...lastPast, ...futureMatches] }
}
