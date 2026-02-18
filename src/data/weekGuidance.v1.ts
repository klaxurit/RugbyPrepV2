export type WeekGuidanceKey = 'W1' | 'W2' | 'W3' | 'W4' | 'DELOAD'

export interface WeekGuidance {
  title: string
  focus: string
  intensityCue: string
  keyRules: string[]
}

export const weekGuidanceV1: Record<WeekGuidanceKey, WeekGuidance> = {
  W1: {
    title: 'Installation',
    focus: 'On installe la technique et le rythme de séance.',
    intensityCue: 'RER élevé, priorité technique.',
    keyRules: [
      'Garde 3-4 reps en réserve sur les blocs lourds.',
      'Stop si la vitesse chute franchement.',
      'Qualité d’exécution avant charge.'
    ]
  },
  W2: {
    title: 'Montée progressive',
    focus: 'On monte légèrement les charges sans perdre la forme.',
    intensityCue: 'Un peu plus lourd, toujours propre.',
    keyRules: [
      'Ajoute un petit incrément de charge si W1 était facile.',
      'Garde 2-3 reps en réserve sur les blocs principaux.',
      'Reste explosif sur neural/contrast.'
    ]
  },
  W3: {
    title: 'Semaine clé',
    focus: 'Bloc de travail le plus exigeant avec qualité maximale.',
    intensityCue: 'RER bas, intensité maîtrisée.',
    keyRules: [
      'Travaille lourd mais arrête avant le grind.',
      'Priorité à la posture et au contrôle sous fatigue.',
      'Réduis la charge si douleur ou vitesse en baisse.'
    ]
  },
  W4: {
    title: 'Pic d’intensité',
    focus: 'On approche le maximum contrôlé sur les blocs principaux.',
    intensityCue: 'Très proche de l’échec sur le principal, sans compromettre la sécurité.',
    keyRules: [
      'Sur bloc principal, stop dès perte technique.',
      'Récupération stricte: sommeil, hydratation, mobilité.',
      'Si forme moyenne, garde la charge de W3.'
    ]
  },
  DELOAD: {
    title: 'DELOAD',
    focus: 'Même structure de séance, mais charge interne volontairement réduite.',
    intensityCue: 'Allège la charge et garde une exécution propre du début à la fin.',
    keyRules: [
      'Réduis le volume (~30-40%) et garde de la réserve.',
      'Priorité absolue: vitesse, contrôle, pas de douleur.',
      'Prépare le prochain cycle en récupérant vraiment.'
    ]
  }
}
