import { describe, expect, it } from 'vitest'
import {
  contentFamilyLabel,
  contentFamilyToPositionGroup,
  resolveContentFamily,
  scrubPlayerFacingPositionCopy,
} from '../contentFamily'
import { resolveInSeasonLowerSessionId } from '../resolveInSeasonLowerSessionId'
import { resolveInSeasonUpperSessionId } from '../resolveInSeasonUpperSessionId'
import { MOTHER_SESSIONS_BY_ID } from '../motherSessions.generated'

describe('resolveContentFamily', () => {
  it.each([
    ['PROP', 'front_row', 'front_row'],
    ['HOOKER', 'front_row', 'front_row'],
    ['FRONT_ROW', 'front_row', 'front_row'],
    ['SECOND_ROW', 'second_row', 'front_row'],
    ['BACK_ROW', 'back_row', 'front_row'],
    ['HALF_BACKS', 'half_backs', 'back_three'],
    ['CENTERS', 'centers', 'back_three'],
    ['BACK_THREE', 'back_three', 'back_three'],
  ] as const)('%s → family %s / planning %s', (pos, family, group) => {
    const r = resolveContentFamily(pos)
    expect(r.family).toBe(family)
    expect(contentFamilyToPositionGroup(r.family)).toBe(group)
    expect(r.warning).toBeUndefined()
  })

  it('position legacy seul', () => {
    expect(resolveContentFamily(null, 'BACK_ROW').family).toBe('back_row')
  })

  it('absent → back_three + warning', () => {
    const r = resolveContentFamily(null, null)
    expect(r.family).toBe('back_three')
    expect(r.warning).toBeTruthy()
  })

  it('libellés joueur sans id technique', () => {
    expect(contentFamilyLabel('back_row', 'fr')).toBe('3ème ligne')
    expect(contentFamilyLabel('back_row', 'fr')).not.toMatch(/BACK_ROW/)
    expect(contentFamilyLabel('back_three', 'fr')).toBe('Arrières')
  })

  it('scrubPlayerFacingPositionCopy : tokens techniques → poste joueur', () => {
    expect(scrubPlayerFacingPositionCopy('BACK_ROW Finisher', 'fr')).toBe('3ème ligne Finisher')
    expect(scrubPlayerFacingPositionCopy('Back Row accent', 'fr')).toBe('3ème ligne accent')
    expect(scrubPlayerFacingPositionCopy('for back_row.', 'fr')).toBe('for 3ème ligne.')
    expect(scrubPlayerFacingPositionCopy('HALF BACKS Finisher', 'fr')).toBe('Demis Finisher')
    expect(scrubPlayerFacingPositionCopy('CENTERS Finisher', 'fr')).toBe('Centres Finisher')
    expect(scrubPlayerFacingPositionCopy('BACK_ROW', 'fr')).not.toMatch(/BACK_ROW/)
  })
})

describe('mothers multi-familles sans accent', () => {
  const families = [
    'front_row',
    'second_row',
    'back_row',
    'half_backs',
    'centers',
    'back_three',
  ] as const

  it('Lower lane 0 : 6 finishers / contenus distincts', () => {
    const signatures = families.map((family) => {
      const id = resolveInSeasonLowerSessionId({
        positionGroup: contentFamilyToPositionGroup(family),
        contentFamily: family,
        mesocycleBlock: 1,
        mesocycleWeek: 1,
        trainingLevel: 'performance',
      })
      const s = MOTHER_SESSIONS_BY_ID[id]
      expect(s, id).toBeTruthy()
      const finisher = s!.blocks.find((b) => /finisher/i.test(b.name))
      expect(finisher, id).toBeTruthy()
      return finisher!.exercises.map((e) => `${e.name}|${e.prescription}`).join('||')
    })
    expect(new Set(signatures).size).toBe(6)
  })

  it('Upper lane 0 Performance : IDs famille distincts + B contrastent entre lanes', () => {
    const ids = families.map((family) =>
      resolveInSeasonUpperSessionId({
        positionGroup: contentFamilyToPositionGroup(family),
        contentFamily: family,
        mesocycleBlock: 1,
        mesocycleWeek: 1,
        trainingLevel: 'performance',
      }),
    )
    expect(new Set(ids).size).toBe(6)
    for (const id of ids) {
      expect(MOTHER_SESSIONS_BY_ID[id], id).toBeTruthy()
    }

    const b0 = MOTHER_SESSIONS_BY_ID[
      resolveInSeasonUpperSessionId({
        positionGroup: 'front_row',
        contentFamily: 'back_row',
        mesocycleBlock: 1,
        mesocycleWeek: 1,
        trainingLevel: 'performance',
      })
    ]!.blocks[0].exercises[1]?.name
    const b1 = MOTHER_SESSIONS_BY_ID[
      resolveInSeasonUpperSessionId({
        positionGroup: 'front_row',
        contentFamily: 'back_row',
        mesocycleBlock: 1,
        mesocycleWeek: 3,
        trainingLevel: 'performance',
      })
    ]!.blocks[0].exercises[1]?.name
    expect(b0).toBeTruthy()
    expect(b1).toBeTruthy()
    expect(b0).not.toBe(b1)
  })

  it('cadence Performance 0,0,1,1,2,2,3,3 sur Upper BACK_ROW', () => {
    const seq: number[] = []
    for (let block = 1; block <= 4; block += 1) {
      for (const week of [1, 2, 3, 4] as const) {
        const id = resolveInSeasonUpperSessionId({
          positionGroup: 'front_row',
          contentFamily: 'back_row',
          mesocycleBlock: block,
          mesocycleWeek: week,
          trainingLevel: 'performance',
        })
        if (id.includes('CHESTPASS')) seq.push(1)
        else if (id.includes('LANDMINE') && !id.includes('SUPINE')) seq.push(2)
        else if (id.includes('SUPINE')) seq.push(3)
        else seq.push(0)
      }
    }
    // S4 deload still advances lane index via meso week — plan: 0,0,1,1 per block
    expect(seq.slice(0, 4)).toEqual([0, 0, 1, 1])
    expect(seq.slice(4, 8)).toEqual([2, 2, 3, 3])
  })
})
