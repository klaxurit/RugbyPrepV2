import { describe, expect, it } from 'vitest'
import { appendTransitionEntry, restoreLastTransition, computeDeferralExpiry, cycleToSeasonMode } from '../transitionJournal'
import type { TransitionEntry, SeasonTransitionState } from '../../../types/training'

const makeEntry = (id: string, to: TransitionEntry['to'] = 'off_season'): TransitionEntry => ({
  id,
  at: '2026-04-08',
  trigger: 'user_manual',
  from: { cycle: 'in_season', weekNumber: 15, phase: undefined, schedulingMode: 'calendar' },
  anchorsSnapshot: { seasonEndedAt: undefined },
  to,
})

describe('transitionJournal', () => {
  describe('appendTransitionEntry', () => {
    it('appends to empty journal', () => {
      const result = appendTransitionEntry(undefined, makeEntry('e1'))
      expect(result.transitionJournal).toHaveLength(1)
      expect(result.transitionJournal![0].id).toBe('e1')
    })

    it('trims to 3 entries max', () => {
      const state: SeasonTransitionState = {
        transitionJournal: [makeEntry('e1'), makeEntry('e2'), makeEntry('e3')],
      }
      const result = appendTransitionEntry(state, makeEntry('e4'))
      expect(result.transitionJournal).toHaveLength(3)
      expect(result.transitionJournal![0].id).toBe('e2') // oldest trimmed
      expect(result.transitionJournal![2].id).toBe('e4') // newest added
    })

    it('preserves activeDeferral', () => {
      const state: SeasonTransitionState = {
        activeDeferral: { eventId: 'm1', matchDateAtDefer: '2026-09-12', deferredAt: '2026-06-01', expiresAt: '2026-07-18' },
      }
      const result = appendTransitionEntry(state, makeEntry('e1'))
      expect(result.activeDeferral).toBeDefined()
    })
  })

  describe('restoreLastTransition', () => {
    it('returns null on empty journal', () => {
      expect(restoreLastTransition(undefined)).toBeNull()
      expect(restoreLastTransition({ transitionJournal: [] })).toBeNull()
    })

    it('restores anchors from last entry and trims', () => {
      const state: SeasonTransitionState = {
        transitionJournal: [
          makeEntry('e1'),
          { ...makeEntry('e2'), anchorsSnapshot: { seasonEndedAt: undefined, manualPlayoffs: true } },
        ],
      }
      const result = restoreLastTransition(state)!
      expect(result).not.toBeNull()
      expect(result.restoredAnchors.manualPlayoffs).toBe(true)
      expect(result.updatedTransitionState.transitionJournal).toHaveLength(1)
      expect(result.updatedTransitionState.transitionJournal![0].id).toBe('e1')
    })

    it('clears activeDeferral on restore', () => {
      const state: SeasonTransitionState = {
        transitionJournal: [makeEntry('e1')],
        activeDeferral: { eventId: 'm1', matchDateAtDefer: '2026-09-12', deferredAt: '2026-06-01', expiresAt: '2026-07-18' },
      }
      const result = restoreLastTransition(state)!
      expect(result.updatedTransitionState.activeDeferral).toBeUndefined()
    })

    it('returns restoredCycle from the last entry from.cycle', () => {
      const preSeasonEntry: TransitionEntry = {
        ...makeEntry('e1'),
        from: { cycle: 'pre_season', weekNumber: 5, schedulingMode: 'calendar' },
      }
      const state: SeasonTransitionState = { transitionJournal: [preSeasonEntry] }
      const result = restoreLastTransition(state)!
      expect(result.restoredCycle).toBe('pre_season')
    })
  })

  describe('cycleToSeasonMode', () => {
    it('maps in_season to in_season', () => {
      expect(cycleToSeasonMode('in_season')).toBe('in_season')
    })

    it('maps off_season to off_season', () => {
      expect(cycleToSeasonMode('off_season')).toBe('off_season')
    })

    it('maps pre_season to pre_season', () => {
      expect(cycleToSeasonMode('pre_season')).toBe('pre_season')
    })

    it('maps playoffs to in_season (SeasonMode has no playoffs)', () => {
      expect(cycleToSeasonMode('playoffs')).toBe('in_season')
    })
  })

  describe('computeDeferralExpiry', () => {
    it('far match (>70 days): expires 56 days before match', () => {
      const expiry = computeDeferralExpiry('2026-09-12', '2026-06-01') // 103 days
      expect(expiry).toBe('2026-07-18') // Sept 12 - 56 days
    })

    it('near match (<=70 days): expires in 14 days', () => {
      const expiry = computeDeferralExpiry('2026-08-20', '2026-07-01') // 50 days
      expect(expiry).toBe('2026-07-15') // July 1 + 14
    })

    it('very near match: capped at match date', () => {
      const expiry = computeDeferralExpiry('2026-07-10', '2026-07-05') // 5 days
      expect(expiry).toBe('2026-07-10') // capped
    })
  })
})
