// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { CompleteProfileCards } from '../CompleteProfileCards'
import { renderWithRouter } from '../../../test/ui/renderWithRouter'

const updateProfile = vi.fn()
const dismissClub = vi.fn()
const dismissMorpho = vi.fn()
const dismissGender = vi.fn()

const profileState = {
  clubCode: undefined as string | undefined,
  heightCm: undefined as number | undefined,
  weightKg: undefined as number | undefined,
  populationSegment: 'unknown' as string | undefined,
  preferredLanguage: 'fr' as const,
}

vi.mock('../../../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: profileState,
    updateProfile,
  }),
}))

vi.mock('../../../hooks/useHintVisibility', () => ({
  useHintVisibility: (hintId: string) => {
    if (hintId === 'complete_profile_club') return { visible: true, dismiss: dismissClub, loading: false }
    if (hintId === 'complete_profile_morpho') return { visible: true, dismiss: dismissMorpho, loading: false }
    return { visible: true, dismiss: dismissGender, loading: false }
  },
}))

describe('CompleteProfileCards', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    profileState.clubCode = undefined
    profileState.heightCm = undefined
    profileState.weightKg = undefined
    profileState.populationSegment = 'unknown'
  })

  it('propose le club en premier', () => {
    renderWithRouter(<CompleteProfileCards />)
    expect(screen.getByText('Ajoute ton club')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Choisir mon club' })).toHaveAttribute('href', '/profile#club')
  })

  it('enregistre joueuse et dismiss le hint genre', () => {
    profileState.clubCode = '5143R'
    profileState.heightCm = 170
    profileState.weightKg = 70
    renderWithRouter(<CompleteProfileCards />)

    fireEvent.click(screen.getByRole('button', { name: 'Joueuse' }))
    expect(updateProfile).toHaveBeenCalledWith({
      populationSegment: 'female_senior',
      ageBand: 'adult',
    })
    expect(dismissGender).toHaveBeenCalled()
  })
})
