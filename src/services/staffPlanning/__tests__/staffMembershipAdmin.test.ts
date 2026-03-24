import { describe, expect, it } from 'vitest'
import type { StaffMembershipInput } from '../staffMembershipAdmin'
import {
  athleteMembershipLogicalKey,
  normalizeAthleteMembershipInput,
  normalizeStaffMembershipInput,
  parseManageStaffPlanningCliArgs,
  prepareAthleteMembershipUpserts,
  prepareStaffMembershipUpserts,
  staffMembershipLogicalKey,
} from '../staffMembershipAdmin'

describe('normalizeStaffMembershipInput', () => {
  it('rejette clubId vide', () => {
    const r = normalizeStaffMembershipInput(
      { staffUserId: 'u1', clubId: '   ', role: 'admin' },
      0
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/clubId/)
  })

  it('rejette staffUserId vide', () => {
    const r = normalizeStaffMembershipInput(
      { staffUserId: '', clubId: 'CLUB', role: 'admin' },
      0
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/staffUserId/)
  })

  it('rejette un rôle invalide', () => {
    const r = normalizeStaffMembershipInput(
      { staffUserId: 'u1', clubId: 'CLUB', role: 'chef' } as unknown as StaffMembershipInput,
      0
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/role/)
  })

  it('trim clubId et squadId ; squadId vide -> null', () => {
    const r = normalizeStaffMembershipInput(
      { staffUserId: 'u1', clubId: '  ABC  ', squadId: '  ', role: 'physio' },
      0
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.row.club_id).toBe('ABC')
      expect(r.row.squad_id).toBeNull()
    }
  })

  it('status par défaut active', () => {
    const r = normalizeStaffMembershipInput(
      { staffUserId: 'u1', clubId: 'C', role: 'analyst' },
      0
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.row.status).toBe('active')
  })

  it('metadata par défaut {}', () => {
    const r = normalizeStaffMembershipInput(
      { staffUserId: 'u1', clubId: 'C', role: 'analyst' },
      0
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.row.metadata).toEqual({})
  })
})

describe('normalizeAthleteMembershipInput', () => {
  it('rejette athleteUserId vide', () => {
    const r = normalizeAthleteMembershipInput({ athleteUserId: ' ', clubId: 'C' }, 0)
    expect(r.ok).toBe(false)
  })

  it('source par défaut manual', () => {
    const r = normalizeAthleteMembershipInput({ athleteUserId: 'a1', clubId: 'C' }, 0)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.row.source).toBe('manual')
  })
})

describe('prepareStaffMembershipUpserts', () => {
  it('déduplique : dernière occurrence gagne', () => {
    const batch = prepareStaffMembershipUpserts([
      { staffUserId: 'u1', clubId: 'C', squadId: 's1', role: 'physio' },
      { staffUserId: 'u1', clubId: 'C', squadId: 's1', role: 'analyst' },
    ])
    expect(batch.rows).toHaveLength(1)
    expect(batch.rows[0]!.role).toBe('analyst')
    expect(batch.warnings.length).toBeGreaterThanOrEqual(1)
  })

  it('produit des StaffMembershipUpsertRow attendus', () => {
    const batch = prepareStaffMembershipUpserts([
      { staffUserId: 'uuid-1', clubId: 'X', role: 'head_coach', status: 'inactive', metadata: { a: 1 } },
    ])
    expect(batch.errors).toHaveLength(0)
    expect(batch.rows[0]).toEqual({
      staff_user_id: 'uuid-1',
      club_id: 'X',
      squad_id: null,
      role: 'head_coach',
      status: 'inactive',
      metadata: { a: 1 },
    })
  })
})

describe('prepareAthleteMembershipUpserts', () => {
  it('déduplique athlètes', () => {
    const batch = prepareAthleteMembershipUpserts([
      { athleteUserId: 'a1', clubId: 'C', source: 'import' },
      { athleteUserId: 'a1', clubId: 'C', source: 'manual' },
    ])
    expect(batch.rows).toHaveLength(1)
    expect(batch.rows[0]!.source).toBe('manual')
  })
})

describe('logical keys', () => {
  it('staffMembershipLogicalKey stable', () => {
    expect(
      staffMembershipLogicalKey({ staff_user_id: 'a', club_id: 'b', squad_id: null })
    ).toBe(staffMembershipLogicalKey({ staff_user_id: 'a', club_id: 'b', squad_id: null }))
  })

  it('athleteMembershipLogicalKey distingue squad', () => {
    const k1 = athleteMembershipLogicalKey({ athlete_user_id: 'a', club_id: 'b', squad_id: null })
    const k2 = athleteMembershipLogicalKey({ athlete_user_id: 'a', club_id: 'b', squad_id: 's' })
    expect(k1).not.toBe(k2)
  })
})

describe('parseManageStaffPlanningCliArgs', () => {
  it('parse upsert-staff + fichier + dry-run', () => {
    const r = parseManageStaffPlanningCliArgs([
      'node',
      'script.mjs',
      'upsert-staff',
      './tmp/x.json',
      '--dry-run',
    ])
    expect(r.error).toBeNull()
    expect(r.command).toBe('upsert-staff')
    expect(r.filePath).toBe('./tmp/x.json')
    expect(r.dryRun).toBe(true)
  })

  it('erreur si commande inconnue', () => {
    const r = parseManageStaffPlanningCliArgs(['node', 'script.mjs', 'nope', './f.json'])
    expect(r.error).toMatch(/inconnue/)
  })
})
