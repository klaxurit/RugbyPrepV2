/**
 * Jauge demi-cercle du score de forme — partagée par le teaser free
 * (floutée, chiffre masqué) et la card Premium (en clair).
 */
import type { ReadinessResult } from '../services/readiness/computeReadinessScore'

interface Props {
  score: number // 0-100
  color: ReadinessResult['color']
  blurred?: boolean
  /** Chiffre à afficher au centre. Quand `blurred`, on peut afficher un "••" décoratif. */
  display?: string
  /** `sm` = ~100px (teaser free, compact), `md` = ~180px (card premium). */
  size?: 'sm' | 'md'
}

const RING_CLASS: Record<ReadinessResult['color'], string> = {
  emerald: 'stroke-emerald-400',
  green: 'stroke-green-400',
  amber: 'stroke-amber-400',
  red: 'stroke-red-400',
}

const TEXT_CLASS: Record<ReadinessResult['color'], string> = {
  emerald: 'text-emerald-500',
  green: 'text-green-500',
  amber: 'text-amber-500',
  red: 'text-red-500',
}

export function ScoreDeFormeGauge({ score, color, blurred = false, display, size = 'md' }: Props) {
  const pct = Math.max(0, Math.min(100, score))
  // Semi-cercle : r=44, circonférence demi = π·44 ≈ 138.2
  const halfCirc = Math.PI * 44
  const offset = halfCirc - (pct / 100) * halfCirc
  const label = display ?? String(score)
  const maxW = size === 'sm' ? 'max-w-[110px]' : 'max-w-[180px]'
  const textSize = size === 'sm' ? 'text-xl' : 'text-3xl'

  return (
    <div className={`relative w-full ${maxW} mx-auto`}>
      <svg viewBox="0 0 100 55" className="w-full">
        {/* Arc de fond */}
        <path
          d="M 6 50 A 44 44 0 0 1 94 50"
          fill="none"
          stroke="rgba(44,24,16,0.08)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Arc rempli */}
        <path
          d="M 6 50 A 44 44 0 0 1 94 50"
          fill="none"
          className={RING_CLASS[color]}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={halfCirc}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Chiffre central — flouté en teaser, net en premium */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
        <span
          className={`${textSize} font-black ${TEXT_CLASS[color]}`}
          style={blurred ? { filter: 'blur(10px)' } : undefined}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
