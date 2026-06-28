import type { StaffMembershipRole } from '../services/staffPlanning/staffMembershipAdmin'

const STAFF_ROLE_LABELS: Record<StaffMembershipRole, string> = {
  head_coach: 'Head coach',
  assistant_coach: 'Coach adjoint',
  strength_coach: 'Préparateur physique',
  physio: 'Kinésithérapeute',
  analyst: 'Analyste',
  admin: 'Admin club',
}

export function formatStaffRoleLabel(role: string): string {
  return STAFF_ROLE_LABELS[role as StaffMembershipRole] ?? role.replace(/_/g, ' ')
}

/** Affiche le nom du club quand on le connaît, sinon le code FFR. */
export function formatClubLabel(
  clubId: string,
  profileClub?: { club_code?: string | null; club_name?: string | null },
): string {
  const code = profileClub?.club_code?.trim()
  const name = profileClub?.club_name?.trim()
  if (name && code && clubId.trim() === code) return name
  if (name && !code && clubId.trim() === name) return name
  return clubId.trim() || '—'
}

const SEASON_MODE_LABELS: Record<string, string> = {
  off_season: 'Inter-saison',
  pre_season: 'Pré-saison',
  in_season: 'En saison',
  playoffs: 'Playoffs',
}

export function formatSeasonModeLabel(mode: string | null | undefined): string {
  if (!mode) return '—'
  return SEASON_MODE_LABELS[mode] ?? mode
}
