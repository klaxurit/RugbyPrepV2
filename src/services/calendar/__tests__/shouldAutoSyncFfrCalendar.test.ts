import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../../types/training'
import {
  FFR_SCORE_REFRESH_MS,
  FFR_STALE_SYNC_MS,
  hasPendingFfrPostMatchScore,
  shouldAutoSyncFfrCalendar,
} from '../shouldAutoSyncFfrCalendar'

function match(partial: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'm1',
    date: '2026-10-04',
    type: 'match',
    created_at: '2026-10-01T00:00:00.000Z',
    source: 'ffr_import',
    ...partial,
  }
}

describe('hasPendingFfrPostMatchScore', () => {
  it('détecte un match FFR récent sans score validé', () => {
    expect(
      hasPendingFfrPostMatchScore(
        [match({ ffr_score_valid: false })],
        '2026-10-05',
      ),
    ).toBe(true)
  })

  it('ignore si le score est déjà validé', () => {
    expect(
      hasPendingFfrPostMatchScore(
        [match({ ffr_score_valid: true, ffr_score_locale: 20, ffr_score_visiteur: 10 })],
        '2026-10-05',
      ),
    ).toBe(false)
  })

  it('ignore les matchs manuels', () => {
    expect(
      hasPendingFfrPostMatchScore(
        [match({ source: 'manual', ffr_score_valid: false })],
        '2026-10-05',
      ),
    ).toBe(false)
  })
})

describe('shouldAutoSyncFfrCalendar', () => {
  const todayISO = '2026-10-05'
  const nowMs = new Date('2026-10-05T10:00:00.000Z').getTime()

  it('sync stale après 24h', () => {
    expect(
      shouldAutoSyncFfrCalendar({
        lastSyncAt: new Date(nowMs - FFR_STALE_SYNC_MS - 1).toISOString(),
        events: [],
        todayISO,
        nowMs,
      }),
    ).toBe('stale')
  })

  it('sync post_match_score si match récent sans score et sync >6h', () => {
    expect(
      shouldAutoSyncFfrCalendar({
        lastSyncAt: new Date(nowMs - FFR_SCORE_REFRESH_MS - 1).toISOString(),
        events: [match({ ffr_score_valid: false })],
        todayISO,
        nowMs,
      }),
    ).toBe('post_match_score')
  })

  it('ne spam pas si sync récente (<6h) même sans score', () => {
    expect(
      shouldAutoSyncFfrCalendar({
        lastSyncAt: new Date(nowMs - 60 * 60 * 1000).toISOString(),
        events: [match({ ffr_score_valid: false })],
        todayISO,
        nowMs,
      }),
    ).toBeNull()
  })

  it('ne force pas si score déjà là et sync <24h', () => {
    expect(
      shouldAutoSyncFfrCalendar({
        lastSyncAt: new Date(nowMs - 2 * 60 * 60 * 1000).toISOString(),
        events: [match({ ffr_score_valid: true, ffr_score_locale: 50, ffr_score_visiteur: 12 })],
        todayISO,
        nowMs,
      }),
    ).toBeNull()
  })
})
