import { describe, it, expect } from 'vitest'
import { localizeBlockName, localizeBlockFormat } from '../motherSessionBlockLabels'

describe('localizeBlockName', () => {
  describe('lang = fr', () => {
    it('traduit un nom mappé', () => {
      expect(localizeBlockName('Lower Power Pair', 'fr')).toBe('Paire de puissance bas du corps')
      expect(localizeBlockName('Upper Push/Pull Strength', 'fr')).toBe('Force pousser/tirer haut du corps')
      expect(localizeBlockName('Front Row Finisher', 'fr')).toBe('Finisher première ligne')
    })
    it('fallback sur le nom brut EN si non mappé', () => {
      expect(localizeBlockName('Some Unknown Block', 'fr')).toBe('Some Unknown Block')
    })
    it('défaut lang = fr', () => {
      expect(localizeBlockName('Lower Power Pair')).toBe('Paire de puissance bas du corps')
    })
  })

  describe('lang = en', () => {
    it("renvoie le nom brut tel quel (la source MD est en EN)", () => {
      expect(localizeBlockName('Lower Power Pair', 'en')).toBe('Lower Power Pair')
      expect(localizeBlockName('Upper Push/Pull Strength', 'en')).toBe('Upper Push/Pull Strength')
    })
  })

  describe('inputs vides', () => {
    it('chaîne vide pour undefined / vide', () => {
      expect(localizeBlockName(undefined, 'fr')).toBe('')
      expect(localizeBlockName('', 'fr')).toBe('')
    })
  })
})

describe('localizeBlockFormat', () => {
  describe('lang = en', () => {
    it('renvoie le format tel quel', () => {
      expect(localizeBlockFormat('`3 rounds`, full rest `3 min`', 'en')).toBe('`3 rounds`, full rest `3 min`')
    })
  })

  describe('lang = fr', () => {
    it('traduit rounds → tours', () => {
      expect(localizeBlockFormat('`3 rounds`, `90-120s` rest', 'fr')).toBe('`3 tours`, `90-120s` récup')
    })
    it('traduit full rest → récup complète', () => {
      expect(localizeBlockFormat('`3 rounds`, full rest `3 min`', 'fr')).toBe('`3 tours`, récup complète `3 min`')
    })
    it('traduit rest after the pair', () => {
      expect(localizeBlockFormat('`3 rounds`, `90-120s` rest after the pair', 'fr')).toBe('`3 tours`, `90-120s` récup après la paire')
    })
    it('traduit rest after the triplet', () => {
      expect(localizeBlockFormat('`3 rounds`, `90-120s` rest after the triplet', 'fr')).toBe('`3 tours`, `90-120s` récup après le triplet')
    })
    it('traduit work sets + between sets', () => {
      expect(localizeBlockFormat('`4 work sets`, `2 min` rest between sets', 'fr')).toBe('`4 séries lourdes`, `2 min` récup entre séries')
    })
    it('traduit between rounds', () => {
      expect(localizeBlockFormat('`4 rounds`, `3-4 min` rest between rounds', 'fr')).toBe('`4 tours`, `3-4 min` récup entre tours')
    })
    it('défaut lang = fr', () => {
      expect(localizeBlockFormat('`3 rounds`, full rest `3 min`')).toBe('`3 tours`, récup complète `3 min`')
    })
  })

  describe('inputs vides', () => {
    it('chaîne vide pour undefined / vide', () => {
      expect(localizeBlockFormat(undefined, 'fr')).toBe('')
      expect(localizeBlockFormat('', 'fr')).toBe('')
    })
  })
})
