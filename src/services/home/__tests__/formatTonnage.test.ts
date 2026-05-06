import { describe, expect, it } from 'vitest'
import { formatTonnage } from '../formatTonnage'

describe('formatTonnage', () => {
  it('zero / negative / NaN → "0 kg"', () => {
    expect(formatTonnage(0)).toBe('0 kg')
    expect(formatTonnage(-100)).toBe('0 kg')
    expect(formatTonnage(NaN)).toBe('0 kg')
  })

  it('< 1000 kg : valeur entière + " kg"', () => {
    expect(formatTonnage(500)).toBe('500 kg')
    expect(formatTonnage(980)).toBe('980 kg')
    expect(formatTonnage(999)).toBe('999 kg')
  })

  it('1K → 9.9K : 1 décimale (sans .0)', () => {
    expect(formatTonnage(1000)).toBe('1K kg')
    expect(formatTonnage(1500)).toBe('1.5K kg')
    expect(formatTonnage(2740)).toBe('2.7K kg')
    expect(formatTonnage(9900)).toBe('9.9K kg')
  })

  it('10K → 999K : entier', () => {
    expect(formatTonnage(10000)).toBe('10K kg')
    expect(formatTonnage(12345)).toBe('12K kg')
    expect(formatTonnage(123456)).toBe('123K kg')
    expect(formatTonnage(999000)).toBe('999K kg')
  })

  it('>= 1M : "X.YM" ou "XM"', () => {
    expect(formatTonnage(1_000_000)).toBe('1M kg')
    expect(formatTonnage(1_500_000)).toBe('1.5M kg')
    expect(formatTonnage(12_300_000)).toBe('12.3M kg')
  })
})
