import { describe, expect, it } from 'vitest'
import { mapFfrRencontreToNormalizedMatch } from '../ffrMatchNormalization'

const clubCode = '4207Y'

const baseRencontre = {
  id: 'r-1',
  dateOfficielle: '2026-03-15T14:00:00.000Z',
  Etat: { nom: 'Jouée' },
  Journee: { nom: 'Journée 12', numero: 12 },
  CompetitionEquipeLocale: {
    Structure: { code: clubCode, nom: 'Stade Toulousain' },
  },
  CompetitionEquipeVisiteuse: {
    Structure: { code: '9999Z', nom: 'Rival FC' },
  },
  Terrain: { nom: 'Stade Ernest-Wallon', Adresse: { localite: 'Toulouse' } },
}

describe('mapFfrRencontreToNormalizedMatch', () => {
  it('maps Journee.nom and Etat.nom for a club match', () => {
    const row = mapFfrRencontreToNormalizedMatch(baseRencontre, { nom: 'Journée 12', numero: 12 }, clubCode)
    expect(row).toMatchObject({
      external_id: 'r-1',
      match_date: '2026-03-15',
      kickoff_time: '14:00',
      journee_name: 'Journée 12',
      match_status: 'Jouée',
      match_day: 12,
      home_club_code: clubCode,
      away_club_code: '9999Z',
      venue: 'Stade Ernest-Wallon, Toulouse',
    })
  })

  it('falls back to parent journee when rencontre.Journee is missing', () => {
    const row = mapFfrRencontreToNormalizedMatch(
      { ...baseRencontre, Journee: undefined },
      { nom: 'Demi-finale', numero: 1 },
      clubCode,
    )
    expect(row?.journee_name).toBe('Demi-finale')
    expect(row?.match_day).toBe(1)
  })

  it('returns null when neither side matches the club', () => {
    const row = mapFfrRencontreToNormalizedMatch(baseRencontre, {}, '0000A')
    expect(row).toBeNull()
  })

  it('uses unknown when Etat is missing', () => {
    const row = mapFfrRencontreToNormalizedMatch(
      { ...baseRencontre, Etat: null },
      { nom: 'Journée 1' },
      clubCode,
    )
    expect(row?.match_status).toBe('unknown')
  })
})
