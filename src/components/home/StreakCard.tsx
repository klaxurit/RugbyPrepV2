import { Icon, SectionLabel } from '../ui'
import type { StreakResult } from '../../services/home/computeStreak'

interface StreakCardProps {
  streak: StreakResult
}

/**
 * Carte "Ta cadence" — flamme dorée + compteur géant + caption italic Playfair
 * + mini-barres semaine (14 derniers jours).
 */
export function StreakCard({ streak }: StreakCardProps) {
  return (
    <section className="px-[22px] pt-6">
      <SectionLabel label="Ta cadence" />

      <div className="mt-3 flex items-center gap-[18px] rounded-[20px] border border-paper-deep bg-paper-soft px-[22px] py-5">
        {/* Flamme géante avec glow doré pulsant */}
        <div className="relative flex-shrink-0">
          <div
            aria-hidden
            className="absolute inset-0 h-16 w-16 rounded-full animate-rf-pulse"
            style={{
              background: 'radial-gradient(circle at 50% 60%, rgba(184, 137, 58, 0.3), transparent 70%)',
              animationDuration: '3s',
            }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center">
            <Icon name="flame" size={42} color="var(--color-gold)" strokeWidth={2.2} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <div
              className="text-[38px] font-extrabold leading-none tabular-nums text-fg"
              style={{ letterSpacing: '-1.5px' }}
            >
              {streak.count}
            </div>
            <div className="text-[13px] font-bold text-fg/60">
              séance{streak.count > 1 ? 's' : ''}
            </div>
          </div>

          <div className="mt-0.5 font-serif italic text-[16px] font-medium text-fg/85 leading-tight [text-wrap:balance]">
            {streak.caption}
          </div>

          {/* Mini-barres 14 jours */}
          <div className="mt-2.5 flex gap-1">
            {streak.weekHistory.map((on, i) => (
              <div
                key={i}
                className={`h-3.5 w-2 rounded-sm ${on ? 'bg-brand' : 'bg-paper-deep'}`}
                style={on ? { opacity: 0.4 + i * 0.05 } : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
