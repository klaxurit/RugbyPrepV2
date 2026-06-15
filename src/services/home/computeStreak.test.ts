import { describe, expect, it } from 'vitest'
import { computeStreak } from './computeStreak'
import type { SessionLog } from '../../types/training'

const TODAY = '2026-06-03'

function log(dateISO: string): SessionLog {
  return {
    id: dateISO,
    dateISO,
    sessionType: 'STRENGTH',
    fatigue: 'OK',
  } as SessionLog
}

describe('computeStreak', () => {
  it('4 séances il y a 1 mois → compteur 0 et message de relance', () => {
    const logs = [
      log('2026-05-01'),
      log('2026-05-03'),
      log('2026-05-05'),
      log('2026-05-08'),
    ]
    const streak = computeStreak(logs, TODAY)
    expect(streak.count).toBe(0)
    expect(streak.weekHistory.every((d) => !d)).toBe(true)
    expect(streak.caption).toBe('Ça fait un moment — reprends par une séance courte.')
  })

  it('4 séances sur les 14 derniers jours → régularité', () => {
    const logs = [
      log('2026-05-25'),
      log('2026-05-28'),
      log('2026-05-30'),
      log('2026-06-01'),
    ]
    const streak = computeStreak(logs, TODAY)
    expect(streak.count).toBe(4)
    expect(streak.caption).toBe('Tu installes la régularité.')
  })

  it('aucun log → première séance', () => {
    const streak = computeStreak([], TODAY)
    expect(streak.count).toBe(0)
    expect(streak.caption).toBe('Lance ta première séance.')
  })

  it('pause 8 jours → relance même si séance encore dans la fenêtre 14 j', () => {
    const streak = computeStreak([log('2026-05-26')], TODAY)
    expect(streak.count).toBe(1)
    expect(streak.caption).toBe('La cadence s’est arrêtée — remets-toi en route.')
  })
})
