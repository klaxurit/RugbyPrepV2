import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import {
  applyBenchWavePrescription,
  benchWavePrescription,
  resolveBenchWavePhase,
} from '../applyBenchWavePrescription'
import { prepareSessionForRender } from '../prepareSessionForRender'
import { GYM_PRESET } from '../../equipment/equipmentPresets'

describe('resolveBenchWavePhase', () => {
  it('S1–S4 hors match', () => {
    expect(resolveBenchWavePhase({ mesocycleWeek: 1 })).toBe('force')
    expect(resolveBenchWavePhase({ mesocycleWeek: 2 })).toBe('volume')
    expect(resolveBenchWavePhase({ mesocycleWeek: 3 })).toBe('speed')
    expect(resolveBenchWavePhase({ mesocycleWeek: 4 })).toBe('deload')
  })

  it('match week : jamais VOLUME — SPEED sauf pre_match/J-2 → DELOAD', () => {
    expect(
      resolveBenchWavePhase({ mesocycleWeek: 2, isMatchWeek: true }),
    ).toBe('speed')
    expect(
      resolveBenchWavePhase({
        mesocycleWeek: 2,
        isMatchWeek: true,
        dayPreference: 'pre_match',
      }),
    ).toBe('deload')
    expect(
      resolveBenchWavePhase({
        mesocycleWeek: 1,
        isMatchWeek: true,
        preMatchNoHeavy: true,
      }),
    ).toBe('deload')
  })

  it('isDeloadWeek force deload même S2', () => {
    expect(
      resolveBenchWavePhase({ mesocycleWeek: 2, isDeloadWeek: true }),
    ).toBe('deload')
  })
})

describe('applyBenchWavePrescription', () => {
  const pack = MOTHER_SESSIONS_BY_ID.UPPER_IN_SEASON_FRONT_ROW_V1
  const backs = MOTHER_SESSIONS_BY_ID.UPPER_IN_SEASON_BACK_THREE_V1

  it('pack S1 ≠ S2 ≠ S3 — même nom Bench', () => {
    expect(pack).toBeTruthy()
    const s1 = applyBenchWavePrescription(structuredClone(pack!), {
      mesocycleWeek: 1,
      rugbyPosition: 'PROP',
    })
    const s2 = applyBenchWavePrescription(structuredClone(pack!), {
      mesocycleWeek: 2,
      rugbyPosition: 'PROP',
    })
    const s3 = applyBenchWavePrescription(structuredClone(pack!), {
      mesocycleWeek: 3,
      rugbyPosition: 'PROP',
    })
    const rx = (s: typeof s1) =>
      s.blocks.flatMap((b) => b.exercises).find((e) => /bench/i.test(e.name))!
    expect(rx(s1).name).toMatch(/bench/i)
    expect(rx(s1).name).toBe(rx(s2).name)
    expect(rx(s1).prescription).toBe(benchWavePrescription('force', 'pack'))
    expect(rx(s2).prescription).toBe(benchWavePrescription('volume', 'pack'))
    expect(rx(s3).prescription).toBe(benchWavePrescription('speed', 'pack'))
    expect(rx(s1).prescription).not.toBe(rx(s2).prescription)
  })

  it('backs S1 ≠ pack S1', () => {
    expect(backs).toBeTruthy()
    const packRx = applyBenchWavePrescription(structuredClone(pack!), {
      mesocycleWeek: 1,
      rugbyPosition: 'PROP',
    })
      .blocks.flatMap((b) => b.exercises)
      .find((e) => /bench/i.test(e.name))!.prescription
    const backsRx = applyBenchWavePrescription(structuredClone(backs!), {
      mesocycleWeek: 1,
      rugbyPosition: 'BACK_THREE',
    })
      .blocks.flatMap((b) => b.exercises)
      .find((e) => /bench/i.test(e.name))!.prescription
    expect(backsRx).toBe(benchWavePrescription('force', 'backs'))
    expect(backsRx).not.toBe(packRx)
  })

  it('match week S2 → speed (pas volume)', () => {
    const out = applyBenchWavePrescription(structuredClone(pack!), {
      mesocycleWeek: 2,
      isMatchWeek: true,
      dayPreference: 'mid_week',
      rugbyPosition: 'PROP',
    })
    const rx = out.blocks
      .flatMap((b) => b.exercises)
      .find((e) => /bench/i.test(e.name))!.prescription
    expect(rx).toBe(benchWavePrescription('speed', 'pack'))
  })

  it('BW / Primer : no-op', () => {
    const bw = MOTHER_SESSIONS_BY_ID.UPPER_BW_IN_SEASON_FRONT_ROW_A_V1
    expect(bw).toBeTruthy()
    const clone = structuredClone(bw!)
    expect(
      applyBenchWavePrescription(clone, { mesocycleWeek: 2, rugbyPosition: 'PROP' }),
    ).toBe(clone)

    const primer = MOTHER_SESSIONS_BY_ID.FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1
    const pClone = structuredClone(primer!)
    expect(
      applyBenchWavePrescription(pClone, { mesocycleWeek: 1 }),
    ).toBe(pClone)
  })

  it('prepareSessionForRender applique la vague', () => {
    const prepared = prepareSessionForRender({
      session: structuredClone(pack!),
      trainingLevel: 'performance',
      equipment: [...GYM_PRESET],
      lang: 'en',
      mesocycleWeek: 3,
      rugbyPosition: 'PROP',
    })
    const rx = prepared.blocks
      .flatMap((b) => b.exercises)
      .find((e) => /bench/i.test(e.name))!.prescription
    expect(rx).toBe(benchWavePrescription('speed', 'pack'))
  })
})
