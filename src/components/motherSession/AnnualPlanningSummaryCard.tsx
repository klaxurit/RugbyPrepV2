import { CalendarDays, AlertTriangle } from 'lucide-react'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import {
  msCycleLabel,
  msLabel,
} from '../../services/motherSession/motherSessionLabels'

function humanizeTrace(trace: AnnualPlanningContext['planningTrace'], lang: AppLang): string {
  switch (trace.resolutionMode) {
    case 'onboarding_hint':
      return lang === 'fr'
        ? 'Aucun match n\'est encore renseigné. Le plan démarre avec la période choisie à l\'inscription.'
        : 'No match is recorded yet. The plan starts from the season period selected during onboarding.'
    case 'backfilled':
      return lang === 'fr'
        ? 'Aucun calendrier disponible. Un plan de reprise générique est proposé en attendant tes premières données.'
        : 'No calendar is available yet. A generic return-to-training plan is proposed until your first data comes in.'
    case 'calendar_inferred':
      return lang === 'fr'
        ? 'Le plan s\'aligne automatiquement sur les matchs détectés dans ton calendrier.'
        : 'The plan automatically aligns with the matches detected in your calendar.'
    case 'explicit_anchors':
      return lang === 'fr'
        ? 'Le plan suit les dates clés renseignées (début de saison, fin de saison).'
        : 'The plan follows the key dates that were entered (season start, season end).'
    case 'manual_override':
      return lang === 'fr'
        ? 'Le plan a été ajusté manuellement par un encadrant ou via les réglages avancés.'
        : 'The plan was manually adjusted by a coach or through advanced settings.'
  }
}

type AnnualPlanningSummaryCardProps = {
  planningContext: AnnualPlanningContext
  planningInputsWarnings: string[]
  resolutionWarnings: string[]
  companionRecommendations?: string[]
  fatigueLevel: 'normal' | 'high' | 'very_high'
  lang?: AppLang
}

export function AnnualPlanningSummaryCard({
  planningContext,
  planningInputsWarnings,
  resolutionWarnings,
  companionRecommendations,
  fatigueLevel,
  lang = 'fr',
}: AnnualPlanningSummaryCardProps) {
  const trace = planningContext.planningTrace
  const mergedWarnings = [...new Set([...planningInputsWarnings, ...resolutionWarnings])]
    .filter((w) => !w.toLowerCase().includes('recovery override'))

  return (
    <section
      className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5 space-y-4"
      data-testid="annual-planning-summary"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#ff6b35]/15 text-[#ff6b35]">
          <CalendarDays className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#ff6b35]">
            {msLabel('this_week', lang)}
          </h2>
          <p className="mt-1 text-lg font-black text-white leading-tight">
            {msCycleLabel(planningContext.cycle, lang)}
          </p>
          <p
            className="text-sm font-bold text-white/80 mt-0.5"
            data-testid="annual-plan-week-label"
          >
            {planningContext.weekLabel}
          </p>
          {planningContext.cycle === 'in_season' && planningContext.mesocycleWeek != null && (
            <p className="text-[10px] font-bold text-white/40 mt-0.5">
              {lang === 'fr'
                ? `Semaine ${planningContext.mesocycleWeek}/4 — ${planningContext.isDeloadWeek ? 'Décharge' : `Bloc ${(planningContext.mesocycleBlock ?? 1) % 2 === 1 ? 'Force' : 'Puissance'}`}`
                : `Week ${planningContext.mesocycleWeek}/4 — ${planningContext.isDeloadWeek ? 'Deload' : `${(planningContext.mesocycleBlock ?? 1) % 2 === 1 ? 'Force' : 'Power'} Block`}`
              }
            </p>
          )}
        </div>
      </div>

      {/* Recovery override: chip + phrase + disclosure */}
      {planningContext.loadManagementOverride === 'recovery' ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-900/10 px-3 py-2.5 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-900/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">
            {msLabel('light_week_chip', lang)}
          </span>
          <p className="text-xs font-bold text-amber-300">
            {msLabel('recovery_explanation', lang)}
          </p>
          <details>
            <summary className="text-[10px] font-black uppercase tracking-wide text-amber-400/60 cursor-pointer select-none">
              {msLabel('recovery_why_title', lang)}
            </summary>
            <p className="mt-1.5 text-xs text-amber-200/70 leading-relaxed">
              {msLabel('recovery_why_body', lang)}
            </p>
          </details>
        </div>
      ) : fatigueLevel !== 'normal' ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-900/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">
          {lang === 'fr'
            ? (fatigueLevel === 'very_high' ? 'Fatigue très élevée' : 'Fatigue élevée')
            : (fatigueLevel === 'very_high' ? 'Very high fatigue' : 'High fatigue')}
        </span>
      ) : null}

      <details className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
        <summary className="text-[10px] font-black uppercase tracking-wide text-white/40 cursor-pointer select-none">
          {lang === 'fr' ? 'Pourquoi ce plan ?' : 'Why this plan?'}
        </summary>
        <p className="mt-2 text-xs text-white/55 leading-relaxed">
          {humanizeTrace(trace, lang)}
        </p>
      </details>

      {companionRecommendations && companionRecommendations.length > 0 && (
        <div className="rounded-2xl border border-[#ff6b35]/25 bg-[#ff6b35]/5 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#ff6b35] mb-1.5">
            {msLabel('companion_conditioning', lang)}
          </p>
          <ul className="space-y-1 text-xs text-white/70">
            {companionRecommendations.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      )}

      {mergedWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-900/10 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-amber-400 mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {lang === 'fr' ? 'Avertissements' : 'Warnings'}
          </p>
          <ul className="space-y-1.5 text-xs text-amber-200/90">
            {mergedWarnings.map((w) => (
              <li key={w} className="leading-snug">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
