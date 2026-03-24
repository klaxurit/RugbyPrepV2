import { describe, expect, it } from 'vitest'
import { formatTitleFromMotherSessionId } from '../formatMotherSessionTitle'

describe('formatTitleFromMotherSessionId', () => {
  describe('FR', () => {
    it('LOWER_PRESEASON_FORCE_V1 → Bas du corps · Force', () => {
      expect(formatTitleFromMotherSessionId('LOWER_PRESEASON_FORCE_V1', 'fr'))
        .toBe('Bas du corps · Force')
    })

    it('UPPER_IN_SEASON_BACK_THREE_V1 → Haut du corps', () => {
      const result = formatTitleFromMotherSessionId('UPPER_IN_SEASON_BACK_THREE_V1', 'fr')
      expect(result).toContain('Haut du corps')
      expect(result).not.toContain('_V1')
    })

    it('override: FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1 → Préparation légère · Avants', () => {
      expect(formatTitleFromMotherSessionId('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1', 'fr'))
        .toBe('Préparation légère · Avants')
    })

    it('override: FULL_BODY_IN_SEASON_BACK_THREE_V1 → Corps complet · Ligne arrière', () => {
      expect(formatTitleFromMotherSessionId('FULL_BODY_IN_SEASON_BACK_THREE_V1', 'fr'))
        .toBe('Corps complet · Ligne arrière')
    })

    it('LOWER_IN_SEASON_FRONT_ROW_V1 → Bas du corps', () => {
      const result = formatTitleFromMotherSessionId('LOWER_IN_SEASON_FRONT_ROW_V1', 'fr')
      expect(result).toBe('Bas du corps')
    })
  })

  describe('EN', () => {
    it('LOWER_PRESEASON_FORCE_V1 → Lower - Force', () => {
      expect(formatTitleFromMotherSessionId('LOWER_PRESEASON_FORCE_V1', 'en'))
        .toBe('Lower - Force')
    })

    it('override: FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1 → Light Primer · Front Row', () => {
      expect(formatTitleFromMotherSessionId('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1', 'en'))
        .toBe('Light Primer · Front Row')
    })
  })

  describe('default lang', () => {
    it('default is EN for backward compat', () => {
      expect(formatTitleFromMotherSessionId('LOWER_PRESEASON_FORCE_V1'))
        .toBe('Lower - Force')
    })
  })

  describe('edge cases', () => {
    it('unknown ID returns something readable, not raw ID', () => {
      const result = formatTitleFromMotherSessionId('SOME_UNKNOWN_SESSION_V1', 'fr')
      expect(result).not.toContain('_V1')
    })

    it('empty string returns itself', () => {
      expect(formatTitleFromMotherSessionId('', 'fr')).toBe('')
    })
  })
})
