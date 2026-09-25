import { describe, expect, it } from 'vitest'
import type { Block } from '../../types/motherSession'
import { buildEmomRecapFields } from '../buildEmomRecapFields'

const emomBlock: Block = {
  number: 4,
  name: 'Rugby Finisher',
  format: "`EMOM 8'`",
  exercises: [
    {
      name: 'Sled Push',
      exerciseId: 'sled__push__standard',
      prescription: '15-20m',
      slotLabel: 'Min 1, 3, 5, 7',
    },
    {
      name: 'Copenhagen Hold',
      exerciseId: 'groin_adductors__copenhagen_plank__long',
      prescription: '15-20s/side',
      slotLabel: 'Min 2, 4, 6, 8',
    },
    {
      name: 'Sled Push',
      exerciseId: 'sled__push__standard',
      prescription: '15-20m',
      slotLabel: 'Min 3',
    },
  ],
  coachingNotes: [],
}

describe('buildEmomRecapFields', () => {
  it('déduplique par exerciseId (une ligne par exo du pattern)', () => {
    const fields = buildEmomRecapFields(emomBlock)
    expect(fields).toHaveLength(2)
    expect(fields.map((f) => f.exerciseId)).toEqual([
      'sled__push__standard',
      'groin_adductors__copenhagen_plank__long',
    ])
  })

  it('propose kg + mètres pour un sled, secondes pour un hold', () => {
    const fields = buildEmomRecapFields(emomBlock)
    const sled = fields.find((f) => f.exerciseId === 'sled__push__standard')!
    const copenhagen = fields.find(
      (f) => f.exerciseId === 'groin_adductors__copenhagen_plank__long',
    )!

    expect(sled.metricType).toBe('meters')
    expect(sled.alsoAskLoadKg).toBe(true)
    expect(copenhagen.metricType).toBe('seconds')
    expect(copenhagen.alsoAskLoadKg).toBe(false)
  })

  it('préremplit depuis l’historique par exerciseId', () => {
    const previous = new Map([
      ['sled__push__standard', { loadKg: 40, meters: 20 }],
      ['groin_adductors__copenhagen_plank__long', { seconds: 18 }],
    ])
    const fields = buildEmomRecapFields(emomBlock, previous)
    expect(fields[0].previous).toEqual({ loadKg: 40, meters: 20 })
    expect(fields[1].previous).toEqual({ seconds: 18 })
  })
})
