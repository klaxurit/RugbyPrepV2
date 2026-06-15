import { Icon, SectionLabel } from '../ui'
import type { StreakResult } from '../../services/home/computeStreak'
import { useProfile } from '../../hooks/useProfile'
import { tr, type Lang } from '../../i18n/appLabels'

interface StreakCardProps {
  streak: StreakResult
}

/**
 * Carte "Ta cadence" — flamme dorée + caption italic Playfair
 * + mini-barres 14 jours (la récence se lit sur les barres, pas via un compteur).
 */
export function StreakCard({ streak }: StreakCardProps) {
  const { profile } = useProfile()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')
  return (
    <section className="px-[22px] pt-6">
      <SectionLabel label={tr('streak_eyebrow', lang)} />

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
          <div
            className="font-serif italic text-[18px] font-medium text-fg/90 leading-snug [text-wrap:balance]"
            aria-label={`${streak.count} ${streak.count > 1 ? tr('streak_session_plural', lang) : tr('streak_session_single', lang)} sur 14 jours`}
          >
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
