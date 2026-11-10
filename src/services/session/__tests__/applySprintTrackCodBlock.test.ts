import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { applySprintTrackCodBlock } from '../applySprintTrackCodBlock'

describe('applySprintTrackCodBlock', () => {
  it('ajoute un bloc COD en pré-saison si sprint_track', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_PRESEASON_FORCE_V1
    const out = applySprintTrackCodBlock(structuredClone(raw!), {
      equipment: ['barbell', 'sprint_track'],
      lang: 'fr',
    })
    expect(out.blocks.some((b) => /COD|Accélération/i.test(b.name))).toBe(true)
    expect(out.metadata.reductionOrder?.[0]).toBe(out.blocks[out.blocks.length - 1]?.number)
  })

  it('no-op sans sprint_track', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_PRESEASON_FORCE_V1
    const out = applySprintTrackCodBlock(structuredClone(raw!), {
      equipment: ['barbell'],
      lang: 'fr',
    })
    expect(out.blocks).toHaveLength(raw!.blocks.length)
  })

  it('no-op recovery', () => {
    const raw = MOTHER_SESSIONS_BY_ID.FULL_OFFSEASON_RECOVERY_A_V1
    const out = applySprintTrackCodBlock(structuredClone(raw!), {
      equipment: ['sprint_track'],
      lang: 'fr',
    })
    expect(out.blocks).toHaveLength(raw!.blocks.length)
  })

  it('Full in-season hors match week seulement', () => {
    const raw = MOTHER_SESSIONS_BY_ID.FULL_BODY_IN_SEASON_FRONT_ROW_V1
    const withMatch = applySprintTrackCodBlock(structuredClone(raw!), {
      equipment: ['sprint_track'],
      isMatchWeek: true,
      lang: 'fr',
    })
    expect(withMatch.blocks).toHaveLength(raw!.blocks.length)

    const noMatch = applySprintTrackCodBlock(structuredClone(raw!), {
      equipment: ['sprint_track'],
      isMatchWeek: false,
      lang: 'fr',
    })
    expect(noMatch.blocks.some((b) => /COD/i.test(b.name))).toBe(true)
  })
})
