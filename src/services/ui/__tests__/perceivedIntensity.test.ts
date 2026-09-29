import { describe, expect, it } from 'vitest'
import {
  clampPerceivedIntensity,
  perceivedIntensityLabel,
} from '../perceivedIntensity'

describe('perceivedIntensity', () => {
  it('borne entre 1 et 10', () => {
    expect(clampPerceivedIntensity(0)).toBe(1)
    expect(clampPerceivedIntensity(11)).toBe(10)
    expect(clampPerceivedIntensity(7.4)).toBe(7)
  })

  it('libellés FR/EN sans jargon RPE', () => {
    expect(perceivedIntensityLabel(7, 'fr')).toBe('Dur')
    expect(perceivedIntensityLabel(10, 'en')).toBe('Maximal')
  })
})
