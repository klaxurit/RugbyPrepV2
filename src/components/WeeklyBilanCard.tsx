import { Activity, BarChart3, Flame, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import type { WeeklyBilan } from '../services/weeklyBilan/computeWeeklyBilan'
import type { ACWRResult, ACWRZone } from '../hooks/useACWR'
import { getExerciseName } from '../data/exercises'

interface Props {
  bilan: WeeklyBilan
  acwr: ACWRResult
  lang?: 'fr' | 'en'
}

const ZONE_CONFIG: Record<ACWRZone, { label: string; tone: string; message: string }> = {
  underload: {
    label: 'Sous-charge',
    tone: 'text-info',
    message: 'Tu peux pousser un peu plus cette semaine.',
  },
  optimal: {
    label: 'Optimal',
    tone: 'text-ok-strong',
    message: 'Charge équilibrée — garde le cap.',
  },
  caution: {
    label: 'Vigilance',
    tone: 'text-warn-strong',
    message: 'Volume élevé — surveille la récupération.',
  },
  danger: {
    label: 'Danger',
    tone: 'text-alert',
    message: 'Risque de blessure — allège la prochaine séance.',
  },
  critical: {
    label: 'Critique',
    tone: 'text-alert',
    message: 'Deload fortement recommandé.',
  },
}

function formatWeekRange(startISO: string, endISO: string): string {
  const s = new Date(`${startISO}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const e = new Date(`${endISO}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${s} → ${e}`
}

function DeltaChip({ value, unit = '', positiveIsGood = true }: { value: number | null; unit?: string; positiveIsGood?: boolean }) {
  if (value == null || value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-fg-faint">
        —
      </span>
    )
  }
  const isPositive = value > 0
  const isGood = positiveIsGood ? isPositive : !isPositive
  const tone = isGood ? 'text-ok-strong' : 'text-alert'
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${tone}`}>
      <Icon className="w-3 h-3" />
      {isPositive ? '+' : ''}{value}{unit}
    </span>
  )
}

/**
 * Bilan de la semaine — card Premium affichée en tête de /progress.
 * Agrège les séances, tonnage, RPE et ACWR de la semaine écoulée pour
 * justifier la valeur Premium du lien "Voir le bilan complet de la semaine".
 */
export function WeeklyBilanCard({ bilan, acwr, lang = 'fr' }: Props) {
  const zoneCfg = acwr.zone ? ZONE_CONFIG[acwr.zone] : null

  return (
    <section
      data-testid="weekly-bilan-card"
      aria-label="Bilan de la semaine"
      className="rounded-[24px] border border-brand-border bg-brand-soft/40 p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-brand-tint">
            Bilan de la semaine
          </p>
          <p className="text-[11px] text-fg-muted mt-0.5">{formatWeekRange(bilan.weekStart, bilan.weekEnd)}</p>
        </div>
        <BarChart3 className="w-4 h-4 text-brand-tint" aria-hidden="true" />
      </div>

      {/* Grid 2×2 : séances · tonnage · RPE · ACWR */}
      <div className="grid grid-cols-2 gap-3">
        <StatCell
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Séances"
          value={`${bilan.sessionsDone}`}
          delta={<DeltaChip value={bilan.sessionsDelta} positiveIsGood />}
        />
        <StatCell
          icon={<Flame className="w-3.5 h-3.5" />}
          label="Tonnage"
          value={bilan.tonnageKg != null ? `${formatKg(bilan.tonnageKg)} kg` : '—'}
          delta={<DeltaChip value={bilan.tonnageDeltaPct} unit="%" positiveIsGood />}
        />
        <StatCell
          icon={<Activity className="w-3.5 h-3.5" />}
          label="RPE moyen"
          value={bilan.avgRpe != null ? `${bilan.avgRpe}/10` : '—'}
          delta={<DeltaChip value={bilan.avgRpeDelta} positiveIsGood={false} />}
        />
        <StatCell
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Charge (ACWR)"
          value={acwr.acwr != null ? acwr.acwr.toFixed(2) : '—'}
          delta={
            zoneCfg ? (
              <span className={`text-[10px] font-bold ${zoneCfg.tone}`}>{zoneCfg.label}</span>
            ) : (
              <span className="text-[10px] font-bold text-fg-faint">—</span>
            )
          }
        />
      </div>

      {/* Zone ACWR — message interprétatif */}
      {zoneCfg && (
        <p className="text-[11px] text-fg-soft leading-relaxed">
          {zoneCfg.message}
        </p>
      )}

      {/* Top progressions */}
      {bilan.topProgressions.length > 0 && (
        <div className="pt-3 border-t border-brand-border/60 space-y-2">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-brand-tint" />
            <p className="text-[11px] font-black uppercase tracking-wider text-brand-tint">
              Top progressions
            </p>
          </div>
          <ul className="space-y-1.5">
            {bilan.topProgressions.map((p) => (
              <li key={p.exerciseId} className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-fg truncate">
                  {getExerciseName(p.exerciseId, lang)}
                </span>
                <span className="text-[11px] font-black text-ok-strong tabular-nums whitespace-nowrap">
                  +{p.deltaKg} kg
                  <span className="text-fg-faint font-bold ml-1">
                    ({p.previousKg} → {p.currentKg})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function StatCell({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-layer-5 border border-border-app p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-fg-muted">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline justify-between gap-1.5">
        <span className="text-lg font-black text-fg leading-none tabular-nums">{value}</span>
        {delta}
      </div>
    </div>
  )
}

function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace(/\.0$/, '')} k`
  return String(kg)
}
