import { describe, expect, it } from 'vitest'
import { formatStaffAthleteDisplayName } from '../formatStaffAthleteDisplayName'

describe('formatStaffAthleteDisplayName', () => {
  it('prefers displayName from profile', () => {
    expect(
      formatStaffAthleteDisplayName({ displayName: 'Hugo Junca', rugbyPosition: 'BACK_ROW' }, 'uuid-1')
    ).toBe('Hugo Junca')
  })

  it('falls back to position label', () => {
    expect(
      formatStaffAthleteDisplayName({ rugbyPosition: 'BACK_ROW' }, 'uuid-abcdef12')
    ).toBe('3ème ligne')
  })
})
