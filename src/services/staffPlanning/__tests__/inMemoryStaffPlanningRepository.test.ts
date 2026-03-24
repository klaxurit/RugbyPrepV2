import { describe, expect, it } from 'vitest'
import { InMemoryStaffPlanningRepository } from '../inMemoryStaffPlanningRepository'
import {
  SANDBOX_CLUB_ID,
  SANDBOX_ROSTER,
  SANDBOX_SQUAD_ID,
} from '../__fixtures__/staffPlanningFixtures'

describe('InMemoryStaffPlanningRepository', () => {
  it('retourne un roster stable (ids et ordre) pour le club sandbox', async () => {
    const repo = new InMemoryStaffPlanningRepository()
    const athletes = await repo.listAthletesForClub({
      clubId: SANDBOX_CLUB_ID,
      squadId: SANDBOX_SQUAD_ID,
    })
    expect(athletes.map((a) => a.athleteId)).toEqual(SANDBOX_ROSTER.map((r) => r.athleteId))
    expect(athletes).toHaveLength(6)
  })

  it('accepte squadId omis comme équivalent au groupe sandbox', async () => {
    const repo = new InMemoryStaffPlanningRepository()
    const withSquad = await repo.listAthletesForClub({
      clubId: SANDBOX_CLUB_ID,
      squadId: SANDBOX_SQUAD_ID,
    })
    const noSquad = await repo.listAthletesForClub({ clubId: SANDBOX_CLUB_ID })
    expect(noSquad.map((a) => a.athleteId)).toEqual(withSquad.map((a) => a.athleteId))
  })

  it('retourne une liste vide pour un autre club ou mauvais groupe', async () => {
    const repo = new InMemoryStaffPlanningRepository()
    expect(await repo.listAthletesForClub({ clubId: 'autre-club' })).toEqual([])
    expect(
      await repo.listAthletesForClub({ clubId: SANDBOX_CLUB_ID, squadId: 'intrus' })
    ).toEqual([])
  })
})
