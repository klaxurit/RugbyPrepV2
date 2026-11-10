import { useEffect, useMemo, useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { tr, type Lang } from '../../i18n/appLabels'
import { posthog } from '../../services/analytics/posthog'
import type {
  SessionSharePayload,
  SessionShareTarget,
} from '../../services/share/sessionShareTypes'
import {
  createSessionSharePreviewUrl,
  shareSessionResult,
} from '../../services/share/shareSessionResult'

const SHOW_CLUB_STORAGE_KEY = 'rf.share.showClub'

function readShowClubPreference(): boolean {
  try {
    return window.localStorage.getItem(SHOW_CLUB_STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

function writeShowClubPreference(value: boolean): void {
  try {
    window.localStorage.setItem(SHOW_CLUB_STORAGE_KEY, value ? '1' : '0')
  } catch {
    // stockage indisponible (navigation privée) : préférence non mémorisée
  }
}

export interface SessionShareSheetProps {
  open: boolean
  payload: SessionSharePayload | null
  lang: Lang
  onContinue: () => void
}

/**
 * Étape post-enregistrement : preview carte + Partager (sheet OS) + Enregistrer.
 */
export function SessionShareSheet({
  open,
  payload,
  lang,
  onContinue,
}: SessionShareSheetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [showClub, setShowClub] = useState<boolean>(readShowClubPreference)

  const hasClub = Boolean(payload?.clubName?.trim())
  const effectivePayload = useMemo<SessionSharePayload | null>(
    () => (payload ? { ...payload, showClub: hasClub && showClub } : null),
    [payload, hasClub, showClub],
  )

  const toggleShowClub = (next: boolean) => {
    setShowClub(next)
    writeShowClubPreference(next)
  }

  useEffect(() => {
    const payload = effectivePayload
    if (!open || !payload) return

    let cancelled = false
    let objectUrl: string | null = null

    void (async () => {
      try {
        objectUrl = await createSessionSharePreviewUrl(payload)
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return objectUrl
        })
        setPreviewError(false)
        setHint(null)
      } catch {
        if (!cancelled) {
          setPreviewError(true)
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
        }
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, effectivePayload])

  const runShare = async (target: SessionShareTarget) => {
    const payload = effectivePayload
    if (!payload || busy) return
    setBusy(true)
    setHint(null)
    posthog.capture?.('session_share_clicked', {
      target,
      sessionLabel: payload.sessionLabel,
      rpe: payload.rpe,
      fatigue: payload.fatigue,
      prCount: payload.prs.length,
      isPremium: payload.isPremium,
      club_shown: payload.showClub === true,
    })

    const outcome = await shareSessionResult(payload, target)
    setBusy(false)

    if (outcome.status === 'shared') {
      posthog.capture?.('session_shared', {
        method: outcome.method,
        target: outcome.target,
        sessionLabel: payload.sessionLabel,
        club_shown: outcome.meta?.clubShown ?? false,
        logo_source: outcome.meta?.logoSource ?? 'none',
      })
      if (outcome.method === 'download') {
        setHint(tr('session_share_saved_hint', lang))
      }
      return
    }

    if (outcome.status === 'cancelled') {
      posthog.capture?.('session_share_cancelled', { target })
      return
    }

    posthog.capture?.('session_share_failed', {
      target,
      reason: outcome.status === 'failed' ? outcome.reason : outcome.status,
    })
    setHint(tr('session_share_error', lang))
  }

  const handleContinue = () => {
    posthog.capture?.('session_share_dismissed')
    onContinue()
  }

  const showPreview = open && payload != null

  return (
    <BottomSheet
      open={open}
      onClose={handleContinue}
      ariaLabel={tr('session_share_aria', lang)}
      hideDefaultHeader
      showClose
    >
      <div className="px-5 pb-5 pt-1" data-testid="session-share-sheet">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-tint">
          {tr('session_share_eyebrow', lang)}
        </p>
        <h2 className="mt-1 text-xl font-black italic tracking-tight text-fg">
          {payload?.congratLine ?? tr('session_share_congrats_fallback', lang)}
        </h2>
        {payload?.purposeLine ? (
          <p className="mt-1.5 text-sm leading-snug text-fg-muted" data-testid="session-share-purpose">
            {payload.purposeLine}
          </p>
        ) : (
          <p className="mt-1 text-sm text-fg-muted">{tr('session_share_subtitle', lang)}</p>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-border-app bg-layer-5">
          {showPreview && previewUrl && (
            <img
              src={previewUrl}
              alt={tr('session_share_preview_alt', lang)}
              className="mx-auto block w-full max-w-[200px] object-cover"
              data-testid="session-share-preview"
            />
          )}
          {showPreview && !previewUrl && !previewError && (
            <div className="flex h-64 items-center justify-center text-xs font-bold text-fg-muted">
              {tr('session_share_loading', lang)}
            </div>
          )}
          {showPreview && previewError && (
            <div className="flex h-40 items-center justify-center px-4 text-center text-xs font-bold text-fg-muted">
              {tr('session_share_preview_error', lang)}
            </div>
          )}
        </div>

        {hasClub && (
          <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border-app bg-layer-5 px-4 py-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-fg">
              {tr('session_share_show_club', lang)}
            </span>
            <input
              type="checkbox"
              role="switch"
              data-testid="session-share-show-club"
              checked={showClub}
              disabled={busy}
              onChange={(event) => toggleShowClub(event.target.checked)}
              className="h-5 w-5 accent-brand rf-focus-ring"
            />
          </label>
        )}

        {hint && (
          <p className="mt-3 text-xs font-bold text-ok" data-testid="session-share-hint">
            {hint}
          </p>
        )}

        <button
          type="button"
          data-testid="session-share-system"
          disabled={busy || !payload}
          onClick={() => void runShare('system')}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-black uppercase tracking-wide text-on-brand shadow-md transition-opacity disabled:opacity-50 rf-focus-ring"
        >
          <Share2 className="h-4 w-4" />
          {tr('session_share_cta', lang)}
        </button>

        <button
          type="button"
          data-testid="session-share-download"
          disabled={busy || !payload}
          onClick={() => void runShare('download')}
          className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border-app bg-layer-5 text-xs font-extrabold uppercase tracking-wide text-fg transition-colors hover:border-brand-border disabled:opacity-50 rf-focus-ring"
        >
          <Download className="h-4 w-4" />
          {tr('session_share_save', lang)}
        </button>

        <button
          type="button"
          data-testid="session-share-continue"
          disabled={busy}
          onClick={handleContinue}
          className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-2xl text-xs font-extrabold uppercase tracking-wide text-fg-muted transition-colors hover:text-fg rf-focus-ring"
        >
          {tr('session_share_continue', lang)}
        </button>
      </div>
    </BottomSheet>
  )
}
