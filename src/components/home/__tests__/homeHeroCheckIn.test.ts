import { describe, expect, it } from 'vitest'
import {
  clubProxyToHeroMood,
  heroMoodToClubProxy,
  isClubContactCheckInDay,
} from '../homeHeroCheckIn'

describe('homeHeroCheckIn', () => {
  it('seule porte Home : contact club le jour club en saison/playoffs (pas de mood forme)', () => {
    expect(isClubContactCheckInDay('club_day', 'in_season')).toBe(true)
    expect(isClubContactCheckInDay('club_day', 'playoffs')).toBe(true)
    expect(isClubContactCheckInDay('club_day', 'off_season')).toBe(false)
    expect(isClubContactCheckInDay('club_day', 'pre_season')).toBe(false)
    expect(isClubContactCheckInDay('rest_day', 'in_season')).toBe(false)
    expect(isClubContactCheckInDay('match_tomorrow', 'in_season')).toBe(false)
    expect(isClubContactCheckInDay('training_day', 'in_season')).toBe(false)
  })

  it('mappe hard ↔ tired pour réutiliser l’UI 2 boutons', () => {
    expect(clubProxyToHeroMood('hard')).toBe('tired')
    expect(clubProxyToHeroMood('normal')).toBe('fit')
    expect(clubProxyToHeroMood('light')).toBe('fit')
    expect(heroMoodToClubProxy('tired')).toBe('hard')
    expect(heroMoodToClubProxy('fit')).toBe('normal')
    expect(heroMoodToClubProxy(null)).toBe('normal')
  })
})
