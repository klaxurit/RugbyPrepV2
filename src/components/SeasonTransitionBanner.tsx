import { Calendar, CheckCircle2, RefreshCw, Sparkles, Trophy, X } from 'lucide-react'
import type { SeasonTransition } from '../services/season/detectSeasonTransitions'
import type { SchedulingTransition } from '../types/scheduling'

// ── Season transition config ────────────────────────────────────────

interface BannerConfig {
  icon: typeof Calendar
  bg: string
  border: string
  text: string
  cta: string | null
}

const SEASON_CONFIG: Record<SeasonTransition['type'], BannerConfig> = {
  season_ended: {
    icon: Sparkles,
    bg: 'bg-amber-900/15',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    cta: 'Passer en inter-saison',
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
  pre_season_suggested: {
    icon: Calendar,
    bg: 'bg-emerald-900/15',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    cta: 'Indiquer ma date de reprise',
  },
}

// ── Scheduling transition config ────────────────────────────────────

const SCHEDULING_CONFIG: Record<SchedulingTransition['type'], BannerConfig> = {
  calendar_mode_activated: {
    icon: Calendar,
    bg: 'bg-emerald-900/15',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    cta: 'OK',
  },
  block_mode_activated: {
    icon: CheckCircle2,
    bg: 'bg-white/5',
    border: 'border-white/15',
    text: 'text-white/70',
    cta: 'OK',
  },
  return_after_break: {
    icon: RefreshCw,
    bg: 'bg-teal-900/15',
    border: 'border-teal-500/25',
    text: 'text-teal-300',
    cta: "C'est parti",
  },
}

// ── Season transition message ───────────────────────────────────────

function getSeasonMessage(t: SeasonTransition): string {
  switch (t.type) {
    case 'season_ended':
      return `Ta saison semble terminée — ${t.daysSinceLastMatch}j depuis ton dernier match.`
    case 'treve_detected':
      if (t.subMode === 'treve_deep') {
        return `Période de trêve (~${t.gapWeeks} sem.). Le programme est adapté : bloc force opportuniste pour capitaliser sur cette pause.`
      }
      if (t.subMode === 'treve_return') {
        return 'Reprise progressive cette semaine — intensité en rampe avant le retour en compétition.'
      }
      if (t.subMode === 'treve_rampup') {
        return 'Match imminent — programme allégé pour la ré-acclimation.'
      }
      return `Période sans match détectée (~${t.gapWeeks} sem.). Programme adapté automatiquement.`
    case 'playoffs_suggested':
      return "Phase finale ? Active le mode Playoffs pour un programme d'affûtage."
    case 'pre_season_suggested':
      return t.reason === 'calendar_date'
        ? 'La reprise approche. Indique ta date de retour au club pour lancer ta pré-saison.'
        : 'Tu avances bien dans ton inter-saison. Prêt à lancer la pré-saison ?'
  }
}

// ── Season Banner Props (existing) ──────────────────────────────────

interface SeasonTransitionBannerProps {
  transition: SeasonTransition
  onAction?: () => void
  onDismiss?: () => void
}

export function SeasonTransitionBanner({ transition, onAction, onDismiss }: SeasonTransitionBannerProps) {
  const cfg = SEASON_CONFIG[transition.type]
  const message = getSeasonMessage(transition)
  return <TransitionBannerShell cfg={cfg} message={message} onAction={onAction} onDismiss={onDismiss} />
}

// ── Scheduling Banner Props (new) ───────────────────────────────────

interface SchedulingTransitionBannerProps {
  transition: SchedulingTransition
  onAction?: () => void
  onDismiss?: () => void
}

export function SchedulingTransitionBanner({ transition, onAction, onDismiss }: SchedulingTransitionBannerProps) {
  const cfg = SCHEDULING_CONFIG[transition.type]
  return <TransitionBannerShell cfg={cfg} message={transition.message} onAction={onAction} onDismiss={onDismiss} />
}

// ── Shared shell ────────────────────────────────────────────────────

function TransitionBannerShell({
  cfg,
  message,
  onAction,
  onDismiss,
}: {
  cfg: BannerConfig
  message: string
  onAction?: () => void
  onDismiss?: () => void
}) {
  const Icon = cfg.icon
  return (
    <div
      className={`${cfg.bg} border ${cfg.border} rounded-[2rem] p-4 space-y-3`}
      data-testid="transition-banner"
    >
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
          data-testid="transition-banner-cta"
          className={`w-full py-2.5 rounded-2xl text-xs font-black ${cfg.bg} border ${cfg.border} ${cfg.text} hover:bg-white/5 transition-colors`}
        >
          {cfg.cta}
        </button>
      )}
    </div>
  )
}
