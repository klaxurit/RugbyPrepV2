import { describe, expect, it } from 'vitest'
import { calendarRowToEvent } from '../calendarRowToEvent'

describe('calendarRowToEvent', () => {
  it('includes journee_name and match_status from match_calendar row', () => {
    const event = calendarRowToEvent({
      id: 'e1',
      date: '2026-04-01',
      type: 'match',
      kickoff_time: '15:30:00',
      opponent: 'RC Test',
      source: 'ffr_import',
      external_id: 'ffr-99',
      match_day: 14,
      journee_name: 'Journée 14',
      match_status: 'Programmée',
      venue: 'Stade X',
    })

    expect(event.journee_name).toBe('Journée 14')
    expect(event.match_status).toBe('Programmée')
    expect(event.match_day).toBe(14)
    expect(event.kickoff_time).toBe('15:30')
    expect(event.source).toBe('ffr_import')
  })
})
