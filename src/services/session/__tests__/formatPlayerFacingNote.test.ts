import { describe, expect, it } from 'vitest'
import {
  exerciseDisplayLabels,
  formatPlayerFacingNote,
} from '../formatPlayerFacingNote'

describe('formatPlayerFacingNote', () => {
  it('retire les backticks et remplace ->', () => {
    expect(formatPlayerFacingNote('Garde `Hip Thrust` bas -> extension')).toBe(
      'Garde Hip Thrust bas → extension',
    )
  })

  it('renomme Transfer en Transfert (FR)', () => {
    expect(formatPlayerFacingNote('Transfer mêlée direct', 'fr')).toBe(
      'Transfert mêlée direct',
    )
  })
})

describe('exerciseDisplayLabels', () => {
  it('ajoute un sous-titre FR pour RDL / hip thrust', () => {
    expect(exerciseDisplayLabels('RDL', 'fr').subtitle).toMatch(/jambes tendues/i)
    expect(exerciseDisplayLabels('Hip Thrust', 'fr').subtitle).toMatch(/hanche/i)
  })
})
