import { describe, expect, it } from 'vitest'
import type { SessionLog, SessionType } from '../../../types/training'
import {
  deriveWeeklyScoreInput,
  prescribedRestDays,
  type WeeklyConformityInput,
} from '../deriveWeeklyScoreInput'
import { weekStartISO } from '../weekStart'

// Semaine de référence : lundi 2026-09-14 → dimanche 2026-09-20.
const MONDAY = '2026-09-14'

function log(
  dateISO: string,
  sessionType: SessionType = 'UPPER',
  overrides: Partial<SessionLog> = {},
): SessionLog {
  return {
    id: `log-${dateISO}-${sessionType}`,
    dateISO,
    week: 'W1',
    sessionType,
    fatigue: 'OK',
    rpe: 7,
    durationMin: 60,
    ...overrides,
  } as SessionLog
}

function derive(overrides: Partial<WeeklyConformityInput> = {}) {
  return deriveWeeklyScoreInput({
    todayISO: '2026-09-18',
    plannedSessions: [{ dateISO: '2026-09-15' }, { dateISO: '2026-09-17' }],
    logs: [],
    matchDatesISO: [],
    isDeloadWeek: false,
    referenceSessionCount: 3,
    acwrZone: 'optimal',
    priorWeekStreak: 0,
    ...overrides,
  })
}

describe('deriveWeeklyScoreInput — semaine', () => {
  it('rattache le résultat au lundi de la semaine', () => {
    expect(derive().weekStartISO).toBe(MONDAY)
    expect(weekStartISO('2026-09-20')).toBe(MONDAY)
  })

  it('ignore les séances hors de la semaine', () => {
    const result = derive({ logs: [log('2026-09-08'), log('2026-09-22')] })
    expect(result.plannedSessionsCompleted).toBe(0)
    expect(result.offPlanSessionsCompleted).toBe(0)
  })

  it('ignore les séances prévues hors de la semaine', () => {
    const result = derive({
      plannedSessions: [{ dateISO: '2026-09-15' }, { dateISO: '2026-09-29' }],
    })
    expect(result.sessionsPlanned).toBe(1)
  })
})

describe('deriveWeeklyScoreInput — conformité', () => {
  it('compte une séance prévue comme tenue', () => {
    const result = derive({ logs: [log('2026-09-15')] })
    expect(result.plannedSessionsCompleted).toBe(1)
    expect(result.offPlanSessionsCompleted).toBe(0)
  })

  it('accepte la récup active en substitution d’une séance prévue', () => {
    // Remplacer sa séance par de la récup active sur consigne de fatigue,
    // c'est respecter le plan, pas le contourner.
    const result = derive({ logs: [log('2026-09-15', 'ACTIVE_RECOVERY')] })
    expect(result.plannedSessionsCompleted).toBe(1)
  })

  it('compte une séance ajoutée un jour non prévu comme hors plan', () => {
    const result = derive({ logs: [log('2026-09-16')] })
    expect(result.plannedSessionsCompleted).toBe(0)
    expect(result.offPlanSessionsCompleted).toBe(1)
  })

  it('ne compte pas la récup active ajoutée comme du volume hors plan', () => {
    const result = derive({ logs: [log('2026-09-16', 'ACTIVE_RECOVERY')] })
    expect(result.offPlanSessionsCompleted).toBe(0)
  })

  it('ne compte pas deux fois deux séances le même jour', () => {
    const result = derive({
      logs: [log('2026-09-16', 'UPPER'), log('2026-09-16', 'CONDITIONING')],
    })
    expect(result.offPlanSessionsCompleted).toBe(1)
  })
})

describe('deriveWeeklyScoreInput — repos prescrit', () => {
  it('crédite le repos de la veille et du lendemain de match', () => {
    const result = derive({ matchDatesISO: ['2026-09-19'] })
    expect(result.prescribedRestRespected).toBe(2)
  })

  it('ne crédite pas un repos prescrit où une séance a été faite', () => {
    const result = derive({
      matchDatesISO: ['2026-09-19'],
      logs: [log('2026-09-18')],
    })
    expect(result.prescribedRestRespected).toBe(1)
  })

  it('tolère la récup active un jour de repos prescrit', () => {
    const result = derive({
      matchDatesISO: ['2026-09-19'],
      logs: [log('2026-09-18', 'ACTIVE_RECOVERY')],
    })
    expect(result.prescribedRestRespected).toBe(2)
  })
})

describe('prescribedRestDays', () => {
  it('encadre le match de J-1 et J+1', () => {
    expect(prescribedRestDays(['2026-09-16'], MONDAY)).toEqual([
      '2026-09-15',
      '2026-09-17',
    ])
  })

  it('exclut les jours hors de la semaine', () => {
    expect(prescribedRestDays(['2026-09-14'], MONDAY)).toEqual(['2026-09-15'])
  })

  it('n’inscrit pas un jour de match comme jour de repos', () => {
    // Deux matchs consécutifs : le second n'est pas un jour de repos.
    expect(prescribedRestDays(['2026-09-16', '2026-09-17'], MONDAY)).toEqual([
      '2026-09-15',
      '2026-09-18',
    ])
  })

  it('ne duplique pas un jour encadré par deux matchs', () => {
    // Le 16 est à la fois J+1 du premier match et J-1 du second : il ne doit
    // apparaître qu'une fois.
    expect(prescribedRestDays(['2026-09-15', '2026-09-17'], MONDAY)).toEqual([
      '2026-09-14',
      '2026-09-16',
      '2026-09-18',
    ])
  })
})

describe('deriveWeeklyScoreInput — qualité de log', () => {
  it('signale des logs complets', () => {
    const result = derive({ logs: [log('2026-09-15')] })
    expect(result.allCompletedHaveLoadData).toBe(true)
  })

  it('signale un RPE manquant', () => {
    const result = derive({ logs: [log('2026-09-15', 'UPPER', { rpe: undefined })] })
    expect(result.allCompletedHaveLoadData).toBe(false)
  })

  it('signale une durée manquante', () => {
    const result = derive({
      logs: [log('2026-09-15', 'UPPER', { durationMin: undefined })],
    })
    expect(result.allCompletedHaveLoadData).toBe(false)
  })

  it('reste faux sur une semaine sans séance', () => {
    expect(derive().allCompletedHaveLoadData).toBe(false)
  })
})

describe('deriveWeeklyScoreInput — passe-plat', () => {
  it('transmet le contexte de charge et de cycle sans le réinterpréter', () => {
    const result = derive({
      isDeloadWeek: true,
      referenceSessionCount: 4,
      acwrZone: 'caution',
      priorWeekStreak: 2,
    })
    expect(result.isDeloadWeek).toBe(true)
    expect(result.referenceSessionCount).toBe(4)
    expect(result.acwrZone).toBe('caution')
    expect(result.priorWeekStreak).toBe(2)
  })
})
