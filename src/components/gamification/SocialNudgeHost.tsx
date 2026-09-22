import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Sparkles, Users, X } from 'lucide-react'
import { BottomSheet } from '../ui'
import { nudgePresentation, selectNudge } from '../../services/gamification/nudgePriority'
import type { Lang } from '../../i18n/appLabels'
import type { SocialNudge } from '../../types/gamification'

export interface SocialNudgeHostProps {
  candidates: readonly SocialNudge[]
  nudgesShownThisWeek: number
  /** Une séance est en cours : aucune interruption sociale. */
  isSessionRunning: boolean
  /** Un overlay bloquant est déjà monté (consentement, offre, confirmation). */
  hasBlockingOverlay: boolean
  nowISO: string
  lang: Lang
  onConsume: (nudgeId: string) => void
}

/**
 * Point de montage unique des pop-ups sociales.
 *
 * L'app monte déjà beaucoup d'overlays globaux (consentement cookies, offre
 * Founding, invite notifications, prompt PWA, sheet de confirmation de
 * semaine). Un seul hôte, alimenté par `selectNudge`, garantit qu'on n'empile
 * jamais deux interruptions et qu'on respecte le quota hebdomadaire.
 *
 * Un passage de palier ou une promotion ouvre une `BottomSheet` (l'événement
 * mérite l'interruption) ; tout le reste passe en toast discret.
 */
export function SocialNudgeHost({
  candidates,
  nudgesShownThisWeek,
  isSessionRunning,
  hasBlockingOverlay,
  nowISO,
  lang,
  onConsume,
}: SocialNudgeHostProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const nudge = useMemo(
    () =>
      selectNudge({
        candidates,
        nudgesShownThisWeek,
        isSessionRunning,
        hasBlockingOverlay,
        nowISO,
      }),
    [candidates, nudgesShownThisWeek, isSessionRunning, hasBlockingOverlay, nowISO],
  )

  if (!nudge || nudge.id === dismissedId) return null

  const close = () => {
    setDismissedId(nudge.id)
    onConsume(nudge.id)
  }

  if (nudgePresentation(nudge.kind) === 'sheet') {
    return (
      <BottomSheet
        open
        onClose={close}
        ariaLabel={nudge.title}
        eyebrow={nudge.title}
        title={nudge.body}
      >
        <div
          className="space-y-4 pt-2 pb-2"
          data-testid="social-nudge-sheet"
          data-nudge-kind={nudge.kind}
        >
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-pro/40 bg-pro-soft">
              <Sparkles className="h-7 w-7 text-pro" strokeWidth={2} />
            </span>
          </div>
          <div className="flex gap-2">
            {nudge.actionHref && nudge.actionLabel && (
              <Link
                to={nudge.actionHref}
                onClick={close}
                className="flex-1 rounded-2xl bg-brand px-4 py-3 text-center text-sm font-bold text-on-brand rf-focus-ring"
              >
                {nudge.actionLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={close}
              className="rounded-2xl border border-border-app px-4 py-3 text-sm font-bold text-fg-muted rf-focus-ring"
            >
              {lang === 'fr' ? 'Plus tard' : 'Later'}
            </button>
          </div>
        </div>
      </BottomSheet>
    )
  }

  return createPortal(
    <div
      role="status"
      data-testid="social-nudge-toast"
      data-nudge-kind={nudge.kind}
      className="fixed bottom-32 left-1/2 z-[100] w-[min(92vw,22rem)] -translate-x-1/2 animate-fade-in"
    >
      <div className="overflow-hidden rounded-2xl border border-paper-deep bg-app shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)]">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-layer-20 text-brand">
            <Users className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand">
              {nudge.title}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold leading-snug text-fg">
              {nudge.body}
            </p>
            {nudge.actionHref && nudge.actionLabel && (
              <Link
                to={nudge.actionHref}
                onClick={close}
                className="mt-1.5 inline-block text-[11px] font-bold text-brand underline underline-offset-2"
              >
                {nudge.actionLabel}
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={lang === 'fr' ? 'Fermer' : 'Dismiss'}
            className="rounded-lg p-1 text-fg-faint hover:text-fg-soft rf-focus-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
