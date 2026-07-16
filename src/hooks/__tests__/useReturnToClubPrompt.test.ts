import { describe, expect, it } from 'vitest'
import { shouldPromptReturnToClub } from '../../services/season/shouldPromptReturnToClub'
import { buildReturnToClubProfilePatch } from '../../services/season/buildReturnToClubProfilePatch'

describe('buildReturnToClubProfilePatch', () => {
  it('pose returnToTeamTrainingAt et bascule en pré-saison', () => {
    const patch = buildReturnToClubProfilePatch(
      { onboardingCycleHint: 'off_season', seasonEndedAt: '2026-05-30' },
      { returnDate: '2026-08-15' },
    )
    expect(patch.seasonMode).toBe('pre_season')
    expect(patch.planningAnchors?.returnToTeamTrainingAt).toBe('2026-08-15')
    expect(patch.planningAnchors?.seasonEndedAt).toBe('2026-05-30')
  })

  it('ajoute le club seulement si un code FFR est fourni', () => {
    const withClub = buildReturnToClubProfilePatch({}, { returnDate: '2026-08-15', clubCode: 'ABC', clubName: 'RC Test' })
    expect(withClub.clubCode).toBe('ABC')
    expect(withClub.clubName).toBe('RC Test')

    const withoutClub = buildReturnToClubProfilePatch({}, { returnDate: '2026-08-15', clubName: 'RC Test' })
    expect(withoutClub.clubCode).toBeUndefined()
    expect(withoutClub.clubName).toBeUndefined()
  })
})

describe('useReturnToClubPrompt — contrat d’ouverture', () => {
  const eligible = {
    cycle: 'off_season' as const,
    hasReturnDate: false,
    onboardingComplete: true,
    inOnboardingGracePeriod: false,
    hasPendingOffseasonMatch: false,
    pathname: '/home',
  }

  it('ouvre en inter-saison sans date de reprise', () => {
    expect(shouldPromptReturnToClub(eligible)).toBe(true)
  })

  it('ferme après pose de returnToTeamTrainingAt', () => {
    expect(shouldPromptReturnToClub({ ...eligible, hasReturnDate: true })).toBe(false)
  })

  it('reste fermé si une décision UC9 est en attente', () => {
    expect(shouldPromptReturnToClub({ ...eligible, hasPendingOffseasonMatch: true })).toBe(false)
  })

  it('reste fermé pendant la grace period post-onboarding', () => {
    expect(shouldPromptReturnToClub({ ...eligible, inOnboardingGracePeriod: true })).toBe(false)
  })
})
