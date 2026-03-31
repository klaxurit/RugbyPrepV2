import { Activity } from 'lucide-react'
import type { ReadinessResult } from '../services/readiness/computeReadinessScore'

const COLOR_MAP: Record<ReadinessResult['color'], { text: string; bg: string; ring: string }> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400', ring: 'stroke-emerald-400' },
  green: { text: 'text-green-400', bg: 'bg-green-400', ring: 'stroke-green-400' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-400', ring: 'stroke-amber-400' },
  red: { text: 'text-red-400', bg: 'bg-red-400', ring: 'stroke-red-400' },
}

const COMP_LABELS: Record<string, string> = {
  acwr: 'Charge',
  fatigue: 'Fatigue',
  recovery: 'Récup',
  matchProximity: 'Match',
}

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
        stroke="rgba(255,255,255,0.08)"
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

export function ReadinessScoreCard({ result }: { result: ReadinessResult }) {
  const c = COLOR_MAP[result.color]
  const components = [
    { key: 'acwr', data: result.components.acwr },
    { key: 'fatigue', data: result.components.fatigue },
    { key: 'recovery', data: result.components.recovery },
    { key: 'matchProximity', data: result.components.matchProximity },
  ].filter((x) => x.data != null)

  return (
    <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-2xl bg-white/10">
          <Activity className="w-4 h-4 text-white/60" />
        </div>
        <h3 className="text-sm font-black text-white">Score de forme</h3>
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
      </div>

      {/* Component breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {components.map(({ key, data }) => (
          <div key={key} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/40 font-bold truncate">{COMP_LABELS[key]}</p>
              <div className="h-1.5 bg-white/10 rounded-full mt-0.5">
                <div
                  className={`h-full rounded-full ${c.bg} opacity-70`}
                  style={{ width: `${data!.score}%`, transition: 'width 0.4s ease' }}
                />
              </div>
            </div>
            <span className="text-[10px] font-black text-white/50 w-6 text-right">{data!.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
