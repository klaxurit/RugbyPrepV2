import { describe, expect, it } from 'vitest'
import {
  resolveShareCardFormat,
  shareCardAllowsSquare,
  shareCardDimensions,
} from '../resolveShareCardFormat'
import {
  SESSION_SHARE_HEIGHT,
  SESSION_SHARE_SQUARE_HEIGHT,
  SESSION_SHARE_WIDTH,
} from '../sessionShareTypes'

describe('shareCardAllowsSquare', () => {
  it('autorise record et session uniquement', () => {
    expect(shareCardAllowsSquare('record')).toBe(true)
    expect(shareCardAllowsSquare('session')).toBe(true)
    expect(shareCardAllowsSquare('match')).toBe(false)
    expect(shareCardAllowsSquare('progression')).toBe(false)
  })
})

describe('resolveShareCardFormat', () => {
  it('force story pour match / progression', () => {
    expect(resolveShareCardFormat('match', 'square')).toBe('story')
    expect(resolveShareCardFormat('progression', 'square')).toBe('story')
    expect(resolveShareCardFormat('match', null)).toBe('story')
  })

  it('auto = square pour record / session', () => {
    expect(resolveShareCardFormat('record')).toBe('square')
    expect(resolveShareCardFormat('session', null)).toBe('square')
  })

  it('respecte la préférence UI quand le héros autorise le carré', () => {
    expect(resolveShareCardFormat('record', 'story')).toBe('story')
    expect(resolveShareCardFormat('session', 'square')).toBe('square')
  })
})

describe('shareCardDimensions', () => {
  it('retourne 1080×1920 ou 1080×1080', () => {
    expect(shareCardDimensions('story')).toEqual({
      width: SESSION_SHARE_WIDTH,
      height: SESSION_SHARE_HEIGHT,
    })
    expect(shareCardDimensions('square')).toEqual({
      width: SESSION_SHARE_WIDTH,
      height: SESSION_SHARE_SQUARE_HEIGHT,
    })
  })
})
