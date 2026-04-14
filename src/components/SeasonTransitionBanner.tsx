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
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    cta: 'Passer en inter-saison',
  },
  treve_detected: {
    icon: Calendar,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    cta: null,
  },
  playoffs_suggested: {
    icon: Trophy,
    bg: 'bg-brand-soft',
    border: 'border-brand-border',
    text: 'text-brand-tint',
    cta: 'Activer Playoffs',
  },
  pre_season_suggested: {
    icon: Calendar,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    cta: 'Indiquer ma date de reprise',
  },
  match_detected_in_offseason: {
    icon: Calendar,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    cta: null,
  },
}

// ── Scheduling transition config ────────────────────────────────────

const SCHEDULING_CONFIG: Record<SchedulingTransition['type'], BannerConfig> = {
  calendar_mode_activated: {
    icon: Calendar,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    cta: 'OK',
  },
  block_mode_activated: {
    icon: CheckCircle2,
    bg: 'bg-layer-5',
    border: 'border-border-app',
    text: 'text-fg-secondary',
    cta: 'OK',
  },
  return_after_break: {
    icon: RefreshCw,
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    cta: "C'est parti",
  },
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
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
    case 'match_detected_in_offseason':
      return t.opponent
        ? `Un match a été ajouté le ${formatShortDate(t.matchDate)} contre ${t.opponent}. Ta saison reprend ?`
        : `Un match a été ajouté le ${formatShortDate(t.matchDate)}. Ta saison reprend ?`
  }
}

// ── Season Banner Props (existing) ──────────────────────────────────

interface SeasonTransitionBannerProps {
  transition: SeasonTransition
  onAction?: () => void
  onDismiss?: () => void
  /** For match_detected_in_offseason: 3 actions */
  onConfirmResume?: () => void
  onDeferMatch?: () => void
  onHideMatch?: () => void
}

export function SeasonTransitionBanner({ transition, onAction, onDismiss, onConfirmResume, onDeferMatch, onHideMatch }: SeasonTransitionBannerProps) {
  const cfg = SEASON_CONFIG[transition.type]
  const message = getSeasonMessage(transition)

  if (transition.type === 'match_detected_in_offseason') {
    return (
      <MatchDetectedBanner
        cfg={cfg}
        message={message}
        onConfirm={onConfirmResume}
        onDefer={onDeferMatch}
        onHide={onHideMatch}
        onDismiss={onDismiss}
      />
    )
  }

  return <TransitionBannerShell cfg={cfg} message={message} onAction={onAction} onDismiss={onDismiss} />
}

// ── Match detected banner (3 actions) ──────────────────────────────

function MatchDetectedBanner({
  cfg,
  message,
  onConfirm,
  onDefer,
  onHide,
  onDismiss,
}: {
  cfg: BannerConfig
  message: string
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
            Oui, ma saison reprend
          </button>
        )}
        {onDefer && (
          <button
            type="button"
            onClick={onDefer}
            data-testid="match-banner-defer"
            className="w-full py-2.5 rounded-2xl text-xs font-bold bg-layer-5 border border-border-app text-fg-muted hover:bg-layer-10 transition-colors"
          >
            Non, pas maintenant
          </button>
        )}
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            data-testid="match-banner-hide"
            className="w-full py-2 rounded-2xl text-[10px] font-bold text-fg-faint hover:text-fg-muted transition-colors"
          >
            Ce n&#39;est pas mon équipe
          </button>
        )}
      </div>
    </div>
  )
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
            className="flex-shrink-0 p-1 rounded-full hover:bg-layer-10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-fg-faint" />
          </button>
        )}
      </div>
      {cfg.cta && onAction && (
        <button
          type="button"
          onClick={onAction}
          data-testid="transition-banner-cta"
          className={`w-full py-2.5 rounded-2xl text-xs font-black ${cfg.bg} border ${cfg.border} ${cfg.text} hover:bg-layer-5 transition-colors`}
        >
          {cfg.cta}
        </button>
      )}
    </div>
  )
}
