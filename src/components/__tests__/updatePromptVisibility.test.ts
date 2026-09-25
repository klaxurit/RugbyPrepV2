import { describe, expect, it } from 'vitest'
import { shouldShowUpdatePrompt } from '../updatePromptVisibility'

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
})
