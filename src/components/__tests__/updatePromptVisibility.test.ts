import { describe, expect, it } from 'vitest'
import {
  shouldShowUpdatePrompt,
  UPDATE_PROMPT_COOLDOWN_MS,
} from '../updatePromptVisibility'

describe('shouldShowUpdatePrompt', () => {
  it('affiche uniquement si MAJ dispo et utilisateur authentifié', () => {
    expect(shouldShowUpdatePrompt(true, 'authenticated')).toBe(true)
  })

  it('masque sur la landing (anonymous) même si MAJ dispo', () => {
    expect(shouldShowUpdatePrompt(true, 'anonymous')).toBe(false)
  })

  it('masque pendant le boot auth (loading) même si MAJ dispo', () => {
    expect(shouldShowUpdatePrompt(true, 'loading')).toBe(false)
  })

  it('masque s’il n’y a pas de MAJ', () => {
    expect(shouldShowUpdatePrompt(false, 'authenticated')).toBe(false)
  })

  it('masque quand une sheet programme est ouverte', () => {
    expect(
      shouldShowUpdatePrompt(true, 'authenticated', { suppressForProgramSheet: true }),
    ).toBe(false)
  })

  it('respecte le cooldown 24 h après un affichage', () => {
    const now = 1_700_000_000_000
    expect(
      shouldShowUpdatePrompt(true, 'authenticated', {
        lastPresentedAt: now - UPDATE_PROMPT_COOLDOWN_MS + 1_000,
        now,
      }),
    ).toBe(false)
    expect(
      shouldShowUpdatePrompt(true, 'authenticated', {
        lastPresentedAt: now - UPDATE_PROMPT_COOLDOWN_MS - 1,
        now,
      }),
    ).toBe(true)
  })
})
