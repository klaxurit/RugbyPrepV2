import { describe, expect, it } from 'vitest'
import {
  buildClubPulseNudge,
  buildDuelResultNudge,
  buildKudosNudge,
  buildLeagueOvertakenNudge,
  buildPeerEmulationNudge,
  type PeerEmulationContext,
} from '../nudgeCopy'

const PEER_BASE: PeerEmulationContext = {
  peerDisplayName: 'Antoine Dupont',
  peerSessionsThisWeek: 3,
  hasPlannedSessionToday: true,
  isMatchDay: false,
  isMatchTomorrow: false,
  acwrZone: 'optimal',
  lang: 'fr',
}

function peer(overrides: Partial<PeerEmulationContext> = {}) {
  return buildPeerEmulationNudge({ ...PEER_BASE, ...overrides })
}

describe('buildPeerEmulationNudge — filtrage par le planning', () => {
  it('produit le nudge quand une séance est prévue aujourd’hui', () => {
    const result = peer()
    expect(result).not.toBeNull()
    expect(result?.body).toContain('Antoine Dupont')
    expect(result?.body).toContain('3')
  })

  it('ne propose rien sans séance prévue aujourd’hui', () => {
    expect(peer({ hasPlannedSessionToday: false })).toBeNull()
  })

  it('ne propose rien un jour de match', () => {
    expect(peer({ isMatchDay: true })).toBeNull()
  })

  it('ne propose rien la veille d’un match', () => {
    // load-budgeting.md prescrit repos ou mobilité en J-1 : proposer une
    // séance contredirait le programme.
    expect(peer({ isMatchTomorrow: true })).toBeNull()
  })

  it('ne pousse pas un athlète en surcharge', () => {
    expect(peer({ acwrZone: 'danger' })).toBeNull()
    expect(peer({ acwrZone: 'critical' })).toBeNull()
  })

  it('exige un nom d’affichage réel', () => {
    expect(peer({ peerDisplayName: null })).toBeNull()
    expect(peer({ peerDisplayName: '   ' })).toBeNull()
  })

  it('exige un fait à rapporter', () => {
    expect(peer({ peerSessionsThisWeek: 0 })).toBeNull()
  })

  it('ne formule aucune comparaison de valeur entre athlètes', () => {
    const body = peer()?.body ?? ''
    expect(body).not.toMatch(/meilleur|mieux que|plus fort|bat/i)
  })

  it('reste disponible en anglais', () => {
    expect(peer({ lang: 'en' })?.body).toContain('Antoine Dupont')
  })
})

describe('buildClubPulseNudge', () => {
  it('rapporte le nombre de joueurs et le club', () => {
    const result = buildClubPulseNudge({
      clubName: 'Stade Toulousain',
      athletesOnPlan: 4,
      lang: 'fr',
    })
    expect(result?.body).toContain('4')
    expect(result?.body).toContain('Stade Toulousain')
  })

  it('reste muet en dessous de deux joueurs', () => {
    // Avec un seul joueur actif, le message révélerait son activité
    // individuelle sous couvert d'information collective.
    expect(
      buildClubPulseNudge({ clubName: 'Club', athletesOnPlan: 1, lang: 'fr' }),
    ).toBeNull()
  })

  it('fonctionne sans nom de club', () => {
    const result = buildClubPulseNudge({ clubName: null, athletesOnPlan: 3, lang: 'fr' })
    expect(result?.body).toContain('dans ton club')
  })
})

describe('buildLeagueOvertakenNudge', () => {
  it('rapporte un événement de classement réel', () => {
    const result = buildLeagueOvertakenNudge('Romain Ntamack', 'fr')
    expect(result?.kind).toBe('league_overtaken')
    expect(result?.body).toContain('Romain Ntamack')
  })

  it('n’invente pas d’adversaire anonyme', () => {
    expect(buildLeagueOvertakenNudge(null, 'fr')).toBeNull()
  })
})

describe('buildKudosNudge', () => {
  it('nomme l’auteur d’un kudos unique', () => {
    expect(buildKudosNudge(1, 'Julien Marchand', 'fr')?.body).toContain('Julien Marchand')
  })

  it('agrège au-delà d’un kudos', () => {
    const result = buildKudosNudge(4, 'Julien Marchand', 'fr')
    expect(result?.body).toContain('4')
    expect(result?.body).not.toContain('Julien Marchand')
  })

  it('reste muet sans kudos', () => {
    expect(buildKudosNudge(0, 'Julien Marchand', 'fr')).toBeNull()
  })
})

describe('buildDuelResultNudge', () => {
  it('annonce une victoire', () => {
    const result = buildDuelResultNudge({
      opponentDisplayName: 'Grégory Alldritt',
      selfPoints: 120,
      opponentPoints: 95,
      lang: 'fr',
    })
    expect(result?.body).toContain('remporté')
  })

  it('annonce une égalité', () => {
    const result = buildDuelResultNudge({
      opponentDisplayName: 'Grégory Alldritt',
      selfPoints: 100,
      opponentPoints: 100,
      lang: 'fr',
    })
    expect(result?.body).toContain('nul')
  })

  it('rapporte une défaite sans jugement de valeur', () => {
    const result = buildDuelResultNudge({
      opponentDisplayName: 'Grégory Alldritt',
      selfPoints: 80,
      opponentPoints: 110,
      lang: 'fr',
    })
    expect(result?.body).toContain('Grégory Alldritt')
    expect(result?.body).not.toMatch(/perdu|défaite|échec|nul/i)
  })
})
