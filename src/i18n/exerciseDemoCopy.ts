import type { Lang } from './appLabels'

/** Note structurée « variante proche » (jamais concaténée aux consignes d’un autre exo). */
export function exerciseDemoNearbyVariantNote(variantName: string, lang: Lang): string {
  return lang === 'en'
    ? `Close variant: ${variantName}. Same intent, different stance or load.`
    : `Variante proche : ${variantName}. Même intention, un appui ou charge différente.`
}

/** Helper fiche : contenu entièrement sur la variante vidéo (exo prescrit sans démo). */
export function exerciseDemoFallbackHelper(prescribedName: string, lang: Lang): string {
  return lang === 'en'
    ? `Demo of the closest filmed variant (prescribed: ${prescribedName}). Cues match this video.`
    : `Démo de la variante filmée la plus proche (prescrit : ${prescribedName}). Les consignes correspondent à cette vidéo.`
}
