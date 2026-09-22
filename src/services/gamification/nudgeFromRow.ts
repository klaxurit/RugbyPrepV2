import type { Lang } from '../../i18n/appLabels'
import type { AthleteLevel, LeagueTier, SocialNudge } from '../../types/gamification'
import {
  buildClubPulseNudge,
  buildDuelInviteNudge,
  buildDuelResultNudge,
  buildKudosNudge,
  buildLeagueOvertakenNudge,
  buildLeaguePromotionNudge,
  buildLevelUpNudge,
  type NudgeCopy,
} from './nudgeCopy'
import { LEAGUE_TIER_ORDER, LEVEL_THRESHOLDS } from './scoreConstants'

/**
 * Traduction d'une ligne `social_nudges` en nudge affichable.
 *
 * La base ne stocke que le **fait** (`kind` + `payload`), jamais le texte :
 * la rédaction reste côté client, donc la langue suit `preferredLanguage` même
 * si l'athlète en change après coup, et une correction de formulation n'a pas
 * besoin de réécrire des lignes déjà en file.
 *
 * Renvoie `null` quand le payload ne permet pas d'énoncer un fait vérifiable —
 * un nudge à trous ne s'affiche pas.
 */

export interface NudgeRowLike {
  id: string
  kind: string
  payload: Record<string, unknown> | null
  created_at: string
}

function readString(payload: Record<string, unknown> | null, key: string): string | null {
  const value = payload?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function readNumber(payload: Record<string, unknown> | null, key: string): number | null {
  const value = payload?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readLevel(payload: Record<string, unknown> | null): AthleteLevel | null {
  const value = readString(payload, 'level')
  const known = LEVEL_THRESHOLDS.some((threshold) => threshold.level === value)
  return known ? (value as AthleteLevel) : null
}

function readTier(payload: Record<string, unknown> | null): LeagueTier | null {
  const value = readString(payload, 'tier')
  return LEAGUE_TIER_ORDER.includes(value as LeagueTier) ? (value as LeagueTier) : null
}

function buildCopy(row: NudgeRowLike, lang: Lang): NudgeCopy | null {
  const payload = row.payload

  switch (row.kind) {
    case 'level_up': {
      const level = readLevel(payload)
      return level ? buildLevelUpNudge(level, lang) : null
    }
    case 'league_promotion': {
      const tier = readTier(payload)
      return tier ? buildLeaguePromotionNudge(tier, lang) : null
    }
    case 'league_overtaken':
      return buildLeagueOvertakenNudge(readString(payload, 'peerDisplayName'), lang)
    case 'kudos_received':
      return buildKudosNudge(
        readNumber(payload, 'count') ?? 0,
        readString(payload, 'peerDisplayName'),
        lang,
      )
    case 'duel_result':
      return buildDuelResultNudge({
        opponentDisplayName: readString(payload, 'opponentDisplayName'),
        selfPoints: readNumber(payload, 'selfPoints') ?? 0,
        opponentPoints: readNumber(payload, 'opponentPoints') ?? 0,
        lang,
      })
    case 'duel_invite':
      return buildDuelInviteNudge(readString(payload, 'challengerDisplayName'), lang)
    case 'club_pulse':
      return buildClubPulseNudge({
        clubName: readString(payload, 'clubName'),
        athletesOnPlan: readNumber(payload, 'athletesOnPlan') ?? 0,
        lang,
      })
    // `peer_emulation` dépend du contexte du jour de l'athlète (séance prévue,
    // veille de match, zone ACWR) : il est construit dans le client à partir
    // de `buildPeerEmulationNudge`, pas depuis la file serveur.
    default:
      return null
  }
}

export function nudgeRowToSocialNudge(row: NudgeRowLike, lang: Lang): SocialNudge | null {
  const copy = buildCopy(row, lang)
  if (!copy) return null
  return {
    id: row.id,
    kind: copy.kind,
    title: copy.title,
    body: copy.body,
    actionHref: copy.actionHref,
    actionLabel: copy.actionLabel,
    createdAt: row.created_at,
  }
}
