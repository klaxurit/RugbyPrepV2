import { Activity } from 'lucide-react'
import { ScoreDeFormeGauge } from './ScoreDeFormeGauge'
import type { ReadinessResult } from '../services/readiness/computeReadinessScore'

interface Props {
  current: ReadinessResult
}

/**
 * Version Premium du Score de forme — même jauge demi-cercle que le teaser
 * flouté (symétrie visuelle) mais avec la valeur réelle et le label associé.
 */
export function ScoreDeFormeCard({ current }: Props) {
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

      <div className="mt-3">
        <ScoreDeFormeGauge score={current.score} color={current.color} />
      </div>

      <p className="mt-1 text-center text-xs font-bold text-fg-soft">{current.label}</p>
      <p className="mt-1 text-center text-[11px] text-fg-muted">
        60+ Prêt · 40-59 Prudence · &lt;40 Repos conseillé
      </p>
    </section>
  )
}
