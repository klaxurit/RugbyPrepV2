import type { StaffPlanningAthleteRecord, StaffPlanningRepository } from './staffPlanningRepository'
import {
  SANDBOX_CLUB_ID,
  SANDBOX_ROSTER,
  SANDBOX_SQUAD_ID,
} from './__fixtures__/staffPlanningFixtures'

/**
 * Repository mémoire pour sandbox / démo — roster stable pour `SANDBOX_CLUB_ID`.
 * Les objets conservent à l’exécution `planningAnchors` / `motherSessionResolverOptions` (hors contrat TS) ;
 * le hook les relit via cast pour alimenter `buildSquadWeeklyOverview`.
 */
export class InMemoryStaffPlanningRepository implements StaffPlanningRepository {
  async listAthletesForClub(params: { clubId: string; squadId?: string }): Promise<StaffPlanningAthleteRecord[]> {
    if (params.clubId !== SANDBOX_CLUB_ID) {
      return []
    }
    if (params.squadId !== undefined && params.squadId !== SANDBOX_SQUAD_ID) {
      return []
    }
    return SANDBOX_ROSTER.map((r) => ({ ...r })) as unknown as StaffPlanningAthleteRecord[]
  }
}

/** Instance singleton pour le hook sandbox (remplaçable plus tard par un repo Supabase). */
export const inMemoryStaffPlanningRepository = new InMemoryStaffPlanningRepository()
