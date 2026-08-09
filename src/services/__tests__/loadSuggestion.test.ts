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

  // Zone d'effort : RIR 1-2 hors saison, RIR 2-3 en saison. Une série dans la
  // zone doit faire progresser. Auparavant RIR 2 (RPE 8) gelait l'athlète sur
  // la même charge et les mêmes reps indéfiniment : celui qui loguait
  // honnêtement son effort ne progressait jamais.
  describe('Zone d\'effort cible', () => {
    it('RIR 2 au haut de fourchette → INCREASE en saison', () => {
      const r = getLoadSuggestion(
        baseCtx({
          cycle: 'in_season',
          lastEntry: baseEntry({ reps: 5, rir: 2 }),
          historicalEntries: [baseEntry({ rir: 2 }), baseEntry({ rir: 2 })],
        }),
      )
      expect(r.decision).toBe('increase')
      expect(r.suggestedWeight).toBe(105)
    })

    it('RIR 2 sous le haut de fourchette → vise +1 rep, plus de palier mort', () => {
      const r = getLoadSuggestion(
        baseCtx({
          cycle: 'in_season',
          lastEntry: baseEntry({ reps: 3, rir: 2 }),
        }),
      )
      expect(r.decision).toBe('maintain')
      expect(r.suggestedReps).toBe(4)
    })

    it('RIR 1 → INCREASE hors saison, MAINTAIN en saison', () => {
      const hard = baseEntry({ reps: 5, rir: 1 })
      const offSeason = getLoadSuggestion(
        baseCtx({ cycle: 'off_season', lastEntry: hard, historicalEntries: [hard, hard] }),
      )
      expect(offSeason.decision).toBe('increase')

      // En saison la charge du club s'ajoute : RIR 1 sort de la zone visée.
      const inSeason = getLoadSuggestion(
        baseCtx({ cycle: 'in_season', lastEntry: hard, historicalEntries: [hard, hard] }),
      )
      expect(inSeason.decision).toBe('maintain')
    })

    it('cycle absent → zone in-season, la plus conservatrice', () => {
      const hard = baseEntry({ reps: 5, rir: 1 })
      const r = getLoadSuggestion(baseCtx({ lastEntry: hard, historicalEntries: [hard, hard] }))
      expect(r.decision).toBe('maintain')
    })

    it('série nettement trop facile → pas de charge doublé', () => {
      const easy = baseEntry({ reps: 5, rir: 5 })
      const r = getLoadSuggestion(
        baseCtx({ cycle: 'off_season', lastEntry: easy, historicalEntries: [easy, easy] }),
      )
      expect(r.decision).toBe('increase')
      // lower_compound : +5 kg normalement, doublé à +10 quand l'effort est
      // deux points sous le plafond.
      expect(r.suggestedWeight).toBe(110)
      expect(r.justification).toMatch(/trop facile/i)
    })

    it('poids de corps : RIR 2 fait progresser les reps au lieu de figer', () => {
      const bwCtx = (rir: number) =>
        baseCtx({
          exerciseId: 'power__squat_jump__bodyweight',
          cycle: 'off_season',
          lastEntry: baseEntry({ exerciseId: 'power__squat_jump__bodyweight', reps: 8, rir }),
          prescribedRepsHigh: undefined,
        })
      const inZone = getLoadSuggestion(bwCtx(2))
      expect(inZone.decision).toBe('bodyweight')
      expect(inZone.suggestedReps).toBe(9)

      // Nettement trop facile → +2 reps.
      expect(getLoadSuggestion(bwCtx(5)).suggestedReps).toBe(10)
    })

    it('les garde-fous priment sur la zone d\'effort', () => {
      const inZone = baseEntry({ reps: 5, rir: 2 })
      const ctx = { cycle: 'off_season' as const, lastEntry: inZone, historicalEntries: [inZone, inZone] }
      expect(getLoadSuggestion(baseCtx({ ...ctx, daysToMatch: 1 })).decision).toBe('maintain')
      expect(getLoadSuggestion(baseCtx({ ...ctx, acwr: 1.4 })).decision).toBe('maintain')
      expect(getLoadSuggestion(baseCtx({ ...ctx, fatigueLevel: 'high' })).decision).toBe('maintain')
      expect(getLoadSuggestion(baseCtx({ ...ctx, week: 'DELOAD' })).decision).toBe('decrease')
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
