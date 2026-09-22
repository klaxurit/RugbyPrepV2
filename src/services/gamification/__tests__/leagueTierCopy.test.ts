import { describe, expect, it } from 'vitest'
import {
  leagueTierDivisionIndex,
  leagueTierDivisionLabel,
  leagueTierLabel,
} from '../labels'
import {
  leagueCountdownLabel,
  leagueDeloadFreezeBody,
  leagueHoldBody,
  leaguePromotionBody,
  leagueRelegationBody,
} from '../leagueTierCopy'

describe('league tier vie de club labels', () => {
  it('expose Buvette → Bouclier avec Div. 1–5', () => {
    expect(leagueTierLabel('reserve', 'fr')).toBe('Buvette')
    expect(leagueTierLabel('espoirs', 'fr')).toBe('Banc de touche')
    expect(leagueTierLabel('premiere', 'fr')).toBe('Titulaires')
    expect(leagueTierLabel('federale', 'fr')).toBe('Capitaines')
    expect(leagueTierLabel('elite', 'fr')).toBe('Bouclier')
    expect(leagueTierDivisionIndex('elite')).toBe(5)
    expect(leagueTierDivisionLabel('reserve', 'fr')).toBe('Div. 1')
  })
})

describe('leagueTierCopy', () => {
  it('rédige les montées chambreuses', () => {
    expect(leaguePromotionBody('espoirs', 'fr')).toMatch(/bière|banc/i)
    expect(leaguePromotionBody('premiere', 'fr')).toMatch(/démarres/i)
    expect(leaguePromotionBody('federale', 'fr')).toMatch(/brassard/i)
    expect(leaguePromotionBody('elite', 'fr')).toMatch(/Bouclier/i)
  })

  it('rédige les descentes bienveillantes', () => {
    expect(leagueRelegationBody('reserve', 'fr')).toMatch(/buvette/i)
    expect(leagueRelegationBody('espoirs', 'fr')).toMatch(/banc/i)
    expect(leagueRelegationBody('premiere', 'fr')).toMatch(/brassard/i)
    expect(leagueRelegationBody('federale', 'fr')).toMatch(/Bouclier/i)
  })

  it('tient le sommet et gèle la décharge', () => {
    expect(leagueHoldBody('elite', 'fr')).toMatch(/sommet/i)
    expect(leagueHoldBody('premiere', 'fr')).toMatch(/Titulaires/)
    expect(leagueDeloadFreezeBody('fr')).toMatch(/gelée/i)
  })

  it('formule le countdown fin de ligue', () => {
    expect(leagueCountdownLabel(7, 'fr')).toBe('Fin de ligue dans 7 j')
    expect(leagueCountdownLabel(1, 'fr')).toBe('Fin de ligue demain')
    expect(leagueCountdownLabel(1, 'en')).toBe('League ends tomorrow')
  })
})
