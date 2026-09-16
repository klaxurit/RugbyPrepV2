import { describe, expect, it } from 'vitest'
import { nudgeRowToSocialNudge } from '../nudgeFromRow'

const CREATED_AT = '2026-09-16T08:00:00.000Z'

function row(kind: string, payload: Record<string, unknown> | null) {
  return { id: `n-${kind}`, kind, payload, created_at: CREATED_AT }
}

describe('nudgeRowToSocialNudge', () => {
  it('met en mots un passage de palier', () => {
    const nudge = nudgeRowToSocialNudge(row('level_up', { level: 'cadre' }), 'fr')
    expect(nudge?.kind).toBe('level_up')
    expect(nudge?.body).toContain('Cadre')
    expect(nudge?.createdAt).toBe(CREATED_AT)
  })

  it('suit la langue demandée', () => {
    const nudge = nudgeRowToSocialNudge(row('level_up', { level: 'cadre' }), 'en')
    expect(nudge?.body).toContain('Senior')
  })

  it('écarte un palier inconnu plutôt que d’afficher un libellé vide', () => {
    expect(nudgeRowToSocialNudge(row('level_up', { level: 'grand_chelem' }), 'fr')).toBeNull()
    expect(nudgeRowToSocialNudge(row('level_up', {}), 'fr')).toBeNull()
  })

  it('écarte un palier de ligue inconnu', () => {
    expect(nudgeRowToSocialNudge(row('league_promotion', { tier: 'mondiale' }), 'fr')).toBeNull()
    expect(
      nudgeRowToSocialNudge(row('league_promotion', { tier: 'federale' }), 'fr')?.body,
    ).toContain('Fédérale')
  })

  it('nomme le coéquipier qui vient de passer devant', () => {
    const nudge = nudgeRowToSocialNudge(
      row('league_overtaken', { peerDisplayName: 'Léo Martin' }),
      'fr',
    )
    expect(nudge?.body).toContain('Léo Martin')
  })

  it('écarte un dépassement sans nom : le fait ne serait pas énonçable', () => {
    expect(nudgeRowToSocialNudge(row('league_overtaken', {}), 'fr')).toBeNull()
    expect(
      nudgeRowToSocialNudge(row('league_overtaken', { peerDisplayName: '   ' }), 'fr'),
    ).toBeNull()
  })

  it('agrège les kudos multiples et nomme l’unique salueur', () => {
    expect(
      nudgeRowToSocialNudge(
        row('kudos_received', { count: 1, peerDisplayName: 'Anna' }),
        'fr',
      )?.body,
    ).toContain('Anna')
    expect(
      nudgeRowToSocialNudge(row('kudos_received', { count: 3, peerDisplayName: null }), 'fr')
        ?.body,
    ).toContain('3')
  })

  it('écarte un kudos à zéro', () => {
    expect(nudgeRowToSocialNudge(row('kudos_received', { count: 0 }), 'fr')).toBeNull()
  })

  it('rapporte un résultat de duel sans jugement de valeur', () => {
    const lost = nudgeRowToSocialNudge(
      row('duel_result', {
        opponentDisplayName: 'Hugo',
        selfPoints: 40,
        opponentPoints: 65,
      }),
      'fr',
    )
    expect(lost?.body).toContain('Hugo')
    expect(lost?.body).toContain('65')
    expect(lost?.body.toLowerCase()).not.toMatch(/perdu|nul|faible|mauvais/)
  })

  it('reste muet sur le pouls du club en dessous de deux athlètes', () => {
    expect(
      nudgeRowToSocialNudge(row('club_pulse', { athletesOnPlan: 1, clubName: 'RC X' }), 'fr'),
    ).toBeNull()
    expect(
      nudgeRowToSocialNudge(row('club_pulse', { athletesOnPlan: 4, clubName: 'RC X' }), 'fr')
        ?.body,
    ).toContain('RC X')
  })

  it('ignore un type inconnu et peer_emulation, construit côté contexte', () => {
    expect(nudgeRowToSocialNudge(row('promo_abonnement', {}), 'fr')).toBeNull()
    expect(nudgeRowToSocialNudge(row('peer_emulation', { peerDisplayName: 'X' }), 'fr')).toBeNull()
  })

  it('ignore un payload aux types incorrects au lieu de les coercer', () => {
    expect(
      nudgeRowToSocialNudge(
        { id: 'n1', kind: 'kudos_received', payload: { count: '3' }, created_at: CREATED_AT },
        'fr',
      ),
    ).toBeNull()
    expect(nudgeRowToSocialNudge(row('club_pulse', null), 'fr')).toBeNull()
  })
})
