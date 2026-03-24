// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSquadWeeklyOverview } from '../useSquadWeeklyOverview'
import {
  SANDBOX_CLUB_ID,
  SANDBOX_REFERENCE_DATE,
  SANDBOX_SQUAD_ID,
} from '../../services/staffPlanning/__fixtures__/staffPlanningFixtures'
import type { StaffPlanningRepository } from '../../services/staffPlanning/staffPlanningRepository'

describe('useSquadWeeklyOverview', () => {
  it('succès avec repository mémoire par défaut', async () => {
    const { result } = renderHook(() =>
      useSquadWeeklyOverview({
        clubId: SANDBOX_CLUB_ID,
        squadId: SANDBOX_SQUAD_ID,
        today: SANDBOX_REFERENCE_DATE,
      })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.overview).not.toBeNull()
    expect(result.current.overview!.summary.totalAthletes).toBe(6)
    expect(result.current.overview!.generatedForDate).toBe(SANDBOX_REFERENCE_DATE)
  })

  it('expose une erreur si le repository lève', async () => {
    const failingRepo: StaffPlanningRepository = {
      listAthletesForClub: async () => {
        throw new Error('échec chargement')
      },
    }

    const { result } = renderHook(() =>
      useSquadWeeklyOverview({
        clubId: SANDBOX_CLUB_ID,
        today: SANDBOX_REFERENCE_DATE,
        repository: failingRepo,
      })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('échec chargement')
    expect(result.current.overview).toBeNull()
  })

  it('overview agrégée : plusieurs cycles sur la même semaine', async () => {
    const { result } = renderHook(() =>
      useSquadWeeklyOverview({
        clubId: SANDBOX_CLUB_ID,
        squadId: SANDBOX_SQUAD_ID,
        today: SANDBOX_REFERENCE_DATE,
      })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    const o = result.current.overview!
    const cycles = new Set(o.athletes.map((a) => a.annualPlanning.cycle))
    expect(cycles.size).toBeGreaterThanOrEqual(3)
    expect(o.summary.byCycle.pre_season).toBeGreaterThanOrEqual(1)
    expect(o.summary.byCycle.in_season).toBeGreaterThanOrEqual(1)
    expect(o.summary.byCycle.playoffs).toBeGreaterThanOrEqual(1)
    expect(o.summary.totalAthletes).toBe(6)
  })
})
