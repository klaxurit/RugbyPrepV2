// @vitest-environment jsdom

import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import * as useSquadWeeklyOverviewModule from '../../hooks/useSquadWeeklyOverview'
import type { SquadWeeklyOverview } from '../../types/staffPlanning'
import {
  SANDBOX_CLUB_ID,
  SANDBOX_REFERENCE_DATE,
  SANDBOX_SQUAD_ID,
} from '../../services/staffPlanning/__fixtures__/staffPlanningFixtures'
import { StaffPlanningSandboxPage } from '../StaffPlanningSandboxPage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'

const emptyOverview: SquadWeeklyOverview = {
  generatedForDate: SANDBOX_REFERENCE_DATE,
  clubId: SANDBOX_CLUB_ID,
  squadId: SANDBOX_SQUAD_ID,
  athletes: [],
  summary: {
    totalAthletes: 0,
    byCycle: { off_season: 0, pre_season: 0, in_season: 0, playoffs: 0 },
    matchWeekCount: 0,
    highFatigueCount: 0,
    veryHighFatigueCount: 0,
    lowAdherenceCount: 0,
    missingSessionDataCount: 0,
  },
  warnings: [],
}

describe('StaffPlanningSandboxPage (intégration légère)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('sans query param : memory par défaut, résumé et joueurs mémoire', async () => {
    renderWithRouter(<StaffPlanningSandboxPage />, { initialEntries: ['/staff-sandbox'] })

    expect(
      await screen.findByRole('heading', { name: /Staff Planning Sandbox/i })
    ).toBeInTheDocument()

    expect(screen.getByTestId('sandbox-source-memory')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('sandbox-source-active-label')).toHaveTextContent(/Repository mémoire/)

    await waitFor(() => {
      expect(screen.getByTestId('squad-summary-card')).toBeInTheDocument()
    })

    expect(screen.getByText(/6 athlètes/)).toBeInTheDocument()

    const rosterRows = await screen.findAllByTestId('staff-roster-row')
    expect(rosterRows.length).toBe(6)

    expect(document.querySelector('[data-severity="critical"]')).not.toBeNull()
    expect(document.querySelector('[data-severity="warning"]')).not.toBeNull()

    const weekBadges = screen.getAllByText(/Hors-saison ·|Pré-saison ·|En saison ·|Playoffs ·/)
    expect(weekBadges.length).toBeGreaterThan(0)
  })

  it('avec ?source=supabase : onglet et libellé actif Supabase', () => {
    renderWithRouter(<StaffPlanningSandboxPage />, {
      initialEntries: [{ pathname: '/staff-sandbox', search: '?source=supabase' }],
    })

    expect(screen.getByTestId('sandbox-source-supabase')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('sandbox-source-active-label')).toHaveTextContent(/Repository Supabase/)
  })
})

describe('StaffPlanningSandboxPage — empty state Supabase (hook mocké)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.spyOn(useSquadWeeklyOverviewModule, 'useSquadWeeklyOverview').mockReturnValue({
      loading: false,
      error: null,
      overview: emptyOverview,
    })
  })

  it('affiche l’empty state quand Supabase renvoie 0 athlète', () => {
    renderWithRouter(<StaffPlanningSandboxPage />, {
      initialEntries: [{ pathname: '/staff-sandbox', search: '?source=supabase' }],
    })

    expect(screen.getByTestId('sandbox-supabase-empty')).toBeInTheDocument()
    expect(
      screen.getByText(/Aucun athlète visible pour ce club\/groupe/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/club_staff_memberships/i)).toBeInTheDocument()
  })

  it('n’affiche pas l’empty state si une erreur repository est présente', () => {
    vi.mocked(useSquadWeeklyOverviewModule.useSquadWeeklyOverview).mockReturnValue({
      loading: false,
      error: 'Échec RLS',
      overview: emptyOverview,
    })

    renderWithRouter(<StaffPlanningSandboxPage />, {
      initialEntries: [{ pathname: '/staff-sandbox', search: '?source=supabase' }],
    })

    expect(screen.queryByTestId('sandbox-supabase-empty')).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent('Échec RLS')
  })
})
