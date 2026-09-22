import { describe, expect, it } from 'vitest'
import { isSociallyExposable } from '../socialExposure'

const optedInClub = {
  display_name: 'Anna Roux',
  social_visibility: 'club',
  age_band: 'adult',
  health_consent_status: 'granted',
}

describe('isSociallyExposable', () => {
  it('refuse par défaut : sans opt-in, rien n’est exposé', () => {
    expect(
      isSociallyExposable({ ...optedInClub, social_visibility: 'private' }, 'club'),
    ).toBe(false)
    expect(isSociallyExposable({ ...optedInClub, social_visibility: null }, 'club')).toBe(false)
    expect(isSociallyExposable({ ...optedInClub, social_visibility: undefined }, 'club')).toBe(
      false,
    )
  })

  it('refuse une valeur de visibilité inconnue au lieu de la traiter comme un opt-in', () => {
    expect(isSociallyExposable({ ...optedInClub, social_visibility: 'world' }, 'club')).toBe(
      false,
    )
  })

  it('autorise le périmètre club pour un opt-in club', () => {
    expect(isSociallyExposable(optedInClub, 'club')).toBe(true)
  })

  it('traite « cohort » comme plus permissif que « club »', () => {
    const cohort = { ...optedInClub, social_visibility: 'cohort' }
    expect(isSociallyExposable(cohort, 'club')).toBe(true)
    expect(isSociallyExposable(cohort, 'cohort')).toBe(true)
  })

  it('n’expose pas un opt-in club dans les ligues hebdomadaires', () => {
    expect(isSociallyExposable(optedInClub, 'cohort')).toBe(false)
  })

  it('exige un nom d’affichage réellement renseigné', () => {
    expect(isSociallyExposable({ ...optedInClub, display_name: null }, 'club')).toBe(false)
    expect(isSociallyExposable({ ...optedInClub, display_name: '' }, 'club')).toBe(false)
    expect(isSociallyExposable({ ...optedInClub, display_name: '   ' }, 'club')).toBe(false)
  })

  it('exclut un mineur sans consentement santé accordé', () => {
    const minor = { ...optedInClub, age_band: 'u18' }
    expect(isSociallyExposable({ ...minor, health_consent_status: null }, 'club')).toBe(false)
    expect(isSociallyExposable({ ...minor, health_consent_status: 'pending' }, 'club')).toBe(
      false,
    )
    expect(isSociallyExposable({ ...minor, health_consent_status: 'revoked' }, 'club')).toBe(
      false,
    )
    expect(isSociallyExposable({ ...minor, health_consent_status: 'granted' }, 'club')).toBe(
      true,
    )
  })

  it('traite une tranche d’âge absente comme adulte', () => {
    expect(
      isSociallyExposable(
        { ...optedInClub, age_band: null, health_consent_status: null },
        'club',
      ),
    ).toBe(true)
  })

  it('refuse une ligne absente', () => {
    expect(isSociallyExposable(null, 'club')).toBe(false)
    expect(isSociallyExposable(undefined, 'cohort')).toBe(false)
  })
})
