import { supabase } from '../supabase/client'
import type { FfrCompetition } from '../../types/training'
import clubFfrIdsData from '../../data/clubFfrIds.json'
import { mapFfrRencontreToNormalizedMatch, type FfrJourneeShape, type FfrRencontreShape, type NormalizedFfrMatch } from './ffrMatchNormalization'
import { isFfrUpstreamSyncError, requestFfrGraphql } from './requestFfrGraphql'

const clubFfrIds = clubFfrIdsData as Record<string, number>

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

// ─── Public API ───

/** Récupère les compétitions disponibles — GraphQL FFR (navigateur, sinon proxy Edge). */
export async function fetchCompetitions(clubCode: string): Promise<{
  competitions: FfrCompetition[]
  error?: string
}> {
  const ffrId = clubFfrIds[clubCode]
  if (!ffrId) return { competitions: [], error: 'club_not_mapped' }

  try {
    const res = await requestFfrGraphql(QUERY_CLUB_COMPETITIONS, { ffrId })
    if (!res.ok) return { competitions: [], error: `ffr_http_${res.status}` }

    const json = res.json as {
      errors?: Array<{ message: string }>
      data?: {
        Structure?: {
          Competitions?: Array<{
            id: string
            nom: string
            nomCourt: string
            Saison: { nom: string }
            ClasseAge: { code: string }
            Famille?: { nom: string }
          }>
        }
      }
    }
    if (json?.errors?.length) return { competitions: [], error: `ffr_graphql: ${json.errors[0].message}` }

    const structure = json?.data?.Structure
    if (!structure?.Competitions) return { competitions: [], error: 'club_not_found' }

    const currentSeason = getCurrentSeason()
    const competitions: FfrCompetition[] = structure.Competitions
      .filter((c) =>
        c.Saison.nom === currentSeason && !JUNIOR_CLASS_CODES.has(c.ClasseAge.code)
      )
      .map((c) => ({
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

async function invokeSyncCalendar(
  competitionId: string,
  clubCode: string,
  matches?: NormalizedFfrMatch[],
): Promise<{ imported: number; error?: string }> {
  await supabase.auth.refreshSession()
  const { data, error } = await supabase.functions.invoke('ffr-sync', {
    body: { action: 'sync_calendar', competitionId, clubCode, ...(matches ? { matches } : {}) },
  })
  if (error) {
    const msg = error.message || String(error)
    console.error('[ffrSync] invoke error:', error)
    return { imported: 0, error: msg }
  }
  if (!data?.success) return { imported: 0, error: data?.error ?? 'unknown_error' }
  return { imported: data.imported ?? 0 }
}

async function loadMatchesFromFfr(
  competitionId: string,
  clubCode: string,
): Promise<{ matches: NormalizedFfrMatch[]; error?: string }> {
  const compIdNum = Number(competitionId)
  const res = await requestFfrGraphql(QUERY_COMPETITION_CALENDAR, {
    compId: Number.isFinite(compIdNum) ? compIdNum : competitionId,
  })
  if (!res.ok) return { matches: [], error: `ffr_http_${res.status}` }

  const json = res.json as {
    errors?: Array<{ message: string }>
    data?: {
      Competition?: {
        Journees?: Array<FfrJourneeShape & { Rencontres?: FfrRencontreShape[] }>
      }
    }
  }
  if (json?.errors?.length) return { matches: [], error: `ffr_graphql: ${json.errors[0].message}` }

  const competition = json?.data?.Competition
  if (!competition?.Journees) return { matches: [], error: 'competition_not_found' }

  const todayStr = new Date().toISOString().slice(0, 10)
  const allClubMatches: NormalizedFfrMatch[] = []

  for (const journee of competition.Journees) {
    for (const r of journee.Rencontres ?? []) {
      const normalized = mapFfrRencontreToNormalizedMatch(r, journee, clubCode)
      if (normalized) allClubMatches.push(normalized)
    }
  }

  allClubMatches.sort((a, b) => a.match_date.localeCompare(b.match_date))
  const futureMatches = allClubMatches.filter(m => m.match_date >= todayStr)
  const lastPast = allClubMatches.filter(m => m.match_date < todayStr).slice(-1)
  return { matches: [...lastPast, ...futureMatches] }
}

/** Fetch calendrier FFR + écriture DB. L’Edge Function fetch la FFR (TWA/Play) ; fallback navigateur si besoin. */
export async function syncCalendar(competitionId: string, clubCode: string): Promise<{
  imported: number
  error?: string
}> {
  try {
    const serverFirst = await invokeSyncCalendar(competitionId, clubCode)
    if (!serverFirst.error) return serverFirst
    if (!isFfrUpstreamSyncError(serverFirst.error)) return serverFirst

    const loaded = await loadMatchesFromFfr(competitionId, clubCode)
    if (loaded.error) return { imported: 0, error: loaded.error }
    return await invokeSyncCalendar(competitionId, clubCode, loaded.matches)
  } catch (err) {
    console.error('[ffrSync] invoke threw:', err)
    return { imported: 0, error: err instanceof Error ? err.message : 'network_error' }
  }
}
