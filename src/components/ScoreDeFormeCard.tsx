import type { ReadinessResult } from '../services/readiness/computeReadinessScore'
import type { CoachInsight } from '../services/home/coachInsights'
import type { Pillar, PillarStatus } from '../services/home/computePillars'
import type { ScoreHistory7d } from '../services/home/computeScoreHistory7d'
import { tr, type Lang } from '../i18n/appLabels'
import { Icon } from './ui'

interface Props {
  current: ReadinessResult
  insight: CoachInsight
  pillars: readonly Pillar[]
  history: ScoreHistory7d
  lang?: Lang
}

const STATUS_LABEL: Record<NonNullable<ReadinessResult['color']>, string> = {
  green: 'Prêt',
  emerald: 'Prêt',
  amber: 'Prudence',
  red: 'Repos conseillé',
}

const STATUS_COLOR: Record<NonNullable<ReadinessResult['color']>, string> = {
  emerald: '#5FAA6E',
  green: '#5FAA6E',
  amber: '#E0A352',
  red: '#D9636A',
}

/**
 * Score de Forme — version Premium débloquée.
 *
 * Carte sombre éditoriale (ink + glow doré) avec :
 *  - Jauge dorée animée (124px) + score 38px italic
 *  - Pill statut (Prêt / Prudence / Repos) + phrase italic 20px
 *  - Sparkline 7j + delta tendance (+6 pts / −18 pts)
 *  - 4 piliers mini-jauges (Charge / Sommeil [bientôt] / Récup / RPE)
 *  - Insight IA Coach contextuel en bas (règles métier locales V1)
 *
 * Pas de CTA bas (decision utilisateur — historique 30j à venir).
 */
export function ScoreDeFormeCard({ current, insight, pillars, history, lang = 'fr' }: Props) {
  const score = Math.max(0, Math.min(100, current.score))
  const statusColor = STATUS_COLOR[current.color] ?? '#E0A352'
  const statusLabel = STATUS_LABEL[current.color] ?? current.label
  const trendColor =
    history.delta >= 0 ? '#5FAA6E' : history.delta < -10 ? '#D9636A' : '#E0A352'
  const trendDelta =
    history.delta >= 0 ? `+${history.delta} pts` : `${history.delta} pts`

  const gaugeR = 52
  const gaugeC = 2 * Math.PI * gaugeR
  const gaugeOffset = gaugeC * (1 - score / 100)

  const [titleLine1, titleLine2] = decomposeTitle(insight)

  return (
    <section
      data-testid="home-score-card"
      aria-label="Score de forme"
      className="relative overflow-hidden rounded-[22px] text-app"
      style={{
        background: 'linear-gradient(135deg, var(--color-text-primary) 0%, #2A1820 100%)',
        padding: '20px 22px 18px',
      }}
    >
      {/* Glow doré + texture cream subtile */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[60px] -right-10 h-[220px] w-[220px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgb(184 137 58 / 0.13), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 0% 100%, rgb(245 242 238 / 0.04) 0%, transparent 50%)',
        }}
      />

      {/* TOP — eyebrow + PRO chip */}
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="block h-[1.5px] w-[18px] bg-pro" />
          <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-pro">
            {tr('score_card_eyebrow', lang)}
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.13em] text-fg"
          style={{ background: 'var(--color-gold)' }}
        >
          <Icon name="sparkle" size={9} color="var(--color-text-primary)" strokeWidth={2.4} />
          Pro
        </span>
      </div>
      <p
        className="relative mb-3.5 text-[10px] leading-snug opacity-55 text-app [text-wrap:pretty]"
        style={{ maxWidth: '92%' }}
      >
        {tr('score_card_composite_hint', lang)}
      </p>

      {/* MIDDLE — gauge + readout */}
      <div className="relative flex items-center gap-4">
        <div className="relative h-[124px] w-[124px] flex-shrink-0">
          <svg
            width="124"
            height="124"
            viewBox="0 0 124 124"
            style={{ transform: 'rotate(-90deg)' }}
            aria-hidden
          >
            <defs>
              <linearGradient id="rfGoldGradPro" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-gold-light)" />
                <stop offset="100%" stopColor="var(--color-gold)" />
              </linearGradient>
            </defs>
            <circle
              cx="62"
              cy="62"
              r={gaugeR}
              fill="none"
              stroke="rgb(245 242 238 / 0.12)"
              strokeWidth="6"
            />
            <circle
              cx="62"
              cy="62"
              r={gaugeR}
              fill="none"
              stroke="url(#rfGoldGradPro)"
              strokeWidth="6"
              strokeDasharray={gaugeC}
              strokeDashoffset={gaugeOffset}
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 8px rgb(184 137 58 / 0.55))',
                transition: 'stroke-dashoffset 0.8s ease',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="font-serif italic font-extrabold leading-none tabular-nums text-pro"
              style={{ fontSize: 38, letterSpacing: '-1.6px' }}
            >
              {score}
            </div>
            <div className="mt-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em] opacity-50">
              / 100
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]"
            style={{
              color: statusColor,
              background: `${statusColor}1A`,
              borderColor: `${statusColor}55`,
            }}
          >
            <span
              aria-hidden
              className="h-[5px] w-[5px] rounded-full"
              style={{ background: statusColor }}
            />
            {statusLabel}
          </div>
          <h3
            className="mt-2 font-serif italic font-extrabold leading-[1.1] text-app [text-wrap:pretty]"
            style={{ fontSize: 20, letterSpacing: '-0.6px' }}
          >
            {titleLine1}
            {titleLine2 && (
              <>
                <br />
                <span className="font-medium opacity-65">{titleLine2}</span>
              </>
            )}
          </h3>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[8px] font-extrabold uppercase tracking-[0.16em] opacity-55">
                {tr('score_card_trend', lang)}
              </span>
              <span
                className="text-[9px] font-bold tabular-nums"
                style={{ color: trendColor }}
              >
                {trendDelta}
              </span>
            </div>
            <Sparkline values={history.values} />
          </div>
        </div>
      </div>

      {/* PILLARS */}
      <div
        className="relative mt-[18px] grid grid-cols-4 gap-2 pt-4"
        style={{ borderTop: '1px solid rgb(245 242 238 / 0.15)' }}
      >
        {pillars.map((p) => (
          <PillarCell key={p.id} pillar={p} lang={lang} />
        ))}
      </div>

      {/* IA INSIGHT */}
      <div
        className="relative mt-3.5 flex items-start gap-2.5 rounded-[14px] px-3.5 py-3"
        style={{
          background: 'rgb(245 242 238 / 0.05)',
          border: '1px solid rgb(245 242 238 / 0.08)',
        }}
      >
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-fg"
          style={{
            background: 'var(--color-gold)',
            boxShadow: '0 0 12px rgb(184 137 58 / 0.5)',
          }}
        >
          <Icon name="sparkle" size={14} color="var(--color-text-primary)" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-pro">
            {tr('score_card_coach', lang)} · {insight.eyebrow}
          </div>
          <p
            className="mt-1 font-serif italic leading-[1.4] text-app [text-wrap:pretty]"
            style={{ fontSize: 13, fontWeight: 500, opacity: 0.9 }}
          >
            {insight.text}
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ values }: { values: readonly number[] }) {
  if (values.length === 0) return <div style={{ height: 22 }} />
  const w = 140
  const h = 22
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return [x, y] as const
  })
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')
  const fillPath = `${path} L ${w} ${h} L 0 ${h} Z`
  const last = pts[pts.length - 1]
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="rfSparkFillPro" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#rfSparkFillPro)" />
      <path
        d={path}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.5"
        fill="var(--color-gold-light)"
        stroke="var(--color-text-primary)"
        strokeWidth="1.2"
      />
    </svg>
  )
}

// ─── PillarCell ──────────────────────────────────────────────────────────────

const PILLAR_COLOR: Record<PillarStatus, string> = {
  good: '#5FAA6E',
  ok: '#E0A352',
  warn: '#D9636A',
}

function PillarCell({ pillar, lang }: { pillar: Pillar; lang: Lang }) {
  if (pillar.locked) {
    return (
      <div className="flex flex-col items-center gap-1.5 opacity-55">
        <div className="relative h-11 w-11">
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            style={{ transform: 'rotate(-90deg)' }}
            aria-hidden
          >
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="rgb(245 242 238 / 0.12)"
              strokeWidth="3"
              strokeDasharray="3 4"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="lock" size={14} color="var(--color-bg-app)" strokeWidth={2.2} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div
            className="text-[9px] font-bold uppercase tracking-[0.08em] opacity-85"
            style={{ color: 'var(--color-bg-app)' }}
          >
            {pillar.label}
          </div>
          <div
            className="rounded px-1.5 py-px text-[7px] font-extrabold uppercase tracking-[0.08em] leading-tight"
            style={{
              color: 'var(--color-gold)',
              border: '1px solid rgb(184 137 58 / 0.55)',
            }}
          >
            {tr('score_card_pillar_soon', lang)}
          </div>
        </div>
      </div>
    )
  }

  const value = pillar.value ?? 0
  const status = pillar.status ?? 'ok'
  const col = PILLAR_COLOR[status]
  const r = 18
  const c = 2 * Math.PI * r
  const offset = c * (1 - value / 100)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-11 w-11">
        <svg
          width="44"
          height="44"
          viewBox="0 0 44 44"
          style={{ transform: 'rotate(-90deg)' }}
          aria-hidden
        >
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke="rgb(245 242 238 / 0.12)"
            strokeWidth="3"
          />
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={col}
            strokeWidth="3"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold tabular-nums"
          style={{ letterSpacing: '-0.3px', color: 'var(--color-bg-app)' }}
        >
          {value}
        </div>
      </div>
      <div
        className="text-[9px] font-bold uppercase tracking-[0.08em] opacity-75"
        style={{ color: 'var(--color-bg-app)' }}
      >
        {pillar.label}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Décompose le titre éditorial en 2 lignes (la 2e en italic 500 et opaque 0.65).
 * Les phrases courtes des insights ("Tu es affûté. Charge bien encaissée.")
 * sont découpées en couples nominaux contextuels par insight.
 */
function decomposeTitle(insight: CoachInsight): [string, string | null] {
  switch (insight.id) {
    case 'baseline':
      return ['Tu es affûté.', 'Charge bien encaissée.']
    case 'highLoad':
      return ['Charge élevée.', "Ajuste l'intensité."]
    case 'lowScore':
      return ['Le corps tire.', "Aujourd'hui : mobilité."]
    case 'tapering':
      return ['Match en vue.', 'Mode affûtage.']
    case 'postMatch':
      return ['Lendemain de match.', 'Place à la récup.']
    case 'highCadence':
      return ['Cadence solide.', 'Pense à la récup.']
    default:
      return [insight.eyebrow, null]
  }
}
