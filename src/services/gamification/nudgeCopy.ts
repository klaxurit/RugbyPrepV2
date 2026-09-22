import type { ACWRZone } from '../../hooks/useACWR'
import type { Lang } from '../../i18n/appLabels'
import type { AthleteLevel, LeagueTier, NudgeKind } from '../../types/gamification'
import { leaguePromotionBody } from './leagueTierCopy'
import { levelLabel } from './labels'

/**
 * Rédaction des nudges sociaux.
 *
 * Deux règles non négociables, issues des effets indésirables documentés de la
 * gamification compétitive (stress accru, dynamiques sociales négatives) :
 *
 *  1. **Un fait vérifiable, jamais une formule générée.** Si l'événement n'a
 *     pas eu lieu, le builder renvoie `null` et rien ne s'affiche. Aligné sur
 *     `PROJECT_RULES.md` § 5 (ne jamais inventer).
 *  2. **Aucune formulation comparative dégradante.** On rapporte ce qu'un
 *     coéquipier a fait, jamais un jugement de valeur entre athlètes.
 */

export interface NudgeCopy {
  kind: NudgeKind
  title: string
  body: string
  actionHref?: string
  actionLabel?: string
}

/**
 * « Entraîne-toi aujourd'hui comme X. »
 *
 * Gated par le moteur de planification : proposer une séance un jour de match,
 * la veille d'un match ou un jour de repos programmé contredirait le
 * programme, et pousser un athlète déjà en surcharge contredirait l'ACWR.
 * Dans tous ces cas, pas de nudge.
 */
export interface PeerEmulationContext {
  /** Nom d'affichage du coéquipier. Doit être opt-in — filtré en amont. */
  peerDisplayName: string | null
  /** Séances tenues par ce coéquipier cette semaine. */
  peerSessionsThisWeek: number
  /** L'athlète destinataire a une séance prévue aujourd'hui. */
  hasPlannedSessionToday: boolean
  isMatchDay: boolean
  isMatchTomorrow: boolean
  acwrZone: ACWRZone | null
  lang: Lang
}

export function buildPeerEmulationNudge(ctx: PeerEmulationContext): NudgeCopy | null {
  const name = ctx.peerDisplayName?.trim()
  if (!name) return null
  if (ctx.peerSessionsThisWeek < 1) return null
  if (!ctx.hasPlannedSessionToday) return null
  if (ctx.isMatchDay || ctx.isMatchTomorrow) return null
  if (ctx.acwrZone === 'danger' || ctx.acwrZone === 'critical') return null

  const sessions = ctx.peerSessionsThisWeek
  return {
    kind: 'peer_emulation',
    title: ctx.lang === 'fr' ? 'Dans ton club' : 'In your club',
    body:
      ctx.lang === 'fr'
        ? `${name} a tenu son plan ${sessions} fois cette semaine. Ta séance du jour t'attend.`
        : `${name} stuck to their plan ${sessions} times this week. Your session is waiting.`,
    actionHref: '/week',
    actionLabel: ctx.lang === 'fr' ? 'Voir ma séance' : 'See my session',
  }
}

/**
 * Pouls du club — information d'ambiance, non nominative.
 *
 * En dessous de deux athlètes actifs, le message n'a pas de sens social et
 * révélerait indirectement l'activité d'une seule personne.
 */
export interface ClubPulseContext {
  clubName: string | null
  athletesOnPlan: number
  lang: Lang
}

export function buildClubPulseNudge(ctx: ClubPulseContext): NudgeCopy | null {
  if (ctx.athletesOnPlan < 2) return null
  const club = ctx.clubName?.trim()
  const where = club
    ? ctx.lang === 'fr'
      ? `à ${club}`
      : `at ${club}`
    : ctx.lang === 'fr'
      ? 'dans ton club'
      : 'in your club'

  return {
    kind: 'club_pulse',
    title: ctx.lang === 'fr' ? 'Pouls du club' : 'Club pulse',
    body:
      ctx.lang === 'fr'
        ? `${ctx.athletesOnPlan} joueurs ont tenu leur plan cette semaine ${where}.`
        : `${ctx.athletesOnPlan} players stuck to their plan this week ${where}.`,
    actionHref: '/squad',
    actionLabel: ctx.lang === 'fr' ? 'Voir le classement' : 'See the board',
  }
}

export function buildLevelUpNudge(level: AthleteLevel, lang: Lang): NudgeCopy {
  return {
    kind: 'level_up',
    title: lang === 'fr' ? 'Nouveau palier' : 'New level',
    body:
      lang === 'fr'
        ? `Tu passes ${levelLabel(level, 'fr')}. Ta régularité paie.`
        : `You reached ${levelLabel(level, 'en')}. Your consistency pays off.`,
    actionHref: '/squad',
    actionLabel: lang === 'fr' ? 'Voir ma progression' : 'See my progress',
  }
}

export function buildLeaguePromotionNudge(tier: LeagueTier, lang: Lang): NudgeCopy {
  return {
    kind: 'league_promotion',
    title: lang === 'fr' ? 'Promotion' : 'Promotion',
    body: leaguePromotionBody(tier, lang),
    actionHref: '/squad',
    actionLabel: lang === 'fr' ? 'Voir ma ligue' : 'See my league',
  }
}

/**
 * Dépassement au classement — le déclencheur de réengagement le plus efficace
 * d'une app de sport, parce qu'il correspond à un événement réel dont
 * l'athlète se soucie.
 */
export function buildLeagueOvertakenNudge(
  peerDisplayName: string | null,
  lang: Lang,
): NudgeCopy | null {
  const name = peerDisplayName?.trim()
  if (!name) return null
  return {
    kind: 'league_overtaken',
    title: lang === 'fr' ? 'Classement' : 'Leaderboard',
    body:
      lang === 'fr'
        ? `${name} vient de passer devant toi cette semaine.`
        : `${name} just moved ahead of you this week.`,
    actionHref: '/squad',
    actionLabel: lang === 'fr' ? 'Voir ma ligue' : 'See my league',
  }
}

export function buildKudosNudge(
  count: number,
  peerDisplayName: string | null,
  lang: Lang,
): NudgeCopy | null {
  if (count < 1) return null
  const name = peerDisplayName?.trim()

  if (count === 1 && name) {
    return {
      kind: 'kudos_received',
      title: lang === 'fr' ? 'Chapeau reçu' : 'Kudos received',
      body:
        lang === 'fr'
          ? `${name} a salué ta séance.`
          : `${name} gave kudos to your session.`,
      actionHref: '/squad',
      actionLabel: lang === 'fr' ? 'Voir' : 'See',
    }
  }

  return {
    kind: 'kudos_received',
    title: lang === 'fr' ? 'Chapeau reçu' : 'Kudos received',
    body:
      lang === 'fr'
        ? `${count} coéquipiers ont salué tes séances.`
        : `${count} teammates gave kudos to your sessions.`,
    actionHref: '/squad',
    actionLabel: lang === 'fr' ? 'Voir' : 'See',
  }
}

export interface DuelResultContext {
  opponentDisplayName: string | null
  selfPoints: number
  opponentPoints: number
  lang: Lang
}

export function buildDuelResultNudge(ctx: DuelResultContext): NudgeCopy | null {
  const name = ctx.opponentDisplayName?.trim()
  if (!name) return null

  const won = ctx.selfPoints > ctx.opponentPoints
  const draw = ctx.selfPoints === ctx.opponentPoints

  const body = (() => {
    if (draw) {
      return ctx.lang === 'fr'
        ? `Duel nul contre ${name} : ${ctx.selfPoints} à ${ctx.opponentPoints}.`
        : `Draw against ${name}: ${ctx.selfPoints} to ${ctx.opponentPoints}.`
    }
    if (won) {
      return ctx.lang === 'fr'
        ? `Duel remporté contre ${name} : ${ctx.selfPoints} à ${ctx.opponentPoints}.`
        : `You won your duel against ${name}: ${ctx.selfPoints} to ${ctx.opponentPoints}.`
    }
    // Défaite : on rapporte le résultat sans jugement de valeur.
    return ctx.lang === 'fr'
      ? `${name} termine le duel devant toi : ${ctx.opponentPoints} à ${ctx.selfPoints}.`
      : `${name} finished the duel ahead: ${ctx.opponentPoints} to ${ctx.selfPoints}.`
  })()

  return {
    kind: 'duel_result',
    title: ctx.lang === 'fr' ? 'Duel terminé' : 'Duel over',
    body,
    actionHref: '/squad',
    actionLabel: ctx.lang === 'fr' ? 'Voir les duels' : 'See duels',
  }
}

export function buildDuelInviteNudge(
  challengerDisplayName: string | null,
  lang: Lang,
): NudgeCopy | null {
  const name = challengerDisplayName?.trim()
  if (!name) return null
  return {
    kind: 'duel_invite',
    title: lang === 'fr' ? 'Duel proposé' : 'Duel invite',
    body:
      lang === 'fr'
        ? `${name} te propose un duel sur la semaine.`
        : `${name} challenged you for the week.`,
    actionHref: '/squad',
    actionLabel: lang === 'fr' ? 'Répondre' : 'Respond',
  }
}
