import { describe, expect, it } from 'vitest'
import {
  findGlossaryMatches,
  formatPrescriptionDisplay,
  sessionTypePlayerLabel,
  TRAINING_GLOSSARY,
} from '../trainingGlossary'

describe('trainingGlossary', () => {
  it('covers beginner jargon terms', () => {
    const ids = TRAINING_GLOSSARY.map((e) => e.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'rer',
        'percent_max',
        'emom',
        'rdl',
        'lower',
        'quad_ham',
      ]),
    )
  })

  it('finds RER / % / EMOM / RDL / quad:ham in prescription text', () => {
    const matches = findGlossaryMatches('3x5 @ 80-85% RER 2-3 · RDL · EMOM · quad:ham')
    expect(matches.map((m) => m.id).sort()).toEqual(
      ['emom', 'percent_max', 'quad_ham', 'rdl', 'rer'].sort(),
    )
  })

  it('replaces % with RER cue on Foundations display only', () => {
    expect(formatPrescriptionDisplay('3x5 @ 80-85%', { foundations: true }).label).toBe(
      '3x5 @ RER 2–3 (sans max connu)',
    )
    expect(formatPrescriptionDisplay('3x5 @ 80-85%', { foundations: false }).label).toBe(
      '3x5 @ 80-85%',
    )
  })

  it('Fondations : glossaryKeys suit le label (RER), pas le % brut', () => {
    const formatted = formatPrescriptionDisplay('3x5 @ 80-85%', { foundations: true })
    expect(formatted.glossaryKeys).toContain('rer')
    expect(formatted.glossaryKeys).not.toContain('percent_max')
  })

  it('hors Fondations : % reste le terme glossaire', () => {
    const formatted = formatPrescriptionDisplay('3x5 @ 80-85%', { foundations: false })
    expect(formatted.glossaryKeys).toContain('percent_max')
  })

  it('maps session types to player FR labels', () => {
    expect(sessionTypePlayerLabel('lower')).toBe('Bas du corps')
    expect(sessionTypePlayerLabel('full_light_primer')).toBe('Activation')
    expect(sessionTypePlayerLabel('full')).toBe('Complète')
  })
})
