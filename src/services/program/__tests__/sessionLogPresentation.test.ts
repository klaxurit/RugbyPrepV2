import { describe, expect, it } from 'vitest'
import {
  getSessionLogDisplayTitle,
  getSessionLogDisplaySubtitle,
  getSessionLogSourceLabel,
  getSessionLogSourceTone,
  getSessionLogPrimaryWeekLabel,
  getSessionLogCycleLabel,
} from '../sessionLogPresentation'
import type { SessionLog } from '../../../types/training'

const BASE_LOG: SessionLog = {
  id: 'log-1',
  dateISO: '2026-03-10T10:00:00Z',
  week: 'W2',
  sessionType: 'LOWER',
  fatigue: 'OK',
}

describe('sessionLogPresentation', () => {
  describe('getSessionLogDisplayTitle', () => {
    it('priorité à sessionLabel si présent', () => {
      const log: SessionLog = { ...BASE_LOG, sessionLabel: 'Full Body Force A' }
      expect(getSessionLogDisplayTitle(log)).toBe('Full Body Force A')
    })

    it('fallback sur sessionType si pas de sessionLabel', () => {
      expect(getSessionLogDisplayTitle(BASE_LOG)).toBe('Bas du Corps')
    })

    it('sessionType UPPER → Haut du Corps', () => {
      expect(getSessionLogDisplayTitle({ ...BASE_LOG, sessionType: 'UPPER' })).toBe('Haut du Corps')
    })
  })

  describe('getSessionLogSourceLabel', () => {
    it('legacy par défaut (pas de programSource)', () => {
      expect(getSessionLogSourceLabel(BASE_LOG)).toBe('Programme historique')
    })

    it('legacy explicite', () => {
      expect(getSessionLogSourceLabel({ ...BASE_LOG, programSource: 'legacy' })).toBe('Programme historique')
    })

    it('mother_session', () => {
      expect(getSessionLogSourceLabel({ ...BASE_LOG, programSource: 'mother_session' })).toBe('Programme annuel')
    })
  })

  describe('getSessionLogSourceTone', () => {
    it('legacy par défaut', () => {
      expect(getSessionLogSourceTone(BASE_LOG)).toBe('legacy')
    })

    it('mother_session', () => {
      expect(getSessionLogSourceTone({ ...BASE_LOG, programSource: 'mother_session' })).toBe('mother_session')
    })
  })

  describe('getSessionLogPrimaryWeekLabel', () => {
    it('legacy → label classique S2', () => {
      expect(getSessionLogPrimaryWeekLabel(BASE_LOG)).toBe('S2')
    })

    it('DELOAD → Décharge', () => {
      expect(getSessionLogPrimaryWeekLabel({ ...BASE_LOG, week: 'DELOAD' })).toBe('Décharge')
    })

    it('mother_session → priorité à annualWeekCode', () => {
      const log: SessionLog = {
        ...BASE_LOG,
        programSource: 'mother_session',
        programContext: { cycle: 'off_season', annualWeekCode: 'OFF_S03' },
      }
      expect(getSessionLogPrimaryWeekLabel(log)).toBe('OFF_S03')
    })

    it('mother_session sans annualWeekCode → fallback classique', () => {
      const log: SessionLog = {
        ...BASE_LOG,
        programSource: 'mother_session',
        programContext: { cycle: 'off_season' },
      }
      expect(getSessionLogPrimaryWeekLabel(log)).toBe('S2')
    })

    it('H3 → S3', () => {
      expect(getSessionLogPrimaryWeekLabel({ ...BASE_LOG, week: 'H3' })).toBe('S3')
    })
  })

  describe('getSessionLogCycleLabel', () => {
    it('pas de programContext → null', () => {
      expect(getSessionLogCycleLabel(BASE_LOG)).toBeNull()
    })

    it('off_season → Hors-saison', () => {
      expect(getSessionLogCycleLabel({ ...BASE_LOG, programContext: { cycle: 'off_season' } })).toBe('Inter-saison')
    })

    it('pre_season → Pré-saison', () => {
      expect(getSessionLogCycleLabel({ ...BASE_LOG, programContext: { cycle: 'pre_season' } })).toBe('Pré-saison')
    })

    it('in_season → En saison', () => {
      expect(getSessionLogCycleLabel({ ...BASE_LOG, programContext: { cycle: 'in_season' } })).toBe('En saison')
    })

    it('playoffs → Playoffs', () => {
      expect(getSessionLogCycleLabel({ ...BASE_LOG, programContext: { cycle: 'playoffs' } })).toBe('Playoffs')
    })
  })

  describe('getSessionLogDisplaySubtitle', () => {
    it('legacy sans cycle → week · date', () => {
      const subtitle = getSessionLogDisplaySubtitle(BASE_LOG)
      expect(subtitle).toContain('S2')
      expect(subtitle).toContain('mars')
    })

    it('mother_session avec cycle → annualWeekCode · cycle · date', () => {
      const log: SessionLog = {
        ...BASE_LOG,
        programSource: 'mother_session',
        programContext: { cycle: 'off_season', annualWeekCode: 'OFF_S03' },
      }
      const subtitle = getSessionLogDisplaySubtitle(log)
      expect(subtitle).toContain('OFF_S03')
      expect(subtitle).toContain('Inter-saison')
    })
  })
})
