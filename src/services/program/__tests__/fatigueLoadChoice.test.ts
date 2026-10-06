// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  applyFatigueLoadChoiceToSessions,
  availableFatigueLoadChoices,
  defaultFatigueLoadChoice,
  effectiveFatigueLevelForTemplates,
  findDropSessionIndex,
  lightenResolvedSlot,
  isoWeekMondayKey,
} from '../fatigueLoadChoice'
import type { ResolvedMotherSessionSlot } from '../../motherSession/resolveMotherSessionsForWeek'
import type { MotherSession } from '../../../types/motherSession'

function makeSession(id: string, blockCount: number): MotherSession {
  return {
    id,
    title: id,
    blocks: Array.from({ length: blockCount }, (_, i) => ({
      number: i + 1,
      format: '3 rounds',
      isOptional: i === blockCount - 1,
      exercises: [{ name: `Ex ${i + 1}`, prescription: '3x8' }],
    })),
    metadata: { reductionOrder: blockCount >= 3 ? [blockCount, blockCount - 1] : undefined },
  } as MotherSession
}

function slot(
  sessionId: string,
  opts: Partial<ResolvedMotherSessionSlot> & { blocks?: number } = {},
): ResolvedMotherSessionSlot {
  const blocks = opts.blocks ?? 3
  const session = makeSession(sessionId, blocks)
  return {
    sessionId,
    session,
    role: opts.role ?? 'primary',
    dayPreference: opts.dayPreference,
    variant: opts.variant,
    maxBlocks: opts.maxBlocks,
  }
}

describe('fatigueLoadChoice', () => {
  describe('zone options (Plan B)', () => {
    it('caution → self + lighten only', () => {
      expect(availableFatigueLoadChoices('caution', 3)).toEqual([
        'self_manage',
        'lighten_volume',
      ])
    })

    it('danger 3× → lighten, drop, self', () => {
      expect(availableFatigueLoadChoices('danger', 3)).toEqual([
        'lighten_volume',
        'drop_session',
        'self_manage',
      ])
    })

    it('danger 2× → no drop', () => {
      expect(availableFatigueLoadChoices('danger', 2)).toEqual([
        'lighten_volume',
        'self_manage',
      ])
    })

    it('critical defaults to drop when ≥3', () => {
      expect(defaultFatigueLoadChoice('critical', 3)).toBe('drop_session')
      expect(defaultFatigueLoadChoice('critical', 2)).toBe('lighten_volume')
      expect(defaultFatigueLoadChoice('danger', 3)).toBe('lighten_volume')
      expect(defaultFatigueLoadChoice('caution', 3)).toBe('lighten_volume')
    })
  })

  describe('applyFatigueLoadChoiceToSessions', () => {
    const week3 = [
      slot('LOWER_INSEASON_V1', { dayPreference: 'early_week', blocks: 4 }),
      slot('UPPER_INSEASON_V1', { dayPreference: 'mid_week', blocks: 4 }),
      slot('PRIMER_INSEASON_BACK_THREE_V1', { dayPreference: 'pre_match', blocks: 3 }),
    ]

    it('self_manage laisse intact', () => {
      const r = applyFatigueLoadChoiceToSessions(week3, 'self_manage')
      expect(r.sessions).toHaveLength(3)
      expect(r.sessions.every((s) => s.variant === undefined)).toBe(true)
    })

    it('lighten_volume marque light + réduit maxBlocks', () => {
      const r = applyFatigueLoadChoiceToSessions(week3, 'lighten_volume')
      expect(r.sessions).toHaveLength(3)
      expect(r.sessions.every((s) => s.variant === 'light')).toBe(true)
      expect(r.sessions[0].maxBlocks).toBe(3)
      expect(r.warnings[0]).toMatch(/20–30/)
    })

    it('drop_session retire le Primer (pre_match)', () => {
      const r = applyFatigueLoadChoiceToSessions(week3, 'drop_session')
      expect(r.sessions).toHaveLength(2)
      expect(r.sessions.map((s) => s.sessionId)).toEqual([
        'LOWER_INSEASON_V1',
        'UPPER_INSEASON_V1',
      ])
      expect(r.applied).toBe('drop_session')
    })

    it('drop_session sur 2 séances → fallback lighten', () => {
      const r = applyFatigueLoadChoiceToSessions(week3.slice(0, 2), 'drop_session')
      expect(r.applied).toBe('lighten_volume')
      expect(r.sessions).toHaveLength(2)
      expect(r.sessions.every((s) => s.variant === 'light')).toBe(true)
    })
  })

  describe('helpers', () => {
    it('findDropSessionIndex préfère pre_match puis PRIMER', () => {
      const sessions = [
        slot('LOWER_X', { dayPreference: 'early_week' }),
        slot('UPPER_X', { dayPreference: 'mid_week' }),
        slot('FULL_PRIMER_X', { dayPreference: 'late_week' }),
      ]
      expect(findDropSessionIndex(sessions)).toBe(2)
      expect(
        findDropSessionIndex([
          slot('A', { dayPreference: 'early_week' }),
          slot('B', { dayPreference: 'pre_match' }),
        ]),
      ).toBe(1)
    })

    it('lightenResolvedSlot sur séance 2 blocs ne casse pas', () => {
      const s = lightenResolvedSlot(slot('SHORT', { blocks: 2 }))
      expect(s.variant).toBe('light')
    })

    it('effectiveFatigueLevelForTemplates', () => {
      expect(effectiveFatigueLevelForTemplates('very_high', undefined)).toBe('high')
      expect(effectiveFatigueLevelForTemplates('very_high', 'self_manage')).toBe('normal')
      expect(effectiveFatigueLevelForTemplates('high', 'lighten_volume')).toBe('high')
    })

    it('isoWeekMondayKey', () => {
      expect(isoWeekMondayKey('2026-04-15')).toBe('2026-04-13') // mer → lun
      expect(isoWeekMondayKey('2026-04-13')).toBe('2026-04-13')
    })

    it('fatigueLoadChoiceConfirmation justifie chaque choix', async () => {
      const { fatigueLoadChoiceConfirmation } = await import('../fatigueLoadChoice')
      const drop = fatigueLoadChoiceConfirmation('drop_session', 'fr')
      expect(drop.title).toMatch(/Retirer/i)
      expect(drop.body).toMatch(/Primer|Lower/i)
      const light = fatigueLoadChoiceConfirmation('lighten_volume', 'fr')
      expect(light.body).toMatch(/20–30|Gabbett/i)
      const self = fatigueLoadChoiceConfirmation('self_manage', 'fr')
      expect(self.body).toMatch(/risque|autorégul/i)
    })
  })
})

describe('fatigueLoadChoice persistence (jsdom)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('persist + undo dans 24h', async () => {
    // Dynamic import path already loaded; call persist helpers
    const mod = await import('../fatigueLoadChoice')
    mod.persistFatigueLoadDecision({
      weekKey: '2026-04-13',
      zone: 'danger',
      choice: 'lighten_volume',
      chosenAt: new Date().toISOString(),
      acwrRatio: 1.55,
    })
    expect(mod.readFatigueLoadDecisionForDay('2026-04-15')?.choice).toBe('lighten_volume')
    expect(mod.canUndoFatigueLoadDecision('2026-04-15')).toBe(true)
    expect(mod.undoFatigueLoadDecision('2026-04-15')).toBe(true)
    expect(mod.readFatigueLoadDecisionForDay('2026-04-15')).toBeNull()
  })
})
