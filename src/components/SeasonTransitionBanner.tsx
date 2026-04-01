import { Calendar, Sparkles, Trophy, X } from 'lucide-react'
import type { SeasonTransition } from '../services/season/detectSeasonTransitions'

interface SeasonTransitionBannerProps {
  transition: SeasonTransition
  onAction?: () => void
  onDismiss?: () => void
}

const CONFIG: Record<SeasonTransition['type'], {
  icon: typeof Calendar
  bg: string
  border: string
  text: string
  cta: string | null
}> = {
  season_ended: {
    icon: Sparkles,
    bg: 'bg-amber-900/15',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    cta: 'Passer en hors-saison',
  },
  treve_detected: {
    icon: Calendar,
    bg: 'bg-blue-900/15',
    border: 'border-blue-500/25',
    text: 'text-blue-300',
    cta: null,
  },
  playoffs_suggested: {
    icon: Trophy,
    bg: 'bg-[#ff6b35]/10',
    border: 'border-[#ff6b35]/25',
    text: 'text-[#ff6b35]',
    cta: 'Activer Playoffs',
  },
}

function getMessage(t: SeasonTransition): string {
  switch (t.type) {
    case 'season_ended':
      return `Ta saison semble terminée — ${t.daysSinceLastMatch}j depuis ton dernier match.`
    case 'treve_detected':
      return `Période sans match détectée (~${t.gapWeeks} sem.). Programme adapté automatiquement.`
    case 'playoffs_suggested':
      return 'Phase finale ? Active le mode Playoffs pour un programme d\'affûtage.'
  }
}

export function SeasonTransitionBanner({ transition, onAction, onDismiss }: SeasonTransitionBannerProps) {
  const cfg = CONFIG[transition.type]
  const Icon = cfg.icon
  const message = getMessage(transition)

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-[2rem] p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon className={`w-4 h-4 ${cfg.text} flex-shrink-0 mt-0.5`} />
          <p className={`text-xs font-bold ${cfg.text} leading-relaxed`}>{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/30" />
          </button>
        )}
      </div>
      {cfg.cta && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`w-full py-2.5 rounded-2xl text-xs font-black ${cfg.bg} border ${cfg.border} ${cfg.text} hover:bg-white/5 transition-colors`}
        >
          {cfg.cta}
        </button>
      )}
    </div>
  )
}
