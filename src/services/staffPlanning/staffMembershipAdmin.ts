/**
 * Préparation / validation pure des memberships staff planning (aucun réseau).
 */

export type StaffMembershipRole =
  | 'head_coach'
  | 'assistant_coach'
  | 'strength_coach'
  | 'physio'
  | 'analyst'
  | 'admin'

export const STAFF_MEMBERSHIP_ROLES: readonly StaffMembershipRole[] = [
  'head_coach',
  'assistant_coach',
  'strength_coach',
  'physio',
  'analyst',
  'admin',
] as const

export interface StaffMembershipInput {
  staffUserId: string
  clubId: string
  squadId?: string
  role: StaffMembershipRole
  status?: 'active' | 'inactive'
  metadata?: Record<string, unknown>
}

export interface AthleteMembershipInput {
  athleteUserId: string
  clubId: string
  squadId?: string
  status?: 'active' | 'inactive'
  source?: 'manual' | 'profile_backfill' | 'import'
  metadata?: Record<string, unknown>
}

export interface StaffMembershipUpsertRow {
  staff_user_id: string
  club_id: string
  squad_id: string | null
  role: StaffMembershipRole
  status: 'active' | 'inactive'
  metadata: Record<string, unknown>
}

export interface AthleteMembershipUpsertRow {
  athlete_user_id: string
  club_id: string
  squad_id: string | null
  status: 'active' | 'inactive'
  source: 'manual' | 'profile_backfill' | 'import'
  metadata: Record<string, unknown>
}

export interface PreparedMembershipBatch<T> {
  rows: T[]
  warnings: string[]
  errors: string[]
}

function trimToUndefined(s: string | undefined): string | undefined {
  if (s === undefined) return undefined
  const t = String(s).trim()
  return t === '' ? undefined : t
}

function isValidStaffRole(r: unknown): r is StaffMembershipRole {
  return typeof r === 'string' && (STAFF_MEMBERSHIP_ROLES as readonly string[]).includes(r)
}

function isValidStatus(s: unknown): s is 'active' | 'inactive' {
  return s === 'active' || s === 'inactive'
}

function isValidSource(s: unknown): s is 'manual' | 'profile_backfill' | 'import' {
  return s === 'manual' || s === 'profile_backfill' || s === 'import'
}

export function staffMembershipLogicalKey(row: {
  staff_user_id: string
  club_id: string
  squad_id: string | null
}): string {
  return `${row.staff_user_id}\0${row.club_id}\0${row.squad_id ?? ''}`
}

export function athleteMembershipLogicalKey(row: {
  athlete_user_id: string
  club_id: string
  squad_id: string | null
}): string {
  return `${row.athlete_user_id}\0${row.club_id}\0${row.squad_id ?? ''}`
}

export function normalizeStaffMembershipInput(
  input: StaffMembershipInput,
  index: number
): { ok: true; row: StaffMembershipUpsertRow } | { ok: false; error: string } {
  const staffUserId = trimToUndefined(input.staffUserId)
  const clubId = trimToUndefined(input.clubId)
  const squadIdRaw = trimToUndefined(input.squadId)
  const squad_id = squadIdRaw === undefined ? null : squadIdRaw

  if (!staffUserId) {
    return { ok: false, error: `Entrée ${index}: staffUserId obligatoire (non vide après trim).` }
  }
  if (!clubId) {
    return { ok: false, error: `Entrée ${index}: clubId obligatoire (non vide après trim).` }
  }
  if (!isValidStaffRole(input.role)) {
    return {
      ok: false,
      error: `Entrée ${index}: role invalide (attendu: ${STAFF_MEMBERSHIP_ROLES.join(', ')}).`,
    }
  }

  let status: 'active' | 'inactive' = 'active'
  if (input.status !== undefined) {
    if (!isValidStatus(input.status)) {
      return { ok: false, error: `Entrée ${index}: status invalide (active | inactive).` }
    }
    status = input.status
  }

  const metadata =
    input.metadata !== undefined && typeof input.metadata === 'object' && input.metadata !== null
      ? { ...input.metadata }
      : {}

  return {
    ok: true,
    row: {
      staff_user_id: staffUserId,
      club_id: clubId,
      squad_id,
      role: input.role,
      status,
      metadata,
    },
  }
}

export function normalizeAthleteMembershipInput(
  input: AthleteMembershipInput,
  index: number
): { ok: true; row: AthleteMembershipUpsertRow } | { ok: false; error: string } {
  const athleteUserId = trimToUndefined(input.athleteUserId)
  const clubId = trimToUndefined(input.clubId)
  const squadIdRaw = trimToUndefined(input.squadId)
  const squad_id = squadIdRaw === undefined ? null : squadIdRaw

  if (!athleteUserId) {
    return { ok: false, error: `Entrée ${index}: athleteUserId obligatoire (non vide après trim).` }
  }
  if (!clubId) {
    return { ok: false, error: `Entrée ${index}: clubId obligatoire (non vide après trim).` }
  }

  let status: 'active' | 'inactive' = 'active'
  if (input.status !== undefined) {
    if (!isValidStatus(input.status)) {
      return { ok: false, error: `Entrée ${index}: status invalide (active | inactive).` }
    }
    status = input.status
  }

  let source: 'manual' | 'profile_backfill' | 'import' = 'manual'
  if (input.source !== undefined) {
    if (!isValidSource(input.source)) {
      return {
        ok: false,
        error: `Entrée ${index}: source invalide (manual | profile_backfill | import).`,
      }
    }
    source = input.source
  }

  const metadata =
    input.metadata !== undefined && typeof input.metadata === 'object' && input.metadata !== null
      ? { ...input.metadata }
      : {}

  return {
    ok: true,
    row: {
      athlete_user_id: athleteUserId,
      club_id: clubId,
      squad_id,
      status,
      source,
      metadata,
    },
  }
}

function dedupeStaffRows(
  rows: StaffMembershipUpsertRow[],
  warnings: string[]
): StaffMembershipUpsertRow[] {
  const map = new Map<string, StaffMembershipUpsertRow>()
  for (const row of rows) {
    const key = staffMembershipLogicalKey(row)
    if (map.has(key)) {
      warnings.push(
        `Doublon staff (staff_user_id + club_id + squad_id) : clé « ${row.staff_user_id} / ${row.club_id} / ${row.squad_id ?? '∅'} » — conservation de la dernière occurrence.`
      )
    }
    map.set(key, row)
  }
  return [...map.values()].sort((a, b) => staffMembershipLogicalKey(a).localeCompare(staffMembershipLogicalKey(b)))
}

function dedupeAthleteRows(
  rows: AthleteMembershipUpsertRow[],
  warnings: string[]
): AthleteMembershipUpsertRow[] {
  const map = new Map<string, AthleteMembershipUpsertRow>()
  for (const row of rows) {
    const key = athleteMembershipLogicalKey(row)
    if (map.has(key)) {
      warnings.push(
        `Doublon athlète (athlete_user_id + club_id + squad_id) : clé « ${row.athlete_user_id} / ${row.club_id} / ${row.squad_id ?? '∅'} » — conservation de la dernière occurrence.`
      )
    }
    map.set(key, row)
  }
  return [...map.values()].sort((a, b) =>
    athleteMembershipLogicalKey(a).localeCompare(athleteMembershipLogicalKey(b))
  )
}

export function prepareStaffMembershipUpserts(
  inputs: StaffMembershipInput[]
): PreparedMembershipBatch<StaffMembershipUpsertRow> {
  const errors: string[] = []
  const normalized: StaffMembershipUpsertRow[] = []

  inputs.forEach((input, index) => {
    const r = normalizeStaffMembershipInput(input, index)
    if (r.ok) normalized.push(r.row)
    else errors.push(r.error)
  })

  const warnings: string[] = []
  const rows = dedupeStaffRows(normalized, warnings)

  return { rows, warnings, errors }
}

export function prepareAthleteMembershipUpserts(
  inputs: AthleteMembershipInput[]
): PreparedMembershipBatch<AthleteMembershipUpsertRow> {
  const errors: string[] = []
  const normalized: AthleteMembershipUpsertRow[] = []

  inputs.forEach((input, index) => {
    const r = normalizeAthleteMembershipInput(input, index)
    if (r.ok) normalized.push(r.row)
    else errors.push(r.error)
  })

  const warnings: string[] = []
  const rows = dedupeAthleteRows(normalized, warnings)

  return { rows, warnings, errors }
}

/** Parse minimal des arguments CLI (testable sans shell). */
export function parseManageStaffPlanningCliArgs(argv: string[]): {
  command: 'upsert-staff' | 'upsert-athletes' | null
  filePath: string | null
  dryRun: boolean
  error: string | null
} {
  const args = argv.slice(2).filter((a) => a !== '')
  const dryRun = args.includes('--dry-run')
  const positional = args.filter((a) => a !== '--dry-run')

  if (positional.length < 2) {
    return {
      command: null,
      filePath: null,
      dryRun,
      error:
        'Usage: node scripts/manageStaffPlanningMemberships.mjs <upsert-staff|upsert-athletes> <fichier.json> [--dry-run]',
    }
  }

  const cmd = positional[0]
  const filePath = positional[1] ?? null

  if (cmd !== 'upsert-staff' && cmd !== 'upsert-athletes') {
    return {
      command: null,
      filePath,
      dryRun,
      error: `Commande inconnue: ${cmd}. Attendu: upsert-staff | upsert-athletes`,
    }
  }

  return { command: cmd, filePath, dryRun, error: null }
}
