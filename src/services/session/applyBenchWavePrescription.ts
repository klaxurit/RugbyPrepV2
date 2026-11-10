/**
 * Vague Bench in-season (overlay A) — même exo, prescription selon mésocycle.
 * Match week : SPEED ou DELOAD seulement (jamais VOLUME), via dayPreference / J-2.
 */

import type { MotherSession } from '../../types/motherSession'
import {
  contentFamilyCluster,
  resolveContentFamily,
  type ContentFamily,
} from '../../data/contentFamily'

export type BenchWavePhase = 'force' | 'volume' | 'speed' | 'deload'

export type BenchWaveDayPreference =
  | 'early_week'
  | 'mid_week'
  | 'late_week'
  | 'pre_match'

export type BenchWaveCluster = 'pack' | 'backs'

const PACK_RX: Record<BenchWavePhase, string> = {
  force: '4x3-4 @ 82-87%',
  volume: '4x5 @ 75-80%',
  speed: '5x2-3 @ 70-75%',
  deload: '3x3 @ 70%',
}

const BACKS_RX: Record<BenchWavePhase, string> = {
  force: '4x3 @ 80-85%',
  volume: '4x4-5 @ 75-80%',
  speed: '5x2-3 @ 70-75%',
  deload: '3x3 @ 70%',
}

const PHASE_LABEL_FR: Record<BenchWavePhase, string> = {
  force: 'Vague force',
  volume: 'Vague volume',
  speed: 'Vague vitesse',
  deload: 'Vague décharge',
}

const PHASE_LABEL_EN: Record<BenchWavePhase, string> = {
  force: 'Force wave',
  volume: 'Volume wave',
  speed: 'Speed wave',
  deload: 'Deload wave',
}

const FAMILY_FROM_ID: Record<string, ContentFamily> = {
  FRONT_ROW: 'front_row',
  SECOND_ROW: 'second_row',
  BACK_ROW: 'back_row',
  HALF_BACKS: 'half_backs',
  CENTERS: 'centers',
  BACK_THREE: 'back_three',
}

function familyFromSessionId(id: string): ContentFamily | null {
  const m = id.match(
    /^UPPER_IN_SEASON_(FRONT_ROW|SECOND_ROW|BACK_ROW|HALF_BACKS|CENTERS|BACK_THREE)/i,
  )
  if (!m) return null
  return FAMILY_FROM_ID[m[1].toUpperCase()] ?? null
}

function isBenchExercise(exo: { name: string; exerciseId?: string | null }): boolean {
  const id = exo.exerciseId ?? ''
  if (/bench_press|bench__press/i.test(id)) return true
  return /^(bench\s*press|développé\s*couché)$/i.test(exo.name.trim())
}

function basePhaseFromWeek(week: 1 | 2 | 3 | 4): BenchWavePhase {
  if (week === 1) return 'force'
  if (week === 2) return 'volume'
  if (week === 3) return 'speed'
  return 'deload'
}

/**
 * Résout la phase vague. Match week / J-2 : jamais VOLUME.
 * `pre_match` ou `preMatchNoHeavy` → DELOAD ; sinon match week → SPEED.
 */
export function resolveBenchWavePhase(params: {
  mesocycleWeek: 1 | 2 | 3 | 4
  isDeloadWeek?: boolean
  isMatchWeek?: boolean
  preMatchNoHeavy?: boolean
  dayPreference?: BenchWaveDayPreference | null
}): BenchWavePhase {
  if (params.isDeloadWeek || params.mesocycleWeek === 4) return 'deload'

  const nearMatch =
    params.preMatchNoHeavy === true || params.dayPreference === 'pre_match'
  const matchWeek = params.isMatchWeek === true || nearMatch

  if (matchWeek) {
    return nearMatch ? 'deload' : 'speed'
  }

  return basePhaseFromWeek(params.mesocycleWeek)
}

export function benchWavePrescription(
  phase: BenchWavePhase,
  cluster: BenchWaveCluster,
): string {
  return (cluster === 'pack' ? PACK_RX : BACKS_RX)[phase]
}

export function benchWaveLabel(phase: BenchWavePhase, lang: 'fr' | 'en' = 'fr'): string {
  return lang === 'en' ? PHASE_LABEL_EN[phase] : PHASE_LABEL_FR[phase]
}

function resolveCluster(opts: {
  contentFamily?: ContentFamily | null
  rugbyPosition?: string | null
  sessionId: string
}): BenchWaveCluster {
  const family =
    opts.contentFamily ??
    familyFromSessionId(opts.sessionId) ??
    (opts.rugbyPosition ? resolveContentFamily(opts.rugbyPosition).family : null)
  if (family) return contentFamilyCluster(family)
  return 'backs'
}

export function isBenchWaveEligible(session: MotherSession): boolean {
  const eq = session.metadata.equipment
  if (!/full_gym/i.test(eq)) return false
  if (session.metadata.sessionType !== 'upper') return false
  if (!/_IN_SEASON_/i.test(session.metadata.id)) return false
  if (/_BW_/i.test(session.metadata.id)) return false
  return session.blocks.some((b) => b.exercises.some((e) => isBenchExercise(e)))
}

export function applyBenchWavePrescription(
  session: MotherSession,
  opts: {
    mesocycleWeek: 1 | 2 | 3 | 4
    lang?: 'fr' | 'en'
    isDeloadWeek?: boolean
    isMatchWeek?: boolean
    preMatchNoHeavy?: boolean
    dayPreference?: BenchWaveDayPreference | null
    contentFamily?: ContentFamily | null
    rugbyPosition?: string | null
  },
): MotherSession {
  if (!isBenchWaveEligible(session)) return session

  const phase = resolveBenchWavePhase({
    mesocycleWeek: opts.mesocycleWeek,
    isDeloadWeek: opts.isDeloadWeek,
    isMatchWeek: opts.isMatchWeek,
    preMatchNoHeavy: opts.preMatchNoHeavy,
    dayPreference: opts.dayPreference,
  })
  const cluster = resolveCluster({
    contentFamily: opts.contentFamily,
    rugbyPosition: opts.rugbyPosition,
    sessionId: session.metadata.id,
  })
  const rx = benchWavePrescription(phase, cluster)
  const lang = opts.lang ?? 'fr'
  const waveNote =
    lang === 'en'
      ? `${benchWaveLabel(phase, 'en')} (S${opts.mesocycleWeek}) — same Bench, waved load.`
      : `${benchWaveLabel(phase, 'fr')} (S${opts.mesocycleWeek}) — même Bench, charge ondulée.`

  let changed = false
  const blocks = session.blocks.map((block) => {
    let blockTouched = false
    const exercises = block.exercises.map((exo) => {
      if (!isBenchExercise(exo)) return exo
      if (exo.prescription === rx) return exo
      blockTouched = true
      changed = true
      return { ...exo, prescription: rx }
    })
    if (!blockTouched) return block
    const notes = [...(block.coachingNotes ?? [])]
    if (!notes.some((n) => /vague|wave/i.test(n))) {
      notes.unshift(waveNote)
    }
    return { ...block, exercises, coachingNotes: notes }
  })

  return changed ? { ...session, blocks } : session
}
