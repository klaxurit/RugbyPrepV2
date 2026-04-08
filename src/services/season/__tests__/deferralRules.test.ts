import { describe, expect, it } from 'vitest'
import { applyDeferralRules } from '../deferralRules'
import type { ActiveDeferral, CalendarEvent } from '../../../types/training'

const match = (id: string, date: string): CalendarEvent =>
  ({ id, date, type: 'match', source: 'ffr_import' } as CalendarEvent)

const baseDeferral: ActiveDeferral = {
  eventId: 'match-sept',
  matchDateAtDefer: '2026-09-12',
  deferredAt: '2026-06-01',
  expiresAt: '2026-07-18',
}

describe('applyDeferralRules', () => {
  it('no deferral → structuralEvents equals visibleEvents', () => {
    const events = [match('m1', '2026-09-12')]
    const r = applyDeferralRules({ activeDeferral: undefined, visibleEvents: events, today: '2026-06-01' })
    expect(r.structuralEvents).toEqual(events)
    expect(r.shouldPurge).toBe(false)
  })

  it('valid deferral filters the deferred match from structuralEvents', () => {
    const events = [match('match-sept', '2026-09-12'), match('other', '2026-10-01')]
    const r = applyDeferralRules({ activeDeferral: baseDeferral, visibleEvents: events, today: '2026-06-15' })
    expect(r.structuralEvents).toEqual([match('other', '2026-10-01')])
    expect(r.shouldPurge).toBe(false)
  })

  it('expired deferral → purge, all events structural', () => {
    const events = [match('match-sept', '2026-09-12')]
    const r = applyDeferralRules({ activeDeferral: baseDeferral, visibleEvents: events, today: '2026-07-19' })
    expect(r.shouldPurge).toBe(true)
    expect(r.purgeReason).toBe('expired')
    expect(r.structuralEvents).toEqual(events)
  })

  it('match date passed → purge', () => {
    // Use a deferral with expiresAt far in the future so rule 1 (expired) doesn't fire first
    const lateDeferral: ActiveDeferral = {
      ...baseDeferral,
      expiresAt: '2026-12-31',
    }
    const events = [match('match-sept', '2026-09-12')]
    const r = applyDeferralRules({ activeDeferral: lateDeferral, visibleEvents: events, today: '2026-09-13' })
    expect(r.shouldPurge).toBe(true)
    expect(r.purgeReason).toBe('match_passed')
  })

  it('match removed → purge', () => {
    const events: CalendarEvent[] = [] // match no longer in visible events
    const r = applyDeferralRules({ activeDeferral: baseDeferral, visibleEvents: events, today: '2026-06-15' })
    expect(r.shouldPurge).toBe(true)
    expect(r.purgeReason).toBe('match_removed_or_hidden')
  })

  it('returnToTeamTrainingAt set → purge', () => {
    const events = [match('match-sept', '2026-09-12')]
    const r = applyDeferralRules({
      activeDeferral: baseDeferral,
      visibleEvents: events,
      today: '2026-06-15',
      returnToTeamTrainingAt: '2026-08-01',
    })
    expect(r.shouldPurge).toBe(true)
    expect(r.purgeReason).toBe('return_date_set')
  })

  it('match date advanced >14 days → purge', () => {
    // Match was Sept 12, now moved to Aug 20 (23 days earlier)
    const events = [match('match-sept', '2026-08-20')]
    const r = applyDeferralRules({ activeDeferral: baseDeferral, visibleEvents: events, today: '2026-06-15' })
    expect(r.shouldPurge).toBe(true)
    expect(r.purgeReason).toBe('match_date_advanced')
  })

  it('match date moved only slightly (< 14 days) → deferral stays valid', () => {
    const events = [match('match-sept', '2026-09-05')] // 7 days earlier
    const r = applyDeferralRules({ activeDeferral: baseDeferral, visibleEvents: events, today: '2026-06-15' })
    expect(r.shouldPurge).toBe(false)
    expect(r.structuralEvents).toEqual([]) // match still filtered
  })

  it('closer future match than deferred-at date by >7 days → purge', () => {
    const events = [match('match-sept', '2026-09-12'), match('other-team', '2026-08-25')]
    const r = applyDeferralRules({ activeDeferral: baseDeferral, visibleEvents: events, today: '2026-06-15' })
    expect(r.shouldPurge).toBe(true)
    expect(r.purgeReason).toBe('closer_match_appeared')
  })

  it('match moved slightly earlier + today past real date → purge (never mask a played match)', () => {
    // Deferred at Sept 12, match moved to Sept 5 (only 7 days earlier, below 14d threshold).
    // Today is Sept 6 → past the real match date → must purge.
    const lateDeferral: ActiveDeferral = {
      ...baseDeferral,
      expiresAt: '2026-12-31', // far future so expiry rule doesn't fire
    }
    const events = [match('match-sept', '2026-09-05')]
    const r = applyDeferralRules({ activeDeferral: lateDeferral, visibleEvents: events, today: '2026-09-06' })
    expect(r.shouldPurge).toBe(true)
    expect(r.purgeReason).toBe('match_passed')
    expect(r.structuralEvents).toEqual(events) // match is structural again
  })
})
