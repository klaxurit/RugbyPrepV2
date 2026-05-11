import { describe, it, expect } from 'vitest'
import { localizeMotherSessionExerciseName } from '../localizeMotherSessionExerciseName'

describe('localizeMotherSessionExerciseName', () => {
  describe('lang = fr', () => {
    it('renvoie la traduction du lexique pour un exo standard', () => {
      expect(localizeMotherSessionExerciseName('Bench Press', 'fr')).toBe('Développé couché')
    })
    it('normalise la casse avant lookup', () => {
      expect(localizeMotherSessionExerciseName('bench press', 'fr')).toBe('Développé couché')
      expect(localizeMotherSessionExerciseName('BENCH PRESS', 'fr')).toBe('Développé couché')
    })
    it('défaut lang = fr', () => {
      expect(localizeMotherSessionExerciseName('thoracic rotation')).toBe('rotation thoracique')
    })
    it('traduit un warmup hors catalogue (uniquement lexique)', () => {
      expect(localizeMotherSessionExerciseName('Ab Wheel', 'fr')).toBe('Roue abdominale')
    })
    it('renvoie le brut quand pas de traduction lexique', () => {
      expect(localizeMotherSessionExerciseName('Exo Inconnu Z42', 'fr')).toBe('Exo Inconnu Z42')
    })
  })

  describe('lang = en', () => {
    it('renvoie le brut MD (anglais) sans consulter le lexique', () => {
      expect(localizeMotherSessionExerciseName('Bench Press', 'en')).toBe('Bench Press')
      expect(localizeMotherSessionExerciseName('Trap Bar Deadlift', 'en')).toBe('Trap Bar Deadlift')
    })
    it('préserve la casse source pour les warmups lowercase', () => {
      // Les MD ont parfois des noms en lowercase (ankle rocks, thoracic rotation) ;
      // le helper ne re-cápitalise pas — il les renvoie comme dans la source.
      expect(localizeMotherSessionExerciseName('thoracic rotation', 'en')).toBe('thoracic rotation')
    })
    it('renvoie le brut pour un exo inconnu', () => {
      expect(localizeMotherSessionExerciseName('Exo Inconnu Z42', 'en')).toBe('Exo Inconnu Z42')
    })
  })

  describe('inputs vides / whitespace', () => {
    it('renvoie chaîne vide pour undefined', () => {
      expect(localizeMotherSessionExerciseName(undefined, 'fr')).toBe('')
    })
    it('renvoie chaîne vide pour whitespace-only', () => {
      expect(localizeMotherSessionExerciseName('   ', 'fr')).toBe('')
      expect(localizeMotherSessionExerciseName('', 'fr')).toBe('')
    })
    it('trim le brut en sortie', () => {
      expect(localizeMotherSessionExerciseName('  Exo Inconnu  ', 'fr')).toBe('Exo Inconnu')
    })
  })
})
