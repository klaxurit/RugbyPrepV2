import { describe, expect, it } from 'vitest'
import { getLoadSuggestion, type LoadSuggestionContext } from '../loadSuggestion'
import type { ExerciseLogEntry } from '../../types/training'

const baseEntry = (overrides: Partial<ExerciseLogEntry> = {}): ExerciseLogEntry => ({
  exerciseId: 'back_squat',
  loadKg: 100,
  reps: 5,
  rir: 3,
  setsCompleted: 3,
  ...overrides,
})

const baseCtx = (overrides: Partial<LoadSuggestionContext> = {}): LoadSuggestionContext => ({
  exerciseId: 'back_squat',
  lastEntry: baseEntry(),
  week: 'W1',
  acwr: null,
  isRehabActive: false,
  fatigueLevel: 'normal',
  trainingLevel: 'performance',
  historicalEntries: [baseEntry(), baseEntry()],
  prescribedRepsHigh: 5,
  prescribedRepsLow: 3,
  daysToMatch: null,
  ...overrides,
})

describe('getLoadSuggestion — garde-fous', () => {
  describe('G5 — Starter', () => {
    it('renvoie no_suggestion pour trainingLevel="starter"', () => {
      const r = getLoadSuggestion(baseCtx({ trainingLevel: 'starter' }))
      expect(r.decision).toBe('no_suggestion')
    })
  })

  describe('G4 — Match J-2', () => {
    it('MAINTAIN si match dans 2 jours', () => {
      const r = getLoadSuggestion(baseCtx({ daysToMatch: 2 }))
      expect(r.decision).toBe('maintain')
      expect(r.justification).toMatch(/match/i)
    })

    it('MAINTAIN si match aujourd\'hui (J-0)', () => {
      const r = getLoadSuggestion(baseCtx({ daysToMatch: 0 }))
      expect(r.decision).toBe('maintain')
    })

    it('AUTORISE progression si match dans 3 jours', () => {
      const r = getLoadSuggestion(baseCtx({ daysToMatch: 3 }))
      expect(r.decision).toBe('increase')
    })
  })

  describe('G1 — minimum baseline', () => {
    it('MAINTAIN si moins de 2 logs historiques (RPE bas + reps OK)', () => {
      const r = getLoadSuggestion(
        baseCtx({ historicalEntries: [baseEntry()] }),
      )
      expect(r.decision).toBe('maintain')
      expect(r.confidence).toBe('low')
      expect(r.justification).toMatch(/pas assez/i)
    })

    it('AUTORISE INCREASE si 2 logs historiques avec RPE bas', () => {
      const r = getLoadSuggestion(
        baseCtx({ historicalEntries: [baseEntry(), baseEntry()] }),
      )
      expect(r.decision).toBe('increase')
    })
  })

  describe('G2 — Double progression', () => {
    it('MAINTAIN si reps < haut de fourchette même avec RPE bas', () => {
      const r = getLoadSuggestion(
        baseCtx({
          lastEntry: baseEntry({ reps: 3, rir: 4 }),
          prescribedRepsHigh: 5,
        }),
      )
      expect(r.decision).toBe('maintain')
      expect(r.justification).toMatch(/5 reps/)
      expect(r.suggestedReps).toBe(4)
    })

    it('INCREASE si reps == haut de fourchette + RPE bas', () => {
      const r = getLoadSuggestion(
        baseCtx({
          lastEntry: baseEntry({ reps: 5, rir: 3 }),
          prescribedRepsHigh: 5,
        }),
      )
      expect(r.decision).toBe('increase')
      expect(r.suggestedWeight).toBeGreaterThan(100)
    })

    it('Builder : increment divisé par 2', () => {
      const r = getLoadSuggestion(
        baseCtx({
          trainingLevel: 'builder',
          lastEntry: baseEntry({ reps: 5, rir: 3 }),
          prescribedRepsHigh: 5,
        }),
      )
      expect(r.decision).toBe('increase')
      // lower_compound : up=5kg → builder = 2.5kg → 100 + 2.5 = 102.5
      expect(r.suggestedWeight).toBe(102.5)
    })
  })

  describe('G9 — 2 séances RPE 9+ consécutives reps incomplètes', () => {
    it('DECREASE -10% si 2 dernières séances toutes deux RPE 9+ + setsCompleted=0', () => {
      const failed = baseEntry({ rir: 0, setsCompleted: 0 }) // rpe=10, reps incomplètes
      const r = getLoadSuggestion(
        baseCtx({
          lastEntry: failed,
          historicalEntries: [failed, failed],
        }),
      )
      expect(r.decision).toBe('decrease')
      expect(r.justification).toMatch(/2 séances/i)
      // 100 * 0.9 = 90, rounded to 2.5 = 90
      expect(r.suggestedWeight).toBe(90)
    })

    it('PAS DE DECREASE -10% si une seule séance échouée', () => {
      const failed = baseEntry({ rir: 0, setsCompleted: 0 })
      const r = getLoadSuggestion(
        baseCtx({
          lastEntry: failed,
          historicalEntries: [failed, baseEntry()],
        }),
      )
      // Tombe sur la branche RPE ≥ 9 + reps incomplete = -5%
      expect(r.decision).toBe('decrease')
      expect(r.justification).not.toMatch(/2 séances/i)
    })
  })
})
