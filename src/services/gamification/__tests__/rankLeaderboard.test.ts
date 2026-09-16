import { describe, expect, it } from 'vitest'
import { rankLeaderboard, toAthleteLevel } from '../rankLeaderboard'
import type { LeaderboardRowLike } from '../rankLeaderboard'

function row(overrides: Partial<LeaderboardRowLike> & { user_id: string }): LeaderboardRowLike {
  return {
    display_name: 'Athlète',
    avatar_url: null,
    points: 0,
    sessions_completed: 0,
    level: 'espoir',
    is_self: false,
    ...overrides,
  }
}

describe('rankLeaderboard', () => {
  it('numérote les rangs dans l’ordre renvoyé par la RPC', () => {
    const entries = rankLeaderboard([
      row({ user_id: 'a', points: 80 }),
      row({ user_id: 'b', points: 55 }),
      row({ user_id: 'c', points: 20 }),
    ])
    expect(entries.map((entry) => entry.rank)).toEqual([1, 2, 3])
  })

  it('donne le même rang aux ex æquo et saute le rang suivant', () => {
    const entries = rankLeaderboard([
      row({ user_id: 'a', points: 80 }),
      row({ user_id: 'b', points: 80 }),
      row({ user_id: 'c', points: 40 }),
    ])
    expect(entries.map((entry) => entry.rank)).toEqual([1, 1, 3])
  })

  it('gère une série entière d’ex æquo, zéro compris', () => {
    const entries = rankLeaderboard([
      row({ user_id: 'a' }),
      row({ user_id: 'b' }),
      row({ user_id: 'c' }),
    ])
    expect(entries.map((entry) => entry.rank)).toEqual([1, 1, 1])
  })

  it('traite des points absents comme zéro', () => {
    const entries = rankLeaderboard([row({ user_id: 'a', points: null })])
    expect(entries[0].points).toBe(0)
    expect(entries[0].sessionsCompleted).toBe(0)
  })

  it('nettoie les espaces du nom affiché', () => {
    const entries = rankLeaderboard([row({ user_id: 'a', display_name: '  Anna Roux ' })])
    expect(entries[0].displayName).toBe('Anna Roux')
  })

  it('n’expose que les champs de la liste blanche', () => {
    const entries = rankLeaderboard([
      // Un champ de santé glissé dans la réponse ne doit pas ressortir.
      { ...row({ user_id: 'a' }), rpe: 9, weight_kg: 102 } as LeaderboardRowLike,
    ])
    expect(Object.keys(entries[0]).sort()).toEqual([
      'avatarUrl',
      'displayName',
      'isSelf',
      'level',
      'points',
      'rank',
      'sessionsCompleted',
      'userId',
    ])
  })

  it('marque l’athlète courant uniquement sur un booléen vrai', () => {
    const entries = rankLeaderboard([
      row({ user_id: 'a', is_self: true }),
      row({ user_id: 'b', is_self: false }),
    ])
    expect(entries.map((entry) => entry.isSelf)).toEqual([true, false])
  })
})

describe('toAthleteLevel', () => {
  it('accepte les paliers connus', () => {
    expect(toAthleteLevel('capitaine')).toBe('capitaine')
  })

  it('retombe sur « espoir » pour une valeur inconnue ou absente', () => {
    expect(toAthleteLevel('grand_chelem')).toBe('espoir')
    expect(toAthleteLevel(null)).toBe('espoir')
    expect(toAthleteLevel(undefined)).toBe('espoir')
  })
})
