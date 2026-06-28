import { describe, expect, it } from 'vitest'
import {
  createSupabaseStaffPlanningRepository,
  deriveFatigueFromSessionLogRows,
  STAFF_PLANNING_PROFILE_SELECT,
} from '../supabaseStaffPlanningRepository'
import type { ProfileRow, MatchCalendarRow, SessionLogRow } from '../staffPlanningSupabaseMappers'

type MockStep = { table: string; data: unknown; error?: { message: string } | null }

function makeThenableBuilder(payload: { data: unknown; error: { message: string } | null }) {
  const b: {
    select: () => typeof b
    eq: () => typeof b
    order: () => typeof b
    in: () => typeof b
    then: (
      onFulfilled?: (v: unknown) => unknown,
      onRejected?: (e: unknown) => unknown
    ) => Promise<unknown>
  } = {
    select() {
      return b
    },
    eq() {
      return b
    },
    order() {
      return b
    },
    in() {
      return b
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(payload).then(onFulfilled, onRejected)
    },
  }
  return b
}

function createMockSupabase(steps: MockStep[]) {
  let i = 0
  return {
    from(table: string) {
      const step = steps[i++]
      if (!step || step.table !== table) {
        throw new Error(`Unexpected from("${table}") at step ${i}, expected ${step?.table ?? 'none'}`)
      }
      return makeThenableBuilder({ data: step.data, error: step.error ?? null })
    },
  }
}

function baseProfile(id: string, clubId: string): ProfileRow {
  return {
    id,
    level: 'intermediate',
    weekly_sessions: 3,
    equipment: [],
    injuries: [],
    position: null,
    rugby_position: null,
    league_level: null,
    club_code: clubId,
    club_name: null,
    club_ligue: null,
    club_department_code: null,
    height_cm: null,
    weight_kg: null,
    club_schedule: null,
    sc_schedule: null,
    training_level: 'builder',
    level_modifier_profile: null,
    season_mode: 'in_season',
    performance_focus: 'balanced',
    display_name: null,
    avatar_url: null,
    avatar_path: null,
    planning_anchors: null,
    population_segment: null,
    age_band: 'adult',
    parental_consent_health_data: null,
    adult_play_eligibility_approved: null,
    maturity_status: 'unknown',
    cycle_tracking_opt_in: null,
    cycle_symptom_score_today: null,
    prevention_sessions_week: null,
    weekly_load_context: null,
    health_consent_status: 'not_required',
    health_consent_granted_at: null,
    health_consent_revoked_at: null,
    health_consent_source: null,
    health_consent_audit_trail: [],
    health_data_retention_state: 'active',
  }
}

describe('deriveFatigueFromSessionLogRows', () => {
  it('OK sans logs', () => {
    expect(deriveFatigueFromSessionLogRows([])).toBe('OK')
  })
  it('prend la fatigue du log le plus récent (date_iso)', () => {
    const rows: SessionLogRow[] = [
      {
        id: 'a',
        user_id: 'u1',
        date_iso: '2025-03-01',
        week: 'W1',
        session_type: 'UPPER',
        fatigue: 'FATIGUE',
        created_at: '2025-03-01T10:00:00Z',
      },
      {
        id: 'b',
        user_id: 'u1',
        date_iso: '2025-03-10',
        week: 'W2',
        session_type: 'LOWER',
        fatigue: 'OK',
        created_at: '2025-03-10T10:00:00Z',
      },
    ]
    expect(deriveFatigueFromSessionLogRows(rows)).toBe('OK')
  })
  it('à date égale, trie par created_at puis id', () => {
    const rows: SessionLogRow[] = [
      {
        id: 'z',
        user_id: 'u1',
        date_iso: '2025-03-10',
        week: 'W2',
        session_type: 'LOWER',
        fatigue: 'OK',
        created_at: '2025-03-10T08:00:00Z',
      },
      {
        id: 'a',
        user_id: 'u1',
        date_iso: '2025-03-10',
        week: 'W2',
        session_type: 'UPPER',
        fatigue: 'FATIGUE',
        created_at: '2025-03-10T12:00:00Z',
      },
    ]
    expect(deriveFatigueFromSessionLogRows(rows)).toBe('FATIGUE')
  })
})

describe('createSupabaseStaffPlanningRepository', () => {
  it('retourne [] si aucun athlète', async () => {
    const client = createMockSupabase([
      { table: 'club_athlete_memberships', data: [] },
    ])
    const repo = createSupabaseStaffPlanningRepository(client as never)
    await expect(repo.listAthletesForClub({ clubId: 'X' })).resolves.toEqual([])
  })

  it('agrège plusieurs athlètes, ordre stable par membership', async () => {
    const memberships = [
      { athlete_user_id: 'b-user', club_id: 'C1', squad_id: null },
      { athlete_user_id: 'a-user', club_id: 'C1', squad_id: null },
    ]
    const profiles = [baseProfile('a-user', 'C1'), baseProfile('b-user', 'C1')]
    const calendars: MatchCalendarRow[] = [
      {
        id: 'm1',
        user_id: 'a-user',
        date: '2025-03-01',
        type: 'match',
      },
    ]
    const logs: SessionLogRow[] = []

    const client = createMockSupabase([
      { table: 'club_athlete_memberships', data: memberships },
      { table: 'profiles', data: profiles },
      { table: 'match_calendar', data: calendars },
      { table: 'session_logs', data: logs },
    ])

    const repo = createSupabaseStaffPlanningRepository(client as never)
    const rows = await repo.listAthletesForClub({ clubId: 'C1' })

    expect(rows.map((r) => r.athleteId)).toEqual(['b-user', 'a-user'])
    expect(rows[0]!.athleteId).toBe('b-user')
    expect(rows[0]!.events).toHaveLength(0)
    expect(rows[1]!.events).toHaveLength(1)
    expect(rows.every((r) => r.acwrZone === null)).toBe(true)
  })

  it('passe squadId à la requête membership et mappe squadId sur le record', async () => {
    const memberships = [{ athlete_user_id: 'u1', club_id: 'C1', squad_id: 'S1' }]
    const client = createMockSupabase([
      { table: 'club_athlete_memberships', data: memberships },
      { table: 'profiles', data: [baseProfile('u1', 'C1')] },
      { table: 'match_calendar', data: [] },
      { table: 'session_logs', data: [] },
    ])
    const repo = createSupabaseStaffPlanningRepository(client as never)
    const rows = await repo.listAthletesForClub({ clubId: 'C1', squadId: 'S1' })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.squadId).toBe('S1')
    expect(rows[0]!.clubId).toBe('C1')
  })

  it('ignore membership sans profil sans planter', async () => {
    const memberships = [
      { athlete_user_id: 'ghost', club_id: 'C1', squad_id: null },
      { athlete_user_id: 'real', club_id: 'C1', squad_id: null },
    ]
    const client = createMockSupabase([
      { table: 'club_athlete_memberships', data: memberships },
      { table: 'profiles', data: [baseProfile('real', 'C1')] },
      { table: 'match_calendar', data: [] },
      { table: 'session_logs', data: [] },
    ])
    const repo = createSupabaseStaffPlanningRepository(client as never)
    const rows = await repo.listAthletesForClub({ clubId: 'C1' })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.athleteId).toBe('real')
  })

  it('logs et events vides restent valides', async () => {
    const memberships = [{ athlete_user_id: 'u1', club_id: 'C1', squad_id: null }]
    const client = createMockSupabase([
      { table: 'club_athlete_memberships', data: memberships },
      { table: 'profiles', data: [baseProfile('u1', 'C1')] },
      { table: 'match_calendar', data: [] },
      { table: 'session_logs', data: [] },
    ])
    const repo = createSupabaseStaffPlanningRepository(client as never)
    const rows = await repo.listAthletesForClub({ clubId: 'C1' })
    expect(rows[0]!.events).toEqual([])
    expect(rows[0]!.logs).toEqual([])
    expect(rows[0]!.fatigue).toBe('OK')
  })

  it('propage erreur Supabase', async () => {
    const client = createMockSupabase([
      { table: 'club_athlete_memberships', data: null, error: { message: 'rls' } },
    ])
    const repo = createSupabaseStaffPlanningRepository(client as never)
    await expect(repo.listAthletesForClub({ clubId: 'C1' })).rejects.toThrow('rls')
  })
})

describe('STAFF_PLANNING_PROFILE_SELECT', () => {
  it('inclut id pour jointure profil', () => {
    expect(STAFF_PLANNING_PROFILE_SELECT).toMatch(/^id,/)
  })
})
