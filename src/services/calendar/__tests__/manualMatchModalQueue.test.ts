import { describe, expect, it } from 'vitest'
import {
  resolveProgramEvolutionOpenAfterMatchKind,
  shouldDeferProgramEvolutionForMatchKind,
} from '../manualMatchModalQueue'

describe('manualMatchModalQueue', () => {
  it('diffère l’évolution tant que Type de match est ouvert', () => {
    expect(shouldDeferProgramEvolutionForMatchKind(true)).toBe(true)
    expect(
      resolveProgramEvolutionOpenAfterMatchKind({
        matchKindSheetOpen: true,
        plan: { action: 'open_sheet', matchDateISO: '2026-11-16', dismissSchedulingBanner: true },
      }),
    ).toEqual({ open: false })
  })

  it('ouvre l’évolution seulement après fermeture du kind picker', () => {
    expect(
      resolveProgramEvolutionOpenAfterMatchKind({
        matchKindSheetOpen: false,
        plan: { action: 'open_sheet', matchDateISO: '2026-11-16', dismissSchedulingBanner: true },
      }),
    ).toEqual({ open: true, matchDateISO: '2026-11-16' })
  })

  it('n’ouvre pas si le plan dit none', () => {
    expect(
      resolveProgramEvolutionOpenAfterMatchKind({
        matchKindSheetOpen: false,
        plan: { action: 'none', dismissSchedulingBanner: true },
      }),
    ).toEqual({ open: false })
  })
})
