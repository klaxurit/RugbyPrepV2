import { useState } from 'react'
import { Activity, Info, ChevronDown } from 'lucide-react'
import type { ReadinessResult } from '../services/readiness/computeReadinessScore'

const COLOR_MAP: Record<ReadinessResult['color'], { text: string; bg: string; ring: string }> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400', ring: 'stroke-emerald-400' },
  green: { text: 'text-green-400', bg: 'bg-green-400', ring: 'stroke-green-400' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-400', ring: 'stroke-amber-400' },
  red: { text: 'text-red-400', bg: 'bg-red-400', ring: 'stroke-red-400' },
}

const COMP_LABELS: Record<string, string> = {
  acwr: 'Charge',
  fatigue: 'Fraîcheur',
  recovery: 'Récup',
  matchProximity: 'Match',
}

const COMP_HELP: Record<string, string> = {
  acwr: 'Charge : équilibre entre charge aiguë (7j) et chronique (4 sem).',
  fatigue: 'Fraîcheur : 100 = frais, 0 = fatigué. Basé sur ton check-in du jour.',
  recovery: 'Récup : qualité du repos depuis la dernière séance.',
  matchProximity: 'Match : proximité du prochain match (affûtage / récup post-match).',
}

const ALL_KEYS: (keyof typeof COMP_LABELS)[] = ['acwr', 'fatigue', 'recovery', 'matchProximity']

function GaugeArc({ score, color }: { score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, score))
  // Semi-circle: r=44, circumference of half-circle = π*44 ≈ 138.2
  const halfCirc = Math.PI * 44
  const offset = halfCirc - (pct / 100) * halfCirc

  return (
    <svg viewBox="0 0 100 55" className="w-full max-w-[160px]">
      {/* Background arc */}
      <path
        d="M 6 50 A 44 44 0 0 1 94 50"
        fill="none"
        stroke="rgba(44,24,16,0.08)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Filled arc */}
      <path
        d="M 6 50 A 44 44 0 0 1 94 50"
        fill="none"
        className={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={halfCirc}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

export function ReadinessScoreCard({
  result,
  compact = false,
}: {
  result: ReadinessResult
  /** Version compacte (1 ligne + expand) — à utiliser quand l'accueil n'a pas de séance du jour. */
  compact?: boolean
}) {
  const c = COLOR_MAP[result.color]
  const [showHelp, setShowHelp] = useState(false)
  const [expanded, setExpanded] = useState(!compact)

  const components = ALL_KEYS.map((key) => ({
    key,
    data: result.components[key as keyof typeof result.components],
  }))
  const availableCount = components.filter((x) => x.data != null).length

  // ── Version compacte : 1 ligne cliquable qui peut s'étendre
  if (compact && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full bg-layer-5 border border-border-app rounded-[24px] p-4 flex items-center justify-between gap-3 hover:bg-layer-7 transition-colors rf-focus-ring"
        aria-expanded="false"
        aria-label={`Score de forme ${result.score} — ${result.label}. Appuyez pour voir le détail.`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-2xl bg-layer-10 flex-shrink-0">
            <Activity className="w-4 h-4 text-fg-muted" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[11px] font-bold text-fg-muted uppercase tracking-wider">Score de forme</p>
            <p className={`text-lg font-black leading-tight ${c.text}`}>
              {result.score}
              <span className="text-xs font-bold text-fg-soft ml-2">{result.label}</span>
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-fg-faint flex-shrink-0" />
      </button>
    )
  }

  return (
    <div className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-layer-10">
            <Activity className="w-4 h-4 text-fg-muted" />
          </div>
          <h3 className="text-sm font-black text-fg">Score de forme</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-layer-10 rf-focus-ring"
            aria-label="Comment le score est calculé"
            aria-expanded={showHelp}
          >
            <Info className="w-4 h-4" />
          </button>
          {compact && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-layer-10 rf-focus-ring"
              aria-label="Réduire"
            >
              <ChevronDown className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Gauge + score */}
      <div className="flex flex-col items-center -mt-1">
        <div className="relative">
          <GaugeArc score={result.score} color={c.ring} />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
            <span className={`text-3xl font-black ${c.text}`}>{result.score}</span>
          </div>
        </div>
        <span className={`text-xs font-bold ${c.text} -mt-2`}>{result.label}</span>
        <p className="text-[11px] text-fg-muted mt-1">60+ Prêt · 40-59 Prudence · &lt;40 Repos conseillé</p>
      </div>

      {/* Help / explanation */}
      {showHelp && (
        <div className="rounded-2xl border border-border-app bg-layer-2 p-3 text-[12px] leading-snug text-fg-secondary space-y-1.5">
          <p className="font-bold text-fg">4 composantes pondérées :</p>
          {ALL_KEYS.map((key) => (
            <p key={key}><span className="font-semibold">{COMP_LABELS[key]}</span> — {COMP_HELP[key].split(':')[1].trim()}</p>
          ))}
          {availableCount < 4 && (
            <p className="pt-1 italic text-fg-muted">
              Aujourd'hui {availableCount}/4 composantes disponibles. Les autres seront intégrées quand les données s'accumulent (charge, match planifié…).
            </p>
          )}
        </div>
      )}

      {/* Component breakdown — toujours 4 cases, greyed si manquant */}
      <div className="grid grid-cols-2 gap-2">
        {components.map(({ key, data }) => {
          const available = data != null
          return (
            <div key={key} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold truncate ${available ? 'text-fg-muted' : 'text-fg-ghost'}`}>
                  {COMP_LABELS[key]}
                </p>
                <div className="h-1.5 bg-layer-10 rounded-full mt-0.5">
                  {available && (
                    <div
                      className={`h-full rounded-full ${c.bg} opacity-70`}
                      style={{ width: `${data!.score}%`, transition: 'width 0.4s ease' }}
                    />
                  )}
                </div>
              </div>
              <span className={`text-[11px] font-black w-7 text-right ${available ? 'text-fg-muted' : 'text-fg-ghost'}`}>
                {available ? data!.score : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
