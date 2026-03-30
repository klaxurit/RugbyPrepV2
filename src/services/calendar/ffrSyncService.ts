import { supabase } from '../supabase/client'
import type { FfrCompetition } from '../../types/training'
import clubFfrIdsData from '../../data/clubFfrIds.json'

const clubFfrIds = clubFfrIdsData as Record<string, number>

const FFR_GRAPHQL_URL = 'https://api-agregateur.ffr.fr/graphql'

// ─── GraphQL Queries ───

const QUERY_CLUB_COMPETITIONS = `
  query($ffrId: Int!) {
    Structure(id: $ffrId) {
      id code nom
      Competitions {
        id nom identifiant nomCourt
        Saison { nom }
        ClasseAge { code nom Sexe { code nom } }
        Famille { nom }
      }
    }
  }
`

const QUERY_COMPETITION_CALENDAR = `
  query($compId: Int!) {
    Competition(id: $compId) {
      id nom
      Saison { nom }
      Journees {
        id nom numero
        Rencontres {
          id dateOfficielle dateEffective forfait
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

// ─── Helpers ───

function getCurrentSeason(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

const JUNIOR_CLASS_CODES = new Set([
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14',
  'U15', 'U16', 'U17', 'U18', 'U19', 'EDR', 'M6', 'M8', 'M10', 'M12', 'M14',
  '-6', '-7', '-8', '-9', '-10', '-11', '-12', '-13', '-14',
  '-15', '-16', '-17', '-18', '-19',
])

// ─── Types internes ───

interface NormalizedMatch {
  external_id: string
  match_date: string
  kickoff_time?: string
  home_club_code: string
  home_club_name: string
  away_club_code: string
  away_club_name: string
  match_day?: number
  venue?: string
  match_status: string
}

interface FfrEquipe {
  Structure?: { code?: string; nom?: string } | null
  Regroupement?: { code?: string; nom?: string } | null
  nom?: string
}

function getClubCode(equipe: FfrEquipe): string {
  return equipe?.Structure?.code ?? equipe?.Regroupement?.code ?? ''
}
function getClubName(equipe: FfrEquipe): string {
  return equipe?.Structure?.nom ?? equipe?.Regroupement?.nom ?? equipe?.nom ?? ''
}
function equipeMatchesClub(equipe: FfrEquipe, clubCode: string): boolean {
  return equipe?.Structure?.code === clubCode || equipe?.Regroupement?.code === clubCode
}

// ─── Public API ───

/** Récupère les compétitions disponibles — appel direct FFR depuis le navigateur */
export async function fetchCompetitions(clubCode: string): Promise<{
  competitions: FfrCompetition[]
  error?: string
}> {
  const ffrId = clubFfrIds[clubCode]
  if (!ffrId) return { competitions: [], error: 'club_not_mapped' }

  try {
    const res = await fetch(FFR_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY_CLUB_COMPETITIONS, variables: { ffrId } }),
    })
    if (!res.ok) return { competitions: [], error: `ffr_http_${res.status}` }

    const json = await res.json()
    if (json.errors?.length) return { competitions: [], error: `ffr_graphql: ${json.errors[0].message}` }

    const structure = json.data?.Structure
    if (!structure?.Competitions) return { competitions: [], error: 'club_not_found' }

    const currentSeason = getCurrentSeason()
    const competitions: FfrCompetition[] = structure.Competitions
      .filter((c: { Saison: { nom: string }; ClasseAge: { code: string } }) =>
        c.Saison.nom === currentSeason && !JUNIOR_CLASS_CODES.has(c.ClasseAge.code)
      )
      .map((c: { id: string; nom: string; nomCourt: string; Saison: { nom: string }; Famille?: { nom: string } }) => ({
        id: c.id,
        name: c.nom,
        season: c.Saison.nom,
        level: c.nomCourt || c.Famille?.nom,
      }))

    return { competitions }
  } catch (err) {
    return { competitions: [], error: err instanceof Error ? err.message : 'ffr_unavailable' }
  }
}

/** Fetch calendrier FFR + envoi à l'Edge Function pour écriture DB */
export async function syncCalendar(competitionId: string, clubCode: string): Promise<{
  imported: number
  error?: string
}> {
  // 1. Fetch calendar from FFR (client-side, no 403)
  let matches: NormalizedMatch[]
  try {
    const compIdNum = Number(competitionId)
    const res = await fetch(FFR_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: QUERY_COMPETITION_CALENDAR,
        variables: { compId: Number.isFinite(compIdNum) ? compIdNum : competitionId },
      }),
    })
    if (!res.ok) return { imported: 0, error: `ffr_http_${res.status}` }

    const json = await res.json()
    if (json.errors?.length) return { imported: 0, error: `ffr_graphql: ${json.errors[0].message}` }

    const competition = json.data?.Competition
    if (!competition?.Journees) return { imported: 0, error: 'competition_not_found' }

    const todayStr = new Date().toISOString().slice(0, 10)
    const allClubMatches: NormalizedMatch[] = []

    for (const journee of competition.Journees) {
      for (const r of journee.Rencontres) {
        if (!equipeMatchesClub(r.CompetitionEquipeLocale, clubCode) &&
            !equipeMatchesClub(r.CompetitionEquipeVisiteuse, clubCode)) continue

        const dateStr = r.dateEffective || r.dateOfficielle
        const dt = new Date(dateStr)
        const matchDate = dt.toISOString().slice(0, 10)
        const hours = dt.getUTCHours().toString().padStart(2, '0')
        const minutes = dt.getUTCMinutes().toString().padStart(2, '0')
        const kickoff = hours === '00' && minutes === '00' ? undefined : `${hours}:${minutes}`
        const venue = r.Terrain
          ? [r.Terrain.nom, r.Terrain.Adresse?.localite].filter(Boolean).join(', ')
          : undefined

        allClubMatches.push({
          external_id: r.id,
          match_date: matchDate,
          kickoff_time: kickoff,
          home_club_code: getClubCode(r.CompetitionEquipeLocale),
          home_club_name: getClubName(r.CompetitionEquipeLocale),
          away_club_code: getClubCode(r.CompetitionEquipeVisiteuse),
          away_club_name: getClubName(r.CompetitionEquipeVisiteuse),
          match_day: r.Journee?.numero,
          venue,
          match_status: r.Etat?.nom ?? 'unknown',
        })
      }
    }

    // Keep only future matches + the last past match (for ACWR/charge tracking)
    allClubMatches.sort((a, b) => a.match_date.localeCompare(b.match_date))
    const futureMatches = allClubMatches.filter(m => m.match_date >= todayStr)
    const lastPast = allClubMatches.filter(m => m.match_date < todayStr).slice(-1)
    matches = [...lastPast, ...futureMatches]
  } catch (err) {
    return { imported: 0, error: err instanceof Error ? err.message : 'ffr_unavailable' }
  }

  // 2. Send matches to Edge Function for DB sync
  await supabase.auth.refreshSession()
  const { data, error } = await supabase.functions.invoke('ffr-sync', {
    body: { action: 'sync_calendar', competitionId, clubCode, matches },
  })
  if (error) return { imported: 0, error: error.message }
  if (!data?.success) return { imported: 0, error: data?.error ?? 'unknown_error' }
  return { imported: data.imported ?? 0 }
}
