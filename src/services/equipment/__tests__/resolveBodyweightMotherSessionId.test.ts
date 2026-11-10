import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { CONTENT_FAMILIES, contentFamilyToPositionGroup } from '../../../data/contentFamily'
import { resolveInSeasonUpperSessionId } from '../../../data/resolveInSeasonUpperSessionId'
import {
  parseGymInSeasonFamilyAndLane,
  resolveBodyweightMotherSessionId,
} from '../resolveBodyweightMotherSessionId'
import { mapMotherSessionIdForEquipment } from '../motherSessionEquipmentMap'

describe('resolveBodyweightMotherSessionId', () => {
  it('pack LANDMINE ≠ toujours A (lane 2 → A ; backs LANDMINE lane 0 → A)', () => {
    const pack = parseGymInSeasonFamilyAndLane('UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1')
    expect(pack?.lane).toBe(2)
    expect(pack?.ab).toBe('A')

    const backs = parseGymInSeasonFamilyAndLane('UPPER_IN_SEASON_BACK_THREE_LANDMINE_V1')
    expect(backs?.lane).toBe(0)
    expect(backs?.ab).toBe('A')

    const packChest = parseGymInSeasonFamilyAndLane('UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1')
    expect(packChest?.ab).toBe('B')

    const backsPlyo = parseGymInSeasonFamilyAndLane('UPPER_IN_SEASON_HALF_BACKS_PLYO_V1')
    expect(backsPlyo?.ab).toBe('B')
  })

  it('6 familles → IDs BW Upper/Lower distincts', () => {
    const upper = CONTENT_FAMILIES.map((family) =>
      resolveBodyweightMotherSessionId(
        `UPPER_IN_SEASON_${family === 'front_row' ? 'FRONT_ROW' : family === 'second_row' ? 'SECOND_ROW' : family === 'back_row' ? 'BACK_ROW' : family === 'half_backs' ? 'HALF_BACKS' : family === 'centers' ? 'CENTERS' : 'BACK_THREE'}_V1`,
      ),
    )
    const lower = CONTENT_FAMILIES.map((family) =>
      resolveBodyweightMotherSessionId(
        `LOWER_IN_SEASON_${family === 'front_row' ? 'FRONT_ROW' : family === 'second_row' ? 'SECOND_ROW' : family === 'back_row' ? 'BACK_ROW' : family === 'half_backs' ? 'HALF_BACKS' : family === 'centers' ? 'CENTERS' : 'BACK_THREE'}_V1`,
      ),
    )
    expect(new Set(upper).size).toBe(6)
    expect(new Set(lower).size).toBe(6)
    expect(upper[0]).toBe('UPPER_BW_IN_SEASON_FRONT_ROW_A_V1')
    expect(upper[3]).toBe('UPPER_BW_IN_SEASON_HALF_BACKS_A_V1')
    expect(upper[3]).not.toBe(upper[0])
    expect(lower[4]).not.toBe(lower[5])
  })

  it('half_backs ≠ front_row ; centers ≠ back_three', () => {
    expect(mapMotherSessionIdForEquipment('UPPER_IN_SEASON_HALF_BACKS_V1', [])).toBe(
      'UPPER_BW_IN_SEASON_HALF_BACKS_A_V1',
    )
    expect(mapMotherSessionIdForEquipment('UPPER_IN_SEASON_FRONT_ROW_V1', [])).toBe(
      'UPPER_BW_IN_SEASON_FRONT_ROW_A_V1',
    )
    expect(mapMotherSessionIdForEquipment('UPPER_IN_SEASON_CENTERS_V1', [])).not.toBe(
      mapMotherSessionIdForEquipment('UPPER_IN_SEASON_BACK_THREE_V1', []),
    )
  })

  it('A ≠ B sur 2 blocs Performance (S1–2 vs S3–4)', () => {
    const a = resolveInSeasonUpperSessionId({
      positionGroup: 'back_three',
      contentFamily: 'half_backs',
      mesocycleBlock: 1,
      mesocycleWeek: 1,
      trainingLevel: 'performance',
    })
    const b = resolveInSeasonUpperSessionId({
      positionGroup: 'back_three',
      contentFamily: 'half_backs',
      mesocycleBlock: 1,
      mesocycleWeek: 3,
      trainingLevel: 'performance',
    })
    const bwA = resolveBodyweightMotherSessionId(a)
    const bwB = resolveBodyweightMotherSessionId(b)
    expect(bwA).toMatch(/_A_V1$/)
    expect(bwB).toMatch(/_B_V1$/)
    expect(bwA).not.toBe(bwB)
  })

  it('fallback V1 si parse échoue', () => {
    expect(resolveBodyweightMotherSessionId('UPPER_IN_SEASON_UNKNOWN_WEIRD_V1')).toBe(
      'UPPER_BW_IN_SEASON_V1',
    )
  })

  it('anti-collapse 8 sem. : ≥2 Upper IDs / famille ; backs finisher sans neck', () => {
    for (const family of CONTENT_FAMILIES) {
      const ids = new Set<string>()
      for (let block = 1; block <= 4; block += 1) {
        for (const week of [1, 2, 3, 4] as const) {
          const gymId = resolveInSeasonUpperSessionId({
            positionGroup: contentFamilyToPositionGroup(family),
            contentFamily: family,
            mesocycleBlock: block,
            mesocycleWeek: week,
            trainingLevel: 'performance',
          })
          ids.add(resolveBodyweightMotherSessionId(gymId))
        }
      }
      // 8 sem. Performance = 4 lanes → 2 parités A/B
      expect(ids.size, family).toBeGreaterThanOrEqual(2)

      if (family === 'half_backs' || family === 'centers' || family === 'back_three') {
        for (const id of ids) {
          const session = MOTHER_SESSIONS_BY_ID[id]
          expect(session, id).toBeTruthy()
          const finisher = session!.blocks.find((b) => /finisher/i.test(b.name))
          expect(finisher, id).toBeTruthy()
          const names = finisher!.exercises.map((e) => e.name).join(' ').toLowerCase()
          expect(names, id).not.toMatch(/neck/)
          expect(names, id).not.toMatch(/suitcase/)
        }
      }
    }
  })

  it('A ≠ B sur contraste ou block 2 (pas finisher seul) — half_backs', () => {
    const a = MOTHER_SESSIONS_BY_ID.UPPER_BW_IN_SEASON_HALF_BACKS_A_V1
    const b = MOTHER_SESSIONS_BY_ID.UPPER_BW_IN_SEASON_HALF_BACKS_B_V1
    expect(a && b).toBeTruthy()
    const sig = (s: typeof a) =>
      s!.blocks
        .slice(0, 2)
        .flatMap((bl) => bl.exercises.map((e) => e.name))
        .join('|')
    expect(sig(a)).not.toBe(sig(b))
  })
})
