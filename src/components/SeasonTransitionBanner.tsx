import { Calendar, CheckCircle2, Sparkles, Trophy, X } from 'lucide-react'
import type { Lang } from '../i18n/appLabels'
import { seasonBannerCtaLabel, seasonTransitionMessage } from '../i18n/programSurfaces'
import type { SeasonTransition } from '../services/season/detectSeasonTransitions'
import type { SchedulingTransition } from '../types/scheduling'

// ── Season transition config ────────────────────────────────────────

interface BannerConfig {
  icon: typeof Calendar
  bg: string
  border: string
  text: string
}

function seasonCtaKey(
  type: SeasonTransition['type'],
): 'season_ended' | 'playoffs_suggested' | 'pre_season_suggested' {
  switch (type) {
    case 'season_ended':
      return 'season_ended'
    case 'playoffs_suggested':
      return 'playoffs_suggested'
    case 'pre_season_suggested':
      return 'pre_season_suggested'
    default:
      return 'season_ended'
  }
}

const SEASON_CONFIG: Record<SeasonTransition['type'], BannerConfig> = {
  season_ended: {
    icon: Sparkles,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  treve_detected: {
    icon: Calendar,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  playoffs_suggested: {
    icon: Trophy,
    bg: 'bg-brand-soft',
    border: 'border-brand-border',
    text: 'text-brand-tint',
  },
  pre_season_suggested: {
    icon: Calendar,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  match_detected_in_offseason: {
    icon: Calendar,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
}

// ── Scheduling transition config ────────────────────────────────────

const SCHEDULING_CONFIG: Record<SchedulingTransition['type'], BannerConfig> = {
  calendar_mode_activated: {
    icon: Calendar,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  block_mode_activated: {
    icon: CheckCircle2,
    bg: 'bg-layer-5',
    border: 'border-border-app',
    text: 'text-fg-secondary',
  },
}

function schedulingCtaKey(_type: SchedulingTransition['type']): 'scheduling_ok' {
  return 'scheduling_ok'
}

// ── Season Banner Props (existing) ──────────────────────────────────

interface SeasonTransitionBannerProps {
  transition: SeasonTransition
  lang?: Lang
  onAction?: () => void
  onDismiss?: () => void
  onConfirmResume?: () => void
  onDeferMatch?: () => void
  onHideMatch?: () => void
}

export function SeasonTransitionBanner({
  transition,
  lang = 'fr',
  onAction,
  onDismiss,
  onConfirmResume,
  onDeferMatch,
  onHideMatch,
}: SeasonTransitionBannerProps) {
  const cfg = SEASON_CONFIG[transition.type]
  const message = seasonTransitionMessage(transition, lang)
  const cta =
    transition.type === 'match_detected_in_offseason' || transition.type === 'treve_detected'
      ? null
      : seasonBannerCtaLabel(seasonCtaKey(transition.type), lang)

  if (transition.type === 'match_detected_in_offseason') {
    return (
      <MatchDetectedBanner
        cfg={cfg}
        message={message}
        lang={lang}
        onConfirm={onConfirmResume}
        onDefer={onDeferMatch}
        onHide={onHideMatch}
        onDismiss={onDismiss}
      />
    )
  }

  return (
    <TransitionBannerShell
      cfg={cfg}
      message={message}
      ctaLabel={cta}
      onAction={onAction}
      onDismiss={onDismiss}
    />
  )
}

// ── Match detected banner (3 actions) ──────────────────────────────

function MatchDetectedBanner({
  cfg,
  message,
  lang,
  onConfirm,
  onDefer,
  onHide,
  onDismiss,
}: {
  cfg: BannerConfig
  message: string
  lang: Lang
  onConfirm?: () => void
  onDefer?: () => void
  onHide?: () => void
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
          <button type="button" onClick={onDismiss} className="flex-shrink-0 p-1 rounded-full hover:bg-layer-10 transition-colors">
            <X className="w-3.5 h-3.5 text-fg-faint" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {onConfirm && (
          <button
            type="button"
            onClick={onConfirm}
            data-testid="match-banner-confirm"
            className="w-full py-2.5 rounded-2xl text-xs font-black bg-blue-100 border border-blue-200 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            {seasonBannerCtaLabel('match_confirm', lang)}
          </button>
        )}
        {onDefer && (
          <button
            type="button"
            onClick={onDefer}
            data-testid="match-banner-defer"
            className="w-full py-2.5 rounded-2xl text-xs font-bold bg-layer-5 border border-border-app text-fg-muted hover:bg-layer-10 transition-colors"
          >
            {seasonBannerCtaLabel('match_defer', lang)}
          </button>
        )}
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            data-testid="match-banner-hide"
            className="w-full py-2 rounded-2xl text-[10px] font-bold text-fg-faint hover:text-fg-muted transition-colors"
          >
            {seasonBannerCtaLabel('match_hide', lang)}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Scheduling Banner Props (new) ───────────────────────────────────

interface SchedulingTransitionBannerProps {
  transition: SchedulingTransition
  lang?: Lang
  onAction?: () => void
  onDismiss?: () => void
}

export function SchedulingTransitionBanner({
  transition,
  lang = 'fr',
  onAction,
  onDismiss,
}: SchedulingTransitionBannerProps) {
  const cfg = SCHEDULING_CONFIG[transition.type]
  return (
    <TransitionBannerShell
      cfg={cfg}
      message={transition.message}
      ctaLabel={seasonBannerCtaLabel(schedulingCtaKey(transition.type), lang)}
      onAction={onAction}
      onDismiss={onDismiss}
    />
  )
}

// ── Shared shell ────────────────────────────────────────────────────

function TransitionBannerShell({
  cfg,
  message,
  ctaLabel,
  onAction,
  onDismiss,
}: {
  cfg: BannerConfig
  message: string
  ctaLabel?: string | null
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
            className="flex-shrink-0 p-1 rounded-full hover:bg-layer-10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-fg-faint" />
          </button>
        )}
      </div>
      {ctaLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          data-testid="transition-banner-cta"
          className={`w-full py-2.5 rounded-2xl text-xs font-black ${cfg.bg} border ${cfg.border} ${cfg.text} hover:bg-layer-5 transition-colors`}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
