import { describe, expect, it } from 'vitest'
import { shouldShowAuthenticatedBottomNav } from '../bottomNavVisibility'

describe('shouldShowAuthenticatedBottomNav', () => {
  it('reste visible sur les écrans principaux', () => {
    expect(shouldShowAuthenticatedBottomNav('/home')).toBe(true)
    expect(shouldShowAuthenticatedBottomNav('/week')).toBe(true)
    expect(shouldShowAuthenticatedBottomNav('/squad')).toBe(true)
    expect(shouldShowAuthenticatedBottomNav('/profile')).toBe(true)
  })

  it('se masque sur la séance live (CTA sticky)', () => {
    expect(shouldShowAuthenticatedBottomNav('/session/0')).toBe(false)
    expect(shouldShowAuthenticatedBottomNav('/session/12')).toBe(false)
  })

  it('reste visible sur la revue de log', () => {
    expect(shouldShowAuthenticatedBottomNav('/session/log/abc-123')).toBe(true)
  })
})
