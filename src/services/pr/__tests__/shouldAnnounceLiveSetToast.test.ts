import { describe, expect, it } from 'vitest'
import { shouldAnnounceLiveSetToast } from '../shouldAnnounceLiveSetToast'

describe('shouldAnnounceLiveSetToast', () => {
  it('autorise le premier toast d’un exo', () => {
    expect(shouldAnnounceLiveSetToast(50, undefined)).toBe(true)
  })

  it('ignore les séries suivantes à la même charge (Pendlay 50 → 50 → 50)', () => {
    expect(shouldAnnounceLiveSetToast(50, 50)).toBe(false)
  })

  it('ignore une charge plus légère après le toast', () => {
    expect(shouldAnnounceLiveSetToast(45, 50)).toBe(false)
  })

  it('re-célèbre si la charge bat encore le record déjà montré', () => {
    expect(shouldAnnounceLiveSetToast(52.5, 50)).toBe(true)
  })
})
