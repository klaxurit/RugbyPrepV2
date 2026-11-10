/**
 * Copy joueur selon contentFamily — 0 UI.
 * Corrige libellés « Front Row / Premières lignes » résiduels sur mothers
 * déjà famille (Lower/Upper BACK_ROW) ou après overlay porteur.
 * Scrub systématique des tokens techniques (BACK_ROW, Half-Backs, …).
 */

import type { ContentFamily } from '../../data/contentFamily'
import {
  contentFamilyLabel,
  scrubPlayerFacingPositionCopy,
} from '../../data/contentFamily'
import type { MotherSession } from '../../types/motherSession'

const PACK_PORTEUR: ReadonlySet<ContentFamily> = new Set(['back_row', 'second_row'])

function displayFamilyLabel(family: ContentFamily, lang: 'fr' | 'en'): string {
  // Pack 1ère ligne : libellé produit « Pack » (pas « 1ère ligne ») sur finishers.
  if (family === 'front_row') return 'Pack'
  return contentFamilyLabel(family, lang)
}

function polishText(text: string, family: ContentFamily, lang: 'fr' | 'en'): string {
  const label = contentFamilyLabel(family, lang)
  let out = text
  if (PACK_PORTEUR.has(family)) {
    out = out
      .replace(/front[-\s]?row/gi, label)
      .replace(/Front[-\s]?row/g, label.charAt(0).toUpperCase() + label.slice(1))
      .replace(/premi[eè]res?\s+lignes?/gi, label)
      .replace(/1[eè]re\s+ligne/gi, label)
      .replace(/\bAvants\b/gi, lang === 'fr' ? 'Pack' : 'Pack')
      .replace(/box-squat force intent/gi, lang === 'en' ? 'trap-bar / athletic force intent' : 'intent force athlétique')
      .replace(/optional neck\/contact confidence work/gi, lang === 'en' ? 'optional contact confidence work' : 'travail confiance contact optionnel')
      .replace(/carry and neck robustness/gi, lang === 'en' ? 'carry and rotational robustness' : 'portage et robustesse rotationnelle')
      .replace(/adductor\/neck\/contact support/gi, lang === 'en' ? 'adductor/contact support' : 'support adducteurs/contact')
      .replace(/cervical isometrics rather than/gi, lang === 'en' ? 'carry demand rather than' : 'demande de portage plutôt que')
  }
  return scrubPlayerFacingPositionCopy(out, lang)
}

function polishBlockName(name: string, family: ContentFamily, lang: 'fr' | 'en'): string {
  const label = displayFamilyLabel(family, lang)
  if (
    /^(?:Front Row|Back Row|Second Row|Half-?Backs|Back Three|Centres|Centers|FRONT ROW|BACK ROW|SECOND ROW|HALF BACKS|BACK THREE|CENTERS) Finisher$/i.test(
      name,
    ) ||
    /^Finisher Premi[eè]res?\s+Lignes?$/i.test(name) ||
    /^Finisher Pack$/i.test(name) ||
    /^Finisher 1[eè]re ligne$/i.test(name) ||
    /^Finisher 2[eè]me ligne$/i.test(name) ||
    /^Finisher 3[eè]me ligne$/i.test(name) ||
    /^Finisher Demis$/i.test(name) ||
    /^Finisher (?:Centres|Arrières)$/i.test(name)
  ) {
    return lang === 'en' ? `${label} Finisher` : `Finisher ${label}`
  }
  if (
    /^(?:Front Row|Back Row|Second Row|Half-?Backs|Back Three|Centres|Centers|FRONT ROW|BACK ROW|SECOND ROW|HALF BACKS|BACK THREE|CENTERS) Support$/i.test(
      name,
    ) ||
    /^Support premi[eè]re ligne$/i.test(name) ||
    /^Support Pack$/i.test(name) ||
    /^Support 1[eè]re ligne$/i.test(name) ||
    /^Support 2[eè]me ligne$/i.test(name) ||
    /^Support 3[eè]me ligne$/i.test(name)
  ) {
    return lang === 'en' ? `${label} Support` : `Support ${label}`
  }
  if (/Carrier pack/i.test(name)) {
    return scrubPlayerFacingPositionCopy(name.replace(/Carrier pack/gi, label), lang)
  }
  if (/Pack porteur/i.test(name)) {
    return scrubPlayerFacingPositionCopy(name.replace(/Pack porteur/gi, label), lang)
  }
  return polishText(name, family, lang)
}

function scrubSessionOnly(session: MotherSession, lang: 'fr' | 'en'): MotherSession {
  return {
    ...session,
    title: session.title
      ? scrubPlayerFacingPositionCopy(session.title, lang)
      : session.title,
    goal: session.goal?.map((g) => scrubPlayerFacingPositionCopy(g, lang)),
    sessionIdentity: session.sessionIdentity?.map((s) =>
      scrubPlayerFacingPositionCopy(s, lang),
    ),
    positionAccent: session.positionAccent?.map((s) =>
      scrubPlayerFacingPositionCopy(s, lang),
    ),
    coachingWarnings: session.coachingWarnings?.map((s) =>
      scrubPlayerFacingPositionCopy(s, lang),
    ),
    blocks: session.blocks.map((b) => ({
      ...b,
      name: scrubPlayerFacingPositionCopy(b.name, lang),
      coachingNotes: b.coachingNotes?.map((n) => scrubPlayerFacingPositionCopy(n, lang)),
    })),
  }
}

/**
 * Pur. Avec famille : rewrite finishers/support + scrub.
 * Sans famille : scrub tokens techniques uniquement.
 */
export function applyContentFamilyCopyPolish(
  session: MotherSession,
  opts: {
    contentFamily?: ContentFamily | null
    lang?: 'fr' | 'en'
  },
): MotherSession {
  const lang = opts.lang ?? 'fr'
  const family = opts.contentFamily
  if (!family) return scrubSessionOnly(session, lang)

  return {
    ...session,
    title: session.title
      ? scrubPlayerFacingPositionCopy(session.title, lang)
      : session.title,
    goal: session.goal?.map((g) => polishText(g, family, lang)),
    sessionIdentity: session.sessionIdentity?.map((s) => polishText(s, family, lang)),
    positionAccent: session.positionAccent?.map((s) => polishText(s, family, lang)),
    coachingWarnings: session.coachingWarnings?.map((s) => polishText(s, family, lang)),
    blocks: session.blocks.map((b) => ({
      ...b,
      name: polishBlockName(b.name, family, lang),
      coachingNotes: b.coachingNotes?.map((n) => polishText(n, family, lang)),
    })),
  }
}
