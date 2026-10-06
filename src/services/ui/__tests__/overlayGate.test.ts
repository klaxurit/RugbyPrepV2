import { describe, expect, it } from 'vitest'
import {
  applyOverlayClaim,
  applyOverlayRelease,
  canClaimOverlay,
  overlayPriority,
} from '../overlayGate'

describe('overlayGate', () => {
  it('priorités : password > cookie > program > founding > gamification', () => {
    expect(overlayPriority('password_upgrade')).toBeGreaterThan(overlayPriority('cookie_consent'))
    expect(overlayPriority('cookie_consent')).toBeGreaterThan(overlayPriority('program_evolution'))
    expect(overlayPriority('program_evolution')).toBeGreaterThan(overlayPriority('return_to_club'))
    expect(overlayPriority('return_to_club')).toBeGreaterThan(overlayPriority('founding_offer'))
    expect(overlayPriority('founding_offer')).toBe(overlayPriority('newsletter'))
    expect(overlayPriority('founding_offer')).toBeGreaterThan(overlayPriority('gamification_intro'))
  })

  it('claim libre → ok', () => {
    expect(canClaimOverlay(null, 'founding_offer')).toBe(true)
    expect(applyOverlayClaim(null, 'founding_offer')).toBe('founding_offer')
  })

  it('même kind → idempotent', () => {
    expect(canClaimOverlay('program_evolution', 'program_evolution')).toBe(true)
    expect(applyOverlayClaim('program_evolution', 'program_evolution')).toBe('program_evolution')
  })

  it('priorité supérieure déloge', () => {
    expect(canClaimOverlay('founding_offer', 'program_evolution')).toBe(true)
    expect(applyOverlayClaim('founding_offer', 'program_evolution')).toBe('program_evolution')
  })

  it('priorité inférieure refusée', () => {
    expect(canClaimOverlay('program_evolution', 'founding_offer')).toBe(false)
    expect(applyOverlayClaim('program_evolution', 'founding_offer')).toBe('program_evolution')
  })

  it('release seulement si détenteur', () => {
    expect(applyOverlayRelease('program_evolution', 'program_evolution')).toBeNull()
    expect(applyOverlayRelease('program_evolution', 'founding_offer')).toBe('program_evolution')
  })
})
