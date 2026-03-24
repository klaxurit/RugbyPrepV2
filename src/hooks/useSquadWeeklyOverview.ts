import { useEffect, useState } from 'react'
import type { SquadWeeklyOverview } from '../types/staffPlanning'
import type { AthletePlanningInputs } from '../types/annualPlanning'
import { buildSquadWeeklyOverview } from '../services/staffPlanning/buildSquadWeeklyOverview'
import type {
  StaffPlanningAthleteRecord,
  StaffPlanningRepository,
} from '../services/staffPlanning/staffPlanningRepository'
import { inMemoryStaffPlanningRepository } from '../services/staffPlanning/inMemoryStaffPlanningRepository'
import type { ResolveMotherSessionsForWeekOptions } from '../services/motherSession/resolveMotherSessionsForWeek'

export interface UseSquadWeeklyOverviewParams {
  clubId: string
  squadId?: string
  today: string
  repository?: StaffPlanningRepository
}

export interface UseSquadWeeklyOverviewResult {
  loading: boolean
  error: string | null
  overview: SquadWeeklyOverview | null
}

/** Lignes repo pouvant porter ancres / options resolver (repo mémoire sandbox). */
type StaffAthleteRow = StaffPlanningAthleteRecord & {
  planningAnchors?: AthletePlanningInputs['planningAnchors']
  motherSessionResolverOptions?: ResolveMotherSessionsForWeekOptions
}

function mapRecordsToBuildParams(
  records: StaffPlanningAthleteRecord[],
  clubId: string,
  squadId: string | undefined
) {
  return (records as StaffAthleteRow[]).map((r) => ({
    athleteId: r.athleteId,
    profile: r.profile,
    events: r.events,
    logs: r.logs,
    fatigue: r.fatigue,
    acwrZone: r.acwrZone,
    identity: {
      clubId: r.clubId ?? clubId,
      squadId: r.squadId ?? squadId,
      source: 'staff' as const,
    },
    planningAnchors: r.planningAnchors,
    motherSessionResolverOptions: r.motherSessionResolverOptions,
  }))
}

export function useSquadWeeklyOverview({
  clubId,
  squadId,
  today,
  repository = inMemoryStaffPlanningRepository,
}: UseSquadWeeklyOverviewParams): UseSquadWeeklyOverviewResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<SquadWeeklyOverview | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)
      setOverview(null)
      try {
        const records = await repository.listAthletesForClub({ clubId, squadId })
        if (cancelled) return
        const athletes = mapRecordsToBuildParams(records, clubId, squadId)
        const built = buildSquadWeeklyOverview({
          today,
          clubId,
          squadId,
          athletes,
        })
        if (!cancelled) setOverview(built)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
          setOverview(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clubId, squadId, today, repository])

  return { loading, error, overview }
}
