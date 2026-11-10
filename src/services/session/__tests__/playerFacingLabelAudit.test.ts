import { describe, expect, it } from 'vitest'
import { localizeBlockName } from '../../motherSession/motherSessionBlockLabels'
import { formatTitleFromMotherSessionId } from '../../../components/motherSession/formatMotherSessionTitle'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'

/** Identifiants internes TYPE_SNAKE et anglicismes métier interdits en UI FR. */
const FORBIDDEN_PLAYER_FACING =
  /\b[A-Z]{2,}(?:_[A-Z0-9]+)+\b|\b(?:Lower|Upper|Primer|Strength|Triplet|Match-day|J-day|Power-up)\b/

const VISIBLE_BLOCK_SAMPLES = [
  'Contraste Lower',
  'Contraste Upper',
  'Triplet Force Lower',
  'Upper Primer',
  'BACK_ROW Finisher',
  'Contrast Lower',
  'Upper Push Primer',
]

describe('audit libellés joueur FR', () => {
  it('blocs localisés sans id interne ni anglicisme', () => {
    for (const raw of VISIBLE_BLOCK_SAMPLES) {
      const fr = localizeBlockName(raw, 'fr')
      expect(fr, raw).not.toMatch(FORBIDDEN_PLAYER_FACING)
    }
  })

  it('titres mother FR sans id interne ni anglicisme listé', () => {
    const sample = Object.keys(MOTHER_SESSIONS_BY_ID).filter((id) =>
      /IN_SEASON|FULL_LIGHT_PRIMER|LOWER|UPPER/.test(id),
    )
    for (const id of sample) {
      const title = formatTitleFromMotherSessionId(id, 'fr')
      expect(title, id).not.toMatch(FORBIDDEN_PLAYER_FACING)
    }
  })
})
