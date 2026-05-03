import { describe, it, expect } from 'vitest'
import { parseExerciseSetSpec } from '../exerciseSetSpec'

describe('parseExerciseSetSpec — reps', () => {
  it('parses "4x6"', () => {
    expect(parseExerciseSetSpec('4x6')).toEqual({
      kind: 'reps',
      sets: 4,
      repsLow: 6,
      repsHigh: 6,
      perSide: false,
    })
  })

  it('parses range reps "3x8-10"', () => {
    expect(parseExerciseSetSpec('3x8-10')).toEqual({
      kind: 'reps',
      sets: 3,
      repsLow: 8,
      repsHigh: 10,
      perSide: false,
    })
  })

  it('parses range sets "2-3x6-8"', () => {
    expect(parseExerciseSetSpec('2-3x6-8')).toMatchObject({
      kind: 'reps',
      sets: 3,
      repsLow: 6,
      repsHigh: 8,
    })
  })

  it('parses "/côté"', () => {
    expect(parseExerciseSetSpec('3x8/côté')).toMatchObject({
      kind: 'reps',
      sets: 3,
      perSide: true,
    })
  })

  it('parses "/side"', () => {
    expect(parseExerciseSetSpec('3x8/side')).toMatchObject({
      kind: 'reps',
      perSide: true,
    })
  })

  it('parses %1RM annotation by ignoring it', () => {
    expect(parseExerciseSetSpec('4x4-5 @ 85-90%')).toMatchObject({
      kind: 'reps',
      sets: 4,
      repsLow: 4,
      repsHigh: 5,
    })
  })

  it('parses parenthesis annotation by stripping it', () => {
    expect(parseExerciseSetSpec('2x5 (5s per position: T, Y, I)')).toMatchObject({
      kind: 'reps',
      sets: 2,
      repsLow: 5,
      repsHigh: 5,
    })
  })

  it('parses bare reps "10-12 reps"', () => {
    expect(parseExerciseSetSpec('10-12 reps')).toMatchObject({
      kind: 'reps',
      sets: 1,
      repsLow: 10,
      repsHigh: 12,
    })
  })
})

describe('parseExerciseSetSpec — time', () => {
  it('parses "2x30s"', () => {
    expect(parseExerciseSetSpec('2x30s')).toEqual({
      kind: 'time',
      sets: 2,
      durationLow: 30,
      durationHigh: 30,
      perSide: false,
      perDirection: false,
    })
  })

  it('parses range "2x20-30s"', () => {
    expect(parseExerciseSetSpec('2x20-30s')).toMatchObject({
      kind: 'time',
      durationLow: 20,
      durationHigh: 30,
    })
  })

  it('parses "/côté" → perSide=true', () => {
    expect(parseExerciseSetSpec('3x15-20s/côté')).toMatchObject({
      kind: 'time',
      sets: 3,
      durationLow: 15,
      durationHigh: 20,
      perSide: true,
      perDirection: false,
    })
  })

  it('parses "/side"', () => {
    expect(parseExerciseSetSpec('2x20-30s/side')).toMatchObject({
      kind: 'time',
      perSide: true,
    })
  })

  it('parses "/direction" → perDirection=true', () => {
    expect(parseExerciseSetSpec('2x10s/direction')).toMatchObject({
      kind: 'time',
      sets: 2,
      durationLow: 10,
      durationHigh: 10,
      perDirection: true,
    })
  })

  it('parses minutes', () => {
    expect(parseExerciseSetSpec('4x4min')).toMatchObject({
      kind: 'time',
      sets: 4,
      durationLow: 240,
      durationHigh: 240,
    })
  })

  it('parses bare time range "20-30s"', () => {
    expect(parseExerciseSetSpec('20-30s')).toMatchObject({
      kind: 'time',
      sets: 1,
      durationLow: 20,
      durationHigh: 30,
    })
  })

  it('parses bare time "20-30s/side"', () => {
    expect(parseExerciseSetSpec('20-30s/side')).toMatchObject({
      kind: 'time',
      durationLow: 20,
      durationHigh: 30,
      perSide: true,
    })
  })
})

describe('parseExerciseSetSpec — distance', () => {
  it('parses "20m"', () => {
    expect(parseExerciseSetSpec('20m')).toMatchObject({
      kind: 'distance',
      distanceLow: 20,
      distanceHigh: 20,
    })
  })

  it('parses "2-3x10-15m"', () => {
    expect(parseExerciseSetSpec('2-3x10-15m')).toMatchObject({
      kind: 'distance',
      sets: 3,
      distanceLow: 10,
      distanceHigh: 15,
    })
  })

  it('parses "20m/side"', () => {
    expect(parseExerciseSetSpec('20m/side')).toMatchObject({
      kind: 'distance',
      perSide: true,
    })
  })
})

describe('parseExerciseSetSpec — unknown / directive', () => {
  it('returns unknown for "2 progressive sets"', () => {
    expect(parseExerciseSetSpec('2 progressive sets')).toEqual({ kind: 'unknown' })
  })

  it('returns unknown for empty', () => {
    expect(parseExerciseSetSpec('')).toEqual({ kind: 'unknown' })
  })

  it('returns unknown for unparseable text', () => {
    expect(parseExerciseSetSpec('depends on tolerance')).toEqual({ kind: 'unknown' })
  })
})
