import { isDateInISOWeek } from '../scheduling/weekSnapshot'
import type { MatchKind } from '../../types/training'

export type ProgramEvolutionAfterManualMatchPlan =
  | { action: 'none'; dismissSchedulingBanner: boolean }
  | { action: 'open_sheet'; matchDateISO: string; dismissSchedulingBanner: boolean }

function daysUntil(fromIso: string, toIso: string): number {
  const parse = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).getTime()
  }
  const a = parse(fromIso)
  const b = parse(toIso)
  if (a == null || b == null) return 0
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

/**
 * Évite d’empiler {@link ProgramEvolutionSheet} après {@link MatchKindFollowUpSheet} :
 * - amical → rien (profil déjà mis à jour)
 * - match dans la semaine courante → Cat. C (`useWeekSnapshotConfirmationSheet`)
 * - match ≤ 7 j → notice globale (`ProgramChangeMount`)
 * - au-delà → une seule sheet récap optionnelle
 */
export function planProgramEvolutionAfterManualMatch(args: {
  matchDate: string
  today: string
  kind: MatchKind
  snapshotWeekId?: string
}): ProgramEvolutionAfterManualMatchPlan {
  const dismissSchedulingBanner = true
  if (args.kind === 'friendly') {
    return { action: 'none', dismissSchedulingBanner }
  }
  if (args.snapshotWeekId && isDateInISOWeek(args.matchDate, args.snapshotWeekId)) {
    return { action: 'none', dismissSchedulingBanner }
  }
  if (daysUntil(args.today, args.matchDate) <= 7) {
    return { action: 'none', dismissSchedulingBanner }
  }
  return {
    action: 'open_sheet',
    matchDateISO: args.matchDate,
    dismissSchedulingBanner,
  }
}
