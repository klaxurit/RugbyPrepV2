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
  it('autorise record, session et match ; pas progression', () => {
    expect(shareCardAllowsSquare('record')).toBe(true)
    expect(shareCardAllowsSquare('session')).toBe(true)
    expect(shareCardAllowsSquare('match')).toBe(true)
    expect(shareCardAllowsSquare('progression')).toBe(false)
  })
})

describe('resolveShareCardFormat', () => {
  it('force story pour progression même si préférence carré', () => {
    expect(resolveShareCardFormat('progression', 'square')).toBe('story')
    expect(resolveShareCardFormat('progression', null)).toBe('story')
  })

  it('auto = square pour record / session, story pour match', () => {
    expect(resolveShareCardFormat('record')).toBe('square')
    expect(resolveShareCardFormat('session', null)).toBe('square')
    expect(resolveShareCardFormat('match', null)).toBe('story')
  })

  it('respecte la préférence UI quand le héros autorise le carré', () => {
    expect(resolveShareCardFormat('record', 'story')).toBe('story')
    expect(resolveShareCardFormat('session', 'square')).toBe('square')
    expect(resolveShareCardFormat('match', 'square')).toBe('square')
    expect(resolveShareCardFormat('match', 'story')).toBe('story')
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
