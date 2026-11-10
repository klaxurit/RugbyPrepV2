/**
 * Glossaire unique — définitions courtes pour débutants (Fondations).
 * Affichage seulement : ne change pas la prescription S&C.
 */

import type { Lang } from './appLabels'

export type GlossaryTermId =
  | 'rer'
  | 'percent_max'
  | 'emom'
  | 'rdl'
  | 'lower'
  | 'upper'
  | 'primer'
  | 'full'
  | 'quad_ham'
  | 'transfer'

export interface GlossaryEntry {
  id: GlossaryTermId
  /** Mot / sigle affiché (bouton). */
  label: { fr: string; en: string }
  /** Définition courte (tooltip). */
  definition: { fr: string; en: string }
  /** Patterns dans une prescription / note (case-insensitive). */
  match: RegExp
}

export const TRAINING_GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: 'rer',
    label: { fr: 'RER', en: 'RIR' },
    definition: {
      fr: 'RER 2–3 = arrête quand il te reste 2 à 3 répétitions en réserve (pas à l’échec).',
      en: 'RIR 2–3 = stop when you still have 2–3 reps in reserve (not to failure).',
    },
    match: /\bRER\b|\bRIR\b/i,
  },
  {
    id: 'percent_max',
    label: { fr: '%', en: '%' },
    definition: {
      fr: '% de ton max (1RM estimé). Sans max connu, vise plutôt un RER confortable.',
      en: '% of your max (estimated 1RM). Without a known max, aim for a comfortable RIR.',
    },
    match: /\d+\s*[-–]?\s*\d*\s*%/,
  },
  {
    id: 'emom',
    label: { fr: 'EMOM', en: 'EMOM' },
    definition: {
      fr: 'Every Minute On the Minute : tu fais le travail au début de chaque minute, le reste = repos.',
      en: 'Every Minute On the Minute: do the work at the start of each minute; the rest is rest.',
    },
    match: /\bEMOM\b/i,
  },
  {
    id: 'rdl',
    label: { fr: 'RDL', en: 'RDL' },
    definition: {
      fr: 'Romanian Deadlift — soulevé de terre jambes tendues (hinge / chaîne postérieure).',
      en: 'Romanian Deadlift — hinge pattern for the posterior chain.',
    },
    match: /\bRDL\b/i,
  },
  {
    id: 'lower',
    label: { fr: 'Bas du corps', en: 'Lower' },
    definition: {
      fr: 'Séance bas du corps (jambes, hanches, chaîne postérieure).',
      en: 'Lower-body session (legs, hips, posterior chain).',
    },
    match: /\bLower\b|\bBas du corps\b/i,
  },
  {
    id: 'upper',
    label: { fr: 'Haut du corps', en: 'Upper' },
    definition: {
      fr: 'Séance haut du corps (poussée, tirage, épaules).',
      en: 'Upper-body session (push, pull, shoulders).',
    },
    match: /\bUpper\b|\bHaut du corps\b/i,
  },
  {
    id: 'primer',
    label: { fr: 'Activation', en: 'Primer' },
    definition: {
      fr: 'Séance d’activation courte (Power-up) avant un match ou une charge club.',
      en: 'Short activation session (primer) before a match or club load.',
    },
    match: /\bPrimer\b|\bPower-up\b|\bActivation\b/i,
  },
  {
    id: 'full',
    label: { fr: 'Complète', en: 'Full' },
    definition: {
      fr: 'Séance corps complet (bas + haut dans la même session).',
      en: 'Full-body session (lower + upper in one workout).',
    },
    match: /\bFull(?:\s*Body)?\b|\bComplète\b|\bCorps complet\b/i,
  },
  {
    id: 'quad_ham',
    label: { fr: 'quad:ham', en: 'quad:ham' },
    definition: {
      fr: 'Équilibre quadriceps / ischio-jambiers — on évite trop de quads sans chaîne postérieure.',
      en: 'Quad-to-hamstring balance — avoid too much quad work without posterior chain.',
    },
    match: /quad\s*:\s*ham/i,
  },
  {
    id: 'transfer',
    label: { fr: 'Transfert', en: 'Transfer' },
    definition: {
      fr: 'Transfert : ce que le geste apporte sur le terrain (mêlée, contact, sprint…).',
      en: 'Transfer: how the lift carries over to the pitch (scrum, contact, sprint…).',
    },
    match: /\bTransfer\b|\bTransfert\b/i,
  },
] as const

export function glossaryEntryById(id: GlossaryTermId): GlossaryEntry {
  return TRAINING_GLOSSARY.find((e) => e.id === id)!
}

export function findGlossaryMatches(text: string): GlossaryEntry[] {
  return TRAINING_GLOSSARY.filter((e) => e.match.test(text))
}

export function glossaryLabel(entry: GlossaryEntry, lang: Lang): string {
  return entry.label[lang === 'en' ? 'en' : 'fr']
}

export function glossaryDefinition(entry: GlossaryEntry, lang: Lang): string {
  return entry.definition[lang === 'en' ? 'en' : 'fr']
}

/**
 * Affichage Fondations : remplace « 80-85% » par un repère RER lisible
 * (la prescription source reste inchangée côté moteur).
 */
export function formatPrescriptionDisplay(
  prescription: string,
  opts: { foundations?: boolean; lang?: Lang },
): string {
  if (!opts.foundations) return prescription
  const lang = opts.lang === 'en' ? 'en' : 'fr'
  return prescription.replace(
    /(\d+\s*[-–]\s*\d+|\d+)\s*%/g,
    lang === 'en' ? 'RIR 2–3 (no max yet)' : 'RER 2–3 (sans max connu)',
  )
}

/** Libellés FR joueur pour types de séance (onboarding / récap). */
export function sessionTypePlayerLabel(
  type: 'lower' | 'upper' | 'full' | 'full_light_primer' | 'speed_power' | string,
  lang: Lang = 'fr',
): string {
  if (lang === 'en') {
    switch (type) {
      case 'lower':
        return 'Lower body'
      case 'upper':
        return 'Upper body'
      case 'full':
        return 'Full body'
      case 'full_light_primer':
        return 'Activation'
      case 'speed_power':
        return 'Speed · Power'
      default:
        return type
    }
  }
  switch (type) {
    case 'lower':
      return 'Bas du corps'
    case 'upper':
      return 'Haut du corps'
    case 'full':
      return 'Complète'
    case 'full_light_primer':
      return 'Activation'
    case 'speed_power':
      return 'Vitesse · Puissance'
    default:
      return type
  }
}
