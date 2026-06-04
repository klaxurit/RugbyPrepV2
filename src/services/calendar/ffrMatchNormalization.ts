/**
 * Pure mapping from FFR GraphQL rencontre payload → normalized sync row.
 */

export interface FfrEquipeShape {
  Structure?: { code?: string; nom?: string } | null
  Regroupement?: { code?: string; nom?: string } | null
  nom?: string
}

export interface FfrRencontreShape {
  id: string
  dateOfficielle?: string
  dateEffective?: string
  Etat?: { nom?: string } | null
  Journee?: { id?: string; nom?: string; numero?: number } | null
  CompetitionEquipeLocale: FfrEquipeShape
  CompetitionEquipeVisiteuse: FfrEquipeShape
  Terrain?: { nom?: string; Adresse?: { localite?: string } } | null
}

export interface FfrJourneeShape {
  nom?: string
  numero?: number
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
}

function getClubCode(equipe: FfrEquipeShape): string {
  return equipe?.Structure?.code ?? equipe?.Regroupement?.code ?? ''
}

function getClubName(equipe: FfrEquipeShape): string {
  return equipe?.Structure?.nom ?? equipe?.Regroupement?.nom ?? equipe?.nom ?? ''
}

export function equipeMatchesClub(equipe: FfrEquipeShape, clubCode: string): boolean {
  return equipe?.Structure?.code === clubCode || equipe?.Regroupement?.code === clubCode
}

export function mapFfrRencontreToNormalizedMatch(
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
  }
}
