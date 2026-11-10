import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Camera, Download, ImagePlus, Share2, Trash2 } from 'lucide-react'
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
import {
  prepareSharePhoto,
  revokeSharePhotoUrl,
} from '../../services/share/prepareSharePhoto'

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoTooSmall, setPhotoTooSmall] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  const hasClub = Boolean(payload?.clubName?.trim())
  const effectivePayload = useMemo<SessionSharePayload | null>(
    () =>
      payload
        ? {
            ...payload,
            showClub: hasClub && showClub,
            photoUrl: photoUrl ?? payload.photoUrl ?? null,
          }
        : null,
    [payload, hasClub, showClub, photoUrl],
  )

  const toggleShowClub = (next: boolean) => {
    setShowClub(next)
    writeShowClubPreference(next)
  }

  const clearPhoto = () => {
    setPhotoUrl(null)
    setPhotoTooSmall(false)
    setPhotoError(false)
  }

  // Revoke blob URL on change/unmount (pas de setState ici).
  useEffect(() => {
    return () => {
      revokeSharePhotoUrl(photoUrl)
    }
  }, [photoUrl])

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

  const applyPhotoFile = async (file: File | undefined) => {
    if (!file || photoBusy) return
    setPhotoBusy(true)
    setPhotoError(false)
    const result = await prepareSharePhoto(file)
    setPhotoBusy(false)
    if (!result.ok) {
      setPhotoError(true)
      return
    }
    setPhotoUrl(result.objectUrl)
    setPhotoTooSmall(result.tooSmall)
  }

  const onPhotoInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    void applyPhotoFile(file)
  }

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
      has_photo: Boolean(payload.photoUrl),
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
        has_photo: Boolean(payload.photoUrl),
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
    clearPhoto()
    setPhotoBusy(false)
    setHint(null)
    posthog.capture?.('session_share_dismissed')
    onContinue()
  }

  const showPreview = open && payload != null
  const hasPhoto = Boolean(photoUrl)
  const actionsDisabled = busy || photoBusy || !payload

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

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          data-testid="session-share-photo-camera-input"
          onChange={onPhotoInputChange}
        />
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          data-testid="session-share-photo-library-input"
          onChange={onPhotoInputChange}
        />

        {!hasPhoto ? (
          <div className="mt-3 grid grid-cols-2 gap-2" data-testid="session-share-photo-empty">
            <button
              type="button"
              data-testid="session-share-photo-camera"
              disabled={actionsDisabled}
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border-app bg-layer-5 px-3 text-[11px] font-extrabold uppercase tracking-wide text-fg transition-colors hover:border-brand-border disabled:opacity-50 rf-focus-ring"
            >
              <Camera className="h-4 w-4 shrink-0" />
              {tr('session_share_photo_camera', lang)}
            </button>
            <button
              type="button"
              data-testid="session-share-photo-library"
              disabled={actionsDisabled}
              onClick={() => libraryInputRef.current?.click()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border-app bg-layer-5 px-3 text-[11px] font-extrabold uppercase tracking-wide text-fg transition-colors hover:border-brand-border disabled:opacity-50 rf-focus-ring"
            >
              <ImagePlus className="h-4 w-4 shrink-0" />
              {tr('session_share_photo_library', lang)}
            </button>
          </div>
        ) : (
          <div className="mt-3 flex gap-2" data-testid="session-share-photo-actions">
            <button
              type="button"
              data-testid="session-share-photo-change"
              disabled={actionsDisabled}
              onClick={() => libraryInputRef.current?.click()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-border-app bg-layer-5 px-3 text-[11px] font-extrabold uppercase tracking-wide text-fg transition-colors hover:border-brand-border disabled:opacity-50 rf-focus-ring"
            >
              <ImagePlus className="h-4 w-4 shrink-0" />
              {tr('session_share_photo_change', lang)}
            </button>
            <button
              type="button"
              data-testid="session-share-photo-remove"
              disabled={actionsDisabled}
              onClick={clearPhoto}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border-app bg-layer-5 px-3 text-[11px] font-extrabold uppercase tracking-wide text-fg-muted transition-colors hover:border-brand-border hover:text-fg disabled:opacity-50 rf-focus-ring"
              aria-label={tr('session_share_photo_remove', lang)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
            </button>
          </div>
        )}

        {photoTooSmall && hasPhoto && (
          <p
            className="mt-2 text-xs font-bold text-fg-muted"
            data-testid="session-share-photo-too-small"
          >
            {tr('session_share_photo_too_small', lang)}
            {' · '}
            <button
              type="button"
              className="underline rf-focus-ring"
              disabled={actionsDisabled}
              onClick={() => libraryInputRef.current?.click()}
            >
              {tr('session_share_photo_change', lang)}
            </button>
          </p>
        )}

        {photoError && (
          <p className="mt-2 text-xs font-bold text-danger" data-testid="session-share-photo-error">
            {tr('session_share_photo_error', lang)}
          </p>
        )}

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
              disabled={busy || photoBusy}
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
          disabled={actionsDisabled}
          onClick={() => void runShare('system')}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-black uppercase tracking-wide text-on-brand shadow-md transition-opacity disabled:opacity-50 rf-focus-ring"
        >
          <Share2 className="h-4 w-4" />
          {tr('session_share_cta', lang)}
        </button>

        <button
          type="button"
          data-testid="session-share-download"
          disabled={actionsDisabled}
          onClick={() => void runShare('download')}
          className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border-app bg-layer-5 text-xs font-extrabold uppercase tracking-wide text-fg transition-colors hover:border-brand-border disabled:opacity-50 rf-focus-ring"
        >
          <Download className="h-4 w-4" />
          {tr('session_share_save', lang)}
        </button>

        <button
          type="button"
          data-testid="session-share-continue"
          disabled={busy || photoBusy}
          onClick={handleContinue}
          className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-2xl text-xs font-extrabold uppercase tracking-wide text-fg-muted transition-colors hover:text-fg rf-focus-ring"
        >
          {tr('session_share_continue', lang)}
        </button>
      </div>
    </BottomSheet>
  )
}
