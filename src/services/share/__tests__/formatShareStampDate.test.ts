import { describe, expect, it } from 'vitest'
import { formatShareStampDate, formatShareTicketDate } from '../formatShareStampDate'

describe('formatShareStampDate', () => {
  it('formate DD · MM · YY', () => {
    expect(formatShareStampDate('2026-11-10')).toBe('10 · 11 · 26')
    expect(formatShareStampDate('2026-05-08')).toBe('08 · 05 · 26')
  })

  it('refuse les valeurs invalides', () => {
    expect(formatShareStampDate(null)).toBeNull()
    expect(formatShareStampDate('')).toBeNull()
    expect(formatShareStampDate('vendredi')).toBeNull()
  })
})

describe('formatShareTicketDate', () => {
  it('formate DD.MM.YY', () => {
    expect(formatShareTicketDate('2026-05-08')).toBe('08.05.26')
  })
})
