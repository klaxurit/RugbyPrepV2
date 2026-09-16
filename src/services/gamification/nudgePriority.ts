import type { NudgeKind, SocialNudge } from '../../types/gamification'
import { NUDGE_RULES } from './scoreConstants'

/**
 * Sélection du nudge social à afficher.
 *
 * L'app monte déjà beaucoup d'overlays globaux (consentement cookies, offre
 * Founding, invite notifications, prompt de mise à jour PWA, compagnon coach,
 * sheet d'évolution du programme, sheet de fin de séance, toasts de record).
 * Une pop-up sociale de plus sans arbitrage produirait du bruit, pas un nudge.
 *
 * Trois garde-fous : une seule interruption par ouverture, deux par semaine,
 * et jamais pendant une séance en cours.
 *
 * Le réengagement efficace vient d'un **événement réel** (« quelqu'un vient de
 * te passer »), pas d'une relance générique (« tu ne t'es pas entraîné depuis
 * trois jours »). Chaque `NudgeKind` correspond donc à un fait constaté, et
 * cette fonction ne fabrique rien : elle trie et filtre.
 */

/**
 * Ordre de priorité, du plus fort au plus faible.
 *
 * Les événements qui concernent directement l'athlète (son niveau, sa ligue,
 * son duel) passent devant l'information d'ambiance sur le club.
 */
const KIND_PRIORITY: readonly NudgeKind[] = [
  'level_up',
  'league_promotion',
  'duel_result',
  'league_overtaken',
  'duel_invite',
  'kudos_received',
  'peer_emulation',
  'club_pulse',
]

export interface NudgeSelectionContext {
  candidates: readonly SocialNudge[]
  /** Nudges déjà affichés sur la semaine glissante. */
  nudgesShownThisWeek: number
  /** Une séance est en cours (`SessionRunContext` actif). */
  isSessionRunning: boolean
  /**
   * Un overlay bloquant est monté (consentement cookies, offre Founding,
   * confirmation de semaine…). La gamification n'a jamais la priorité sur eux.
   */
  hasBlockingOverlay: boolean
  /** Horodatage courant, ISO. */
  nowISO: string
}

function isExpired(nudge: SocialNudge, nowISO: string): boolean {
  const created = new Date(nudge.createdAt).getTime()
  if (!Number.isFinite(created)) return true
  const now = new Date(nowISO).getTime()
  if (!Number.isFinite(now)) return false
  return now - created > NUDGE_RULES.TTL_HOURS * 3_600_000
}

function priorityOf(kind: NudgeKind): number {
  const index = KIND_PRIORITY.indexOf(kind)
  return index < 0 ? KIND_PRIORITY.length : index
}

/**
 * Renvoie le nudge à afficher, ou null si aucun ne doit l'être.
 *
 * À égalité de priorité, le plus récent gagne : un dépassement au classement
 * d'il y a deux jours n'a plus d'intérêt si un autre vient d'avoir lieu.
 */
export function selectNudge(context: NudgeSelectionContext): SocialNudge | null {
  if (context.isSessionRunning) return null
  if (context.hasBlockingOverlay) return null
  if (context.nudgesShownThisWeek >= NUDGE_RULES.MAX_PER_WEEK) return null

  const eligible = context.candidates.filter((n) => !isExpired(n, context.nowISO))
  if (eligible.length === 0) return null

  return [...eligible].sort((a, b) => {
    const priority = priorityOf(a.kind) - priorityOf(b.kind)
    if (priority !== 0) return priority
    const recency =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (recency !== 0) return recency
    return a.id.localeCompare(b.id)
  })[0]
}

/**
 * Les nudges à célébrer en `BottomSheet` plutôt qu'en toast discret. Un
 * passage de niveau ou une promotion de ligue mérite une interruption pleine ;
 * un kudos ou le pouls du club, non.
 */
const SHEET_KINDS: readonly NudgeKind[] = ['level_up', 'league_promotion']

export function nudgePresentation(kind: NudgeKind): 'sheet' | 'toast' {
  return SHEET_KINDS.includes(kind) ? 'sheet' : 'toast'
}
