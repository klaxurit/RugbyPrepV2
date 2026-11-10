import { describe, expect, it } from 'vitest'
import {
  formatMotherSessionSubtitle,
  formatTitleFromMotherSessionId,
} from '../formatMotherSessionTitle'

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

    it('override: FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1 → Activation · Pack', () => {
      expect(formatTitleFromMotherSessionId('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1', 'fr'))
        .toBe('Activation · Pack')
    })

    it('contentFamily back_row → Activation · 3ème ligne', () => {
      expect(
        formatTitleFromMotherSessionId('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1', 'fr', {
          contentFamily: 'back_row',
        }),
      ).toBe('Activation · 3ème ligne')
    })

    it('contentFamily second_row sur pré Power → suffixe 2ème ligne', () => {
      expect(
        formatTitleFromMotherSessionId('LOWER_PRESEASON_POWER_FRONT_ROW_V1', 'fr', {
          contentFamily: 'second_row',
        }),
      ).toMatch(/2ème ligne/)
    })

    it('override: FULL_BODY_IN_SEASON_BACK_THREE_V1 → Corps complet · Ligne arrière', () => {
      expect(formatTitleFromMotherSessionId('FULL_BODY_IN_SEASON_BACK_THREE_V1', 'fr'))
        .toBe('Corps complet · Ligne arrière')
    })

    it('LOWER_IN_SEASON_FRONT_ROW_V1 → Bas du corps', () => {
      const result = formatTitleFromMotherSessionId('LOWER_IN_SEASON_FRONT_ROW_V1', 'fr')
      expect(result).toBe('Bas du corps')
    })

    it('variantes in-season lower : pas de suffixe cryptique (Tbrdl, etc.)', () => {
      expect(formatTitleFromMotherSessionId('LOWER_IN_SEASON_FRONT_ROW_TBRDL_V1', 'fr'))
        .toBe('Bas du corps')
      expect(formatTitleFromMotherSessionId('LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1', 'fr'))
        .toBe('Bas du corps')
      expect(formatTitleFromMotherSessionId('LOWER_IN_SEASON_BACK_THREE_RDL_V1', 'fr'))
        .toBe('Bas du corps')
      expect(formatTitleFromMotherSessionId('LOWER_IN_SEASON_BACK_THREE_SLHIP_V1', 'fr'))
        .toBe('Bas du corps')
    })

    it('variantes in-season upper : Haut du corps sans Landmine / Plyo…', () => {
      expect(formatTitleFromMotherSessionId('UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1', 'fr'))
        .toBe('Haut du corps')
      expect(formatTitleFromMotherSessionId('UPPER_IN_SEASON_BACK_THREE_PUSHPRESS_V1', 'fr'))
        .toBe('Haut du corps')
    })

    it('variante Full B : même titre que A', () => {
      expect(formatTitleFromMotherSessionId('FULL_BODY_IN_SEASON_FRONT_ROW_B_V1', 'fr'))
        .toBe('Corps complet · Pack')
    })
  })

  describe('EN', () => {
    it('LOWER_PRESEASON_FORCE_V1 → Lower - Force', () => {
      expect(formatTitleFromMotherSessionId('LOWER_PRESEASON_FORCE_V1', 'en'))
        .toBe('Lower - Force')
    })

    it('override: FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1 → Activation · Pack', () => {
      expect(formatTitleFromMotherSessionId('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1', 'en'))
        .toBe('Activation · Pack')
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

    it('nouveaux IDs famille : titre sans BACK_ROW / SECOND_ROW brut', () => {
      expect(formatTitleFromMotherSessionId('LOWER_IN_SEASON_BACK_ROW_V1', 'fr')).toBe(
        'Bas du corps',
      )
      expect(formatTitleFromMotherSessionId('UPPER_IN_SEASON_SECOND_ROW_LANDMINE_V1', 'fr')).toBe(
        'Haut du corps',
      )
      expect(formatTitleFromMotherSessionId('UPPER_IN_SEASON_HALF_BACKS_CHESTPASS_V1', 'fr')).not.toMatch(
        /BACK_ROW|HALF_BACKS|SECOND_ROW/,
      )
    })
  })

  describe('formatMotherSessionSubtitle', () => {
    it('BACK_ROW → 3ème ligne, jamais le token technique', () => {
      const sub = formatMotherSessionSubtitle('UPPER_IN_SEASON_BACK_ROW_LANDMINE_V1', 'fr', {
        mesocycleWeek: 3,
        trainingLevel: 'performance',
      })
      expect(sub).toMatch(/3ème ligne/)
      expect(sub).not.toMatch(/BACK_ROW/)
      expect(sub).toMatch(/landmine|Landmine|Contraste/i)
    })

    it('CENTERS Lower → Centres sans lane token', () => {
      const sub = formatMotherSessionSubtitle('LOWER_IN_SEASON_CENTERS_V1', 'fr')
      expect(sub).toMatch(/Centres/)
      expect(sub).not.toMatch(/CENTERS|BACK_ROW/)
    })
  })
})
