/**
 * Contexte chat = horloge annuelle, pas le CycleWeek W1 vestigial.
 */
import type { AnnualCycle, AnnualPlanningContext } from '../../types/annualPlanning'
import type { ProgramPhase } from '../../types/training'
import { cyclePhaseLabel, type Lang } from '../../i18n/appLabels'

export function chatPhaseFromPlanning(
  ctx: Pick<AnnualPlanningContext, 'cycle' | 'isDeloadWeek'>,
): ProgramPhase | null {
  if (ctx.isDeloadWeek) return null
  switch (ctx.cycle) {
    case 'off_season':
      return 'HYPERTROPHY'
    case 'pre_season':
      return 'POWER'
    case 'in_season':
    case 'playoffs':
      return 'FORCE'
    default:
      return null
  }
}

export function localizeChatWeekLabel(label: string, lang: Lang): string {
  let out = label
    .replace(/\bOff[-_]season\b/gi, cyclePhaseLabel('off_season', lang))
    .replace(/\bPre[-_]season\b/gi, cyclePhaseLabel('pre_season', lang))
    .replace(/\bIn[-_]season\b/gi, cyclePhaseLabel('in_season', lang))
  if (lang === 'fr') out = out.replace(/ - W(\d+)/, ' - S$1')
  return out
}

export function chatWeekLabelFromPlanning(
  ctx: Pick<AnnualPlanningContext, 'weekLabel' | 'cycle' | 'weekNumber' | 'isDeloadWeek'>,
  lang: Lang,
): string {
  if (ctx.weekLabel) return localizeChatWeekLabel(ctx.weekLabel, lang)
  const cycle = ctx.cycle as AnnualCycle
  const n = ctx.weekNumber ?? 0
  const base = `${cyclePhaseLabel(cycle, lang)} — S${n}`
  return ctx.isDeloadWeek ? `${base} · ${lang === 'en' ? 'deload' : 'récup'}` : base
}
