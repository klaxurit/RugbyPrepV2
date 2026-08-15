/**
 * Proxy amateur de charge de contact club (World Rugby → pas le rail 15 min).
 * Déclaration joueur : léger / normal / dur, scopée à la semaine ISO.
 */

import type { AnnualCycle, AnnualPlanningContext, ClubContactProxy } from '../../types/annualPlanning'
import { startOfIsoWeek } from '../weeklyBilan/computeWeeklyBilan'

export const CLUB_CONTACT_PROXIES = ['light', 'normal', 'hard'] as const

export type ClubContactWeek = {
  weekStartIso: string
  level: ClubContactProxy
}

export function isClubContactProxy(value: unknown): value is ClubContactProxy {
  return value === 'light' || value === 'normal' || value === 'hard'
}

export function resolveClubContactProxy(
  stored: ClubContactWeek | undefined,
  todayIso: string,
): ClubContactProxy {
  if (!stored || stored.weekStartIso !== startOfIsoWeek(todayIso)) return 'normal'
  return isClubContactProxy(stored.level) ? stored.level : 'normal'
}

export function shouldApplyHardClubCut(ctx: Pick<
  AnnualPlanningContext,
  'cycle' | 'clubContactProxy' | 'loadManagementOverride' | 'isDeloadWeek' | 'playoffTaperPhase'
>): boolean {
  if ((ctx.clubContactProxy ?? 'normal') !== 'hard') return false
  if (ctx.cycle !== 'in_season' && ctx.cycle !== 'playoffs') return false
  if (ctx.loadManagementOverride === 'recovery') return false
  if (ctx.isDeloadWeek) return false
  if (ctx.playoffTaperPhase === 'taper_2' || ctx.playoffTaperPhase === 'match_week') return false
  return true
}

export function applyClubContactProxyToSessions<
  T extends { variant?: 'normal' | 'light'; maxBlocks?: number },
>(sessions: T[], ctx: Parameters<typeof shouldApplyHardClubCut>[0]): T[] {
  if (!shouldApplyHardClubCut(ctx)) return sessions
  return sessions.map((slot) => ({
    ...slot,
    variant: 'light' as const,
    maxBlocks: Math.min(slot.maxBlocks ?? 3, 3),
  }))
}

/**
 * Copy joueur : jamais « 15 min ». Dur même hors match ; léger uniquement
 * en semaine de match (sinon on laisse Hu).
 */
export function clubContactLoadTip(ctx: {
  cycle: AnnualCycle
  isMatchWeek: boolean
  daysUntilNextMatch: number | null
  clubContactProxy?: ClubContactProxy
}): string | undefined {
  if (ctx.cycle !== 'in_season' && ctx.cycle !== 'playoffs') return undefined
  const proxy = ctx.clubContactProxy ?? 'normal'
  const matchWeek =
    ctx.isMatchWeek || (ctx.daysUntilNextMatch != null && ctx.daysUntilNextMatch <= 6)

  if (proxy === 'hard') {
    return 'Club dur cette semaine (plaquages, mêlée, rucks) — la salle reste courte et propre, pas un second match.'
  }
  if (proxy === 'light') {
    if (!matchWeek) return undefined
    return 'Club plus léger cette semaine — tu peux faire la séance salle complète.'
  }
  if (!matchWeek) return undefined
  return 'Le contact au club (plaquages, mêlée, rucks) compte autant que la salle — cette semaine, vise la qualité, pas le volume.'
}
