import { describe, expect, it } from 'vitest'
import { leaguePendingBoardLabel, leagueSoloBoardLabel } from '../leagueSoloCopy'

describe('leagueSoloBoardLabel', () => {
  it('explique le solo uniquement pour 1 membre', () => {
    expect(leagueSoloBoardLabel(1, 'fr')).toMatch(/1 athlète/)
    expect(leagueSoloBoardLabel(2, 'fr')).toBeNull()
    expect(leagueSoloBoardLabel(0, 'en')).toBeNull()
  })
})

describe('leaguePendingBoardLabel', () => {
  it('ne promet plus uniquement le lundi', () => {
    expect(leaguePendingBoardLabel('fr')).not.toMatch(/lundi matin/i)
    expect(leaguePendingBoardLabel('fr')).toMatch(/Club \+ ligue/i)
  })
})
