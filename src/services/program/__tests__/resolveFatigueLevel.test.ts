import { describe, expect, it } from 'vitest'
import { resolveFatigueLevel } from '../resolveFatigueLevel'

describe('resolveFatigueLevel', () => {
  describe('saison active', () => {
    it('OK + optimal → normal (cas nominal)', () => {
      expect(resolveFatigueLevel('OK', 'optimal')).toBe('normal')
    })

    it('OK + underload → normal', () => {
      expect(resolveFatigueLevel('OK', 'underload')).toBe('normal')
    })

    it('OK + null/undefined → normal (pas assez de data ACWR)', () => {
      expect(resolveFatigueLevel('OK', null)).toBe('normal')
      expect(resolveFatigueLevel('OK', undefined)).toBe('normal')
    })

    it('OK + caution → high (ACWR override la fatigue déclarée)', () => {
      expect(resolveFatigueLevel('OK', 'caution')).toBe('high')
    })

    it('OK + danger → very_high (sécurité prime)', () => {
      expect(resolveFatigueLevel('OK', 'danger')).toBe('very_high')
    })

    it('OK + critical → very_high', () => {
      expect(resolveFatigueLevel('OK', 'critical')).toBe('very_high')
    })

    it('FATIGUE + optimal → high (ressenti utilisateur respecté)', () => {
      expect(resolveFatigueLevel('FATIGUE', 'optimal')).toBe('high')
    })

    it('FATIGUE + underload → high', () => {
      expect(resolveFatigueLevel('FATIGUE', 'underload')).toBe('high')
    })

    it('FATIGUE + caution → high', () => {
      expect(resolveFatigueLevel('FATIGUE', 'caution')).toBe('high')
    })

    it('FATIGUE + danger → very_high (override ACWR sur ressenti)', () => {
      expect(resolveFatigueLevel('FATIGUE', 'danger')).toBe('very_high')
    })

    it('FATIGUE + critical → very_high', () => {
      expect(resolveFatigueLevel('FATIGUE', 'critical')).toBe('very_high')
    })
  })

  describe('seasonEnded — comportement assoupli', () => {
    it('OK → normal', () => {
      expect(resolveFatigueLevel('OK', 'optimal', { seasonEnded: true })).toBe('normal')
      expect(resolveFatigueLevel('OK', 'critical', { seasonEnded: true })).toBe('normal')
    })

    it('FATIGUE → high (jamais very_high même en critical, car pics ACWR transitoires)', () => {
      expect(resolveFatigueLevel('FATIGUE', 'optimal', { seasonEnded: true })).toBe('high')
      expect(resolveFatigueLevel('FATIGUE', 'critical', { seasonEnded: true })).toBe('high')
    })
  })

  it('seasonEnded false équivaut à seasonEnded omis', () => {
    expect(resolveFatigueLevel('FATIGUE', 'critical', { seasonEnded: false })).toBe('very_high')
    expect(resolveFatigueLevel('FATIGUE', 'critical')).toBe('very_high')
  })
})
