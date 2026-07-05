import { describe, expect, it } from 'vitest'
import {
  parseExerciseInputNumber,
  sanitizeDecimalInput,
} from '../parseExerciseInputNumber'

describe('parseExerciseInputNumber', () => {
  it('accepte les décimales avec point', () => {
    expect(parseExerciseInputNumber('82.5')).toBe(82.5)
  })

  it('accepte les décimales avec virgule FR', () => {
    expect(parseExerciseInputNumber('82,5')).toBe(82.5)
  })

  it('sanitizeDecimalInput normalise la virgule', () => {
    expect(sanitizeDecimalInput('82,5')).toBe('82.5')
  })

  it('sanitizeDecimalInput garde un seul séparateur décimal', () => {
    expect(sanitizeDecimalInput('82.5.5')).toBe('82.55')
  })
})
