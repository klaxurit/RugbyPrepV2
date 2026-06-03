import { describe, expect, it } from 'vitest'
import { resolveSafeReloadTarget } from '../updatePromptReload'

describe('resolveSafeReloadTarget', () => {
  it('garde la route SPA courante', () => {
    expect(
      resolveSafeReloadTarget({ pathname: '/home', search: '', hash: '' }),
    ).toBe('/home')
  })

  it('redirige / vers /home', () => {
    expect(
      resolveSafeReloadTarget({ pathname: '/', search: '?x=1', hash: '#y' }),
    ).toBe('/home?x=1#y')
  })

  it('retombe sur /home pour une URL hors SPA', () => {
    expect(
      resolveSafeReloadTarget({ pathname: '/unknown-page', search: '', hash: '' }),
    ).toBe('/home')
  })
})
