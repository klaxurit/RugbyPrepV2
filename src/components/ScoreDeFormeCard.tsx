import { TrendingUp, Activity } from 'lucide-react'
import { ScoreDeFormeChart } from './ScoreDeFormeChart'
import type { ReadinessResult } from '../services/readiness/computeReadinessScore'

interface Props {
  /** 7 valeurs 0-10 (j-6 … j0). */
  values: number[]
  /** Résultat courant (score 0-100 + label + color). */
  current: ReadinessResult
}

const COLOR_TEXT: Record<ReadinessResult['color'], string> = {
  emerald: 'text-emerald-500',
  green: 'text-green-500',
  amber: 'text-amber-500',
  red: 'text-red-500',
}

/**
 * Version Premium du Score de forme — même layout visuel que le teaser flouté
 * (Whoop/Oura pattern) mais avec la vraie courbe en clair + le score du jour.
 */
export function ScoreDeFormeCard({ values, current }: Props) {
  const todayValue = values[values.length - 1] ?? 0
  const prevValue = values.length > 1 ? values[values.length - 2] : todayValue
  const delta = Math.round((todayValue - prevValue) * 10) / 10

  return (
    <section
      data-testid="home-score-card"
      aria-label="Score de forme"
      className="rounded-[24px] border border-brand-border bg-brand-soft/40 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-wider text-brand-tint">
          Ton score de forme
        </p>
        <Activity aria-hidden="true" className="w-4 h-4 text-brand-tint" />
      </div>

      <div className="mt-4 flex items-stretch gap-2">
        <ScoreDeFormeChart
          values={values}
          ariaLabel={`Score de forme sur 7 jours — aujourd'hui ${todayValue}/10`}
        />
        <div className="flex flex-col justify-between text-[10px] font-bold text-fg-faint tabular-nums py-0.5">
          <span>10</span>
          <span>5</span>
          <span>0</span>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-fg-muted">
        <span>7 derniers jours</span>
        <span>Aujourd'hui</span>
      </div>

      {/* Score du jour + label + delta */}
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black leading-none ${COLOR_TEXT[current.color]}`}>
              {current.score}
            </span>
            <span className="text-sm font-bold text-fg-soft leading-none">/100</span>
          </div>
          <p className="text-[11px] font-bold text-fg-muted mt-1">{current.label}</p>
        </div>
        {delta !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
              delta > 0 ? 'text-ok-strong' : 'text-alert'
            }`}
          >
            <TrendingUp className={`w-3 h-3 ${delta < 0 ? 'rotate-180' : ''}`} />
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </section>
  )
}
