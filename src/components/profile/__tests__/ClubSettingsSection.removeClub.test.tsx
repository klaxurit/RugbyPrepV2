// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { ClubSettingsSection } from '../ClubSettingsSection'
import { renderWithRouter } from '../../../test/ui/renderWithRouter'
import type { UserProfile } from '../../../types/training'

const updateProfile = vi.fn()
const clearFfrImportedEvents = vi.fn()
const refreshFromFFR = vi.fn()

vi.mock('../../../hooks/useCalendar', () => ({
  useCalendar: () => ({
    refreshFromFFR,
    clearFfrImportedEvents,
  }),
}))

vi.mock('../../../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {},
    updateProfile,
  }),
}))

vi.mock('../../../services/club/syncClubMembership', () => ({
  syncMyClubMembership: vi.fn(),
}))

vi.mock('../../../services/calendar/ffrSyncService', () => ({
  fetchCompetitions: vi.fn().mockResolvedValue({ competitions: [] }),
}))

const clubProfile = {
  clubCode: '4207Y',
  clubName: 'Stade Toulousain',
  weeklySessions: 3,
  seasonMode: 'in_season',
  ffrCompetitionId: '99',
  ffrCompetitionName: 'Fédérale 1',
} as UserProfile

describe('ClubSettingsSection · retirer le club', () => {
  beforeEach(() => {
    updateProfile.mockReset()
    clearFfrImportedEvents.mockReset()
    refreshFromFFR.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('vide le calendrier FFR quand on retire le club', () => {
    renderWithRouter(
      <ClubSettingsSection profile={clubProfile} updateProfile={updateProfile} />,
      { initialEntries: ['/profile'] },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }))

    expect(clearFfrImportedEvents).toHaveBeenCalledTimes(1)
    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        clubCode: undefined,
        ffrCompetitionId: undefined,
      }),
    )
  })
})
