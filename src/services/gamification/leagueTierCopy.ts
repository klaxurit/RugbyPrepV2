import type { Lang } from '../../i18n/appLabels'
import type { LeagueTier } from '../../types/gamification'
import { leagueTierLabel } from './labels'
import { promoteTier, relegateTier } from './levels'

/**
 * Copy de fin de semaine — montées chambreuses, descentes bienveillantes.
 *
 * Les IDs restent `reserve`…`elite` ; seuls les libellés « vie de club »
 * apparaissent à l’athlète.
 */

type Bilingual = { fr: string; en: string }

const PROMOTION: Partial<Record<`${LeagueTier}>${LeagueTier}`, Bilingual>> = {
  'reserve>espoirs': {
    fr: 'Tu poses ta bière, on te file un maillot. Direction le banc.',
    en: 'Put the pint down — here’s a jersey. Off to the sideline.',
  },
  'espoirs>premiere': {
    fr: 'Le coach t’a vu. Cette semaine, tu démarres.',
    en: 'The coach noticed you. You’re starting this week.',
  },
  'premiere>federale': {
    fr: 'Tu ne fais plus juste le taf, tu montres l’exemple. Le brassard est pour toi.',
    en: 'You’re not just doing the job — you’re setting the standard. Here’s the armband.',
  },
  'federale>elite': {
    fr: 'Tout en haut. Le Bouclier est à toi… jusqu’à lundi.',
    en: 'All the way up. The Shield is yours… until Monday.',
  },
}

const RELEGATION: Partial<Record<`${LeagueTier}>${LeagueTier}`, Bilingual>> = {
  'espoirs>reserve': {
    fr: 'Retour à la buvette. Pas de honte, c’est là que naissent les meilleures équipes. On remonte lundi.',
    en: 'Back to the club bar. No shame — that’s where great sides start. We climb again Monday.',
  },
  'premiere>espoirs': {
    fr: 'Semaine un peu légère, tu repars du banc. Une semaine carrée et tu retrouves ta place.',
    en: 'A light week — back to the sideline. One clean week and you reclaim your spot.',
  },
  'federale>premiere': {
    fr: 'Tu rends le brassard pour cette semaine. Le terrain, lui, t’attend toujours.',
    en: 'You hand the armband back for this week. The pitch is still waiting.',
  },
  'elite>federale': {
    fr: 'Le Bouclier change de mains. Tu as une semaine pour aller le rechercher.',
    en: 'The Shield changes hands. You’ve got one week to go get it back.',
  },
}

const HOLD_TOP: Bilingual = {
  fr: 'Encore une semaine au sommet. Personne ne te l’a pris.',
  en: 'Another week at the top. Nobody took it from you.',
}

function pick(copy: Bilingual, lang: Lang): string {
  return copy[lang]
}

export function leaguePromotionBody(toTier: LeagueTier, lang: Lang): string {
  const fromTier = relegateTier(toTier)
  if (fromTier === toTier) {
    return lang === 'fr'
      ? `Tu rejoins la ${leagueTierLabel(toTier, 'fr')}.`
      : `You join the ${leagueTierLabel(toTier, 'en')}.`
  }
  const key = `${fromTier}>${toTier}` as const
  const known = PROMOTION[key]
  if (known) return pick(known, lang)
  return lang === 'fr'
    ? `Tu montes chez les ${leagueTierLabel(toTier, 'fr')}.`
    : `You move up to ${leagueTierLabel(toTier, 'en')}.`
}

export function leagueRelegationBody(toTier: LeagueTier, lang: Lang): string {
  const fromTier = promoteTier(toTier)
  if (fromTier === toTier) {
    return lang === 'fr'
      ? `Tu restes à la ${leagueTierLabel(toTier, 'fr')}.`
      : `You stay in ${leagueTierLabel(toTier, 'en')}.`
  }
  const key = `${fromTier}>${toTier}` as const
  const known = RELEGATION[key]
  if (known) return pick(known, lang)
  return lang === 'fr'
    ? `Tu redescends chez les ${leagueTierLabel(toTier, 'fr')}.`
    : `You drop back to ${leagueTierLabel(toTier, 'en')}.`
}

export function leagueHoldBody(tier: LeagueTier, lang: Lang): string {
  if (tier === 'elite') return pick(HOLD_TOP, lang)
  return lang === 'fr'
    ? `Tu tiens ta place chez les ${leagueTierLabel(tier, 'fr')}. Solide.`
    : `You hold your spot in ${leagueTierLabel(tier, 'en')}. Solid.`
}

/** Semaine de décharge respectée : la place ne bouge pas (copy future / Edge). */
export function leagueDeloadFreezeBody(lang: Lang): string {
  return lang === 'fr'
    ? 'Semaine de décharge respectée : ta place est gelée.'
    : 'Deload week respected: your place is frozen.'
}
