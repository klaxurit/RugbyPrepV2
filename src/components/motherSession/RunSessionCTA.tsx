import { useEffect, useRef, useState } from 'react'
import { Check, CheckCircle2, SkipForward } from 'lucide-react'
import { useSessionRun, buildExerciseTourKey } from '../../contexts/SessionRunContext'
import { useRestTimerEndEffects } from '../../hooks/useRestTimerEndEffects'
import { findCurrentPending, type PendingCursor } from '../../services/motherSession/findCurrentPending'
import { getInterTourRestAfterMarking } from '../../services/motherSession/interTourRest'
import type { MotherSession } from '../../types/motherSession'
import { getExerciseName } from '../../data/exercises'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { IsoChronoButton } from './IsoChronoButton'
import { localizeMotherSessionExerciseName } from '../../services/motherSession/localizeMotherSessionExerciseName'
import { localizeBlockName } from '../../services/motherSession/motherSessionBlockLabels'
import {
  finishSessionCtaLabel,
  restTimerAfterTourLine,
  sessionRestWord,
  sessionSkipRestLabel,
  sessionTourWord,
  validateExerciseCtaLine,
} from '../../i18n/sessionRunUi'

export interface RunSessionCTAProps {
  session: MotherSession
  lang: AppLang
  /** Called when the player taps "Terminer la séance" (all sets validated). */
  onFinish: () => void
  /** Called whenever the active set cursor changes — used for auto-scroll. */
  onCursorChange?: (cursor: PendingCursor | null) => void
}

/**
 * Sticky bottom CTA that drives the session run end-to-end.
 *
 * State machine (priority order):
 *   1. Rest timer ticking      → countdown chip + tap to skip
 *   2. Current set is iso/time → embedded IsoChronoButton
 *   3. Current set is reps     → "Valider · {exo}" button
 *   4. All sets done           → "Terminer la séance"
 *
 * Replaces both the per-exo checkbox (validation moves here) and the
 * previously-floating rest timer overlay so the player has a single
 * thumb target during the whole session.
 */
export function RunSessionCTA({ session, lang, onFinish, onCursorChange }: RunSessionCTAProps) {
  const sessionRun = useSessionRun()
  const cursor = findCurrentPending(session, sessionRun.completedExercises)

  // Notify parent of cursor changes (used for auto-scroll-into-view).
  const lastCursorKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const key = cursor
      ? `${cursor.blockNumber}_${cursor.tourIndex}_${cursor.exerciseIndex}`
      : null
    if (key !== lastCursorKeyRef.current) {
      lastCursorKeyRef.current = key
      onCursorChange?.(cursor)
    }
  }, [cursor, onCursorChange])

  // Validate the current cursor: mark done + start rest timer if appropriate.
  const validateCurrent = () => {
    if (!cursor) return
    const key = buildExerciseTourKey(
      cursor.blockNumber,
      cursor.tourIndex,
      cursor.exerciseIndex,
    )
    if (sessionRun.restTimer) sessionRun.skipRestTimer()
    sessionRun.markExerciseDone(key)

    const completed = new Set(sessionRun.completedExercises)
    completed.add(key)
    const rest = getInterTourRestAfterMarking(
      session,
      cursor.blockNumber,
      cursor.tourIndex,
      cursor.exerciseIndex,
      completed,
    )
    if (rest) {
      sessionRun.startRestTimer(
        rest.restSeconds,
        restTimerAfterTourLine(rest.tourOneBased, lang),
      )
    }
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-4 pt-2 bg-gradient-to-t from-bg via-bg/95 to-bg/0 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        {sessionRun.restTimer ? (
          <RestTimerCard lang={lang} />
        ) : cursor ? (
          <CurrentSetCard cursor={cursor} lang={lang} onValidate={validateCurrent} />
        ) : (
          <FinishCard lang={lang} onFinish={onFinish} />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Rest mode

function RestTimerCard({ lang }: { lang: AppLang }) {
  const { restTimer, skipRestTimer } = useSessionRun()
  const [now, setNow] = useState(() => Date.now())

  useRestTimerEndEffects(restTimer, skipRestTimer)

  // Display ticker — refresh `now` every 200ms while the timer runs.
  useEffect(() => {
    if (!restTimer) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [restTimer])

  if (!restTimer) return null

  const remainingMs = Math.max(0, restTimer.endsAt - now)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const totalMs = restTimer.totalSeconds * 1000
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  const mm = String(Math.floor(remainingSec / 60)).padStart(1, '0')
  const ss = String(remainingSec % 60).padStart(2, '0')
  const isExpiring = remainingSec <= 3 && remainingSec > 0

  return (
    <button
      type="button"
      onClick={skipRestTimer}
      aria-label={
        lang === 'en'
          ? `${sessionRestWord(lang)} · ${remainingSec}s left — tap to skip`
          : `${sessionRestWord(lang)} · ${remainingSec} secondes restantes — toucher pour passer`
      }
      className={`w-full rounded-2xl border shadow-brand-float transition-colors ${
        isExpiring
          ? 'bg-brand text-on-brand border-brand'
          : 'bg-panel border-border-app text-fg'
      }`}
    >
      <div className="flex items-center gap-3 px-4 pt-3">
        <div className="flex-1 min-w-0 text-left">
          <p
            className={`text-[10px] font-black uppercase tracking-widest ${
              isExpiring ? 'text-on-brand' : 'text-fg-muted'
            }`}
          >
            {sessionRestWord(lang)} {restTimer.label ? `· ${restTimer.label}` : ''}
          </p>
          <p
            className={`font-black tabular-nums leading-none ${
              isExpiring ? 'text-on-brand text-4xl' : 'text-fg text-3xl'
            }`}
          >
            {mm}:{ss}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
            isExpiring ? 'text-on-brand' : 'text-fg-muted'
          }`}
        >
          <SkipForward className="w-3.5 h-3.5" strokeWidth={2.5} />
          {sessionSkipRestLabel(lang)}
        </span>
      </div>
      <div className="mx-4 mt-3 mb-3 h-1.5 bg-layer-10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${
            isExpiring ? 'bg-white/70' : 'bg-brand'
          }`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Current set mode (iso or reps)

function CurrentSetCard({
  cursor,
  lang,
  onValidate,
}: {
  cursor: PendingCursor
  lang: AppLang
  onValidate: () => void
}) {
  const rawCatalog = cursor.exerciseId ? getExerciseName(cursor.exerciseId, lang) : ''
  const resolvedCatalog =
    cursor.exerciseId && rawCatalog !== cursor.exerciseId ? rawCatalog : ''
  const displayName =
    resolvedCatalog || localizeMotherSessionExerciseName(cursor.exerciseName, lang)
  const blockLabel = localizeBlockName(cursor.blockName, lang)
  const tourWord = sessionTourWord(lang)

  if (cursor.spec.kind === 'time') {
    return (
      <div className="rounded-2xl border border-brand-border-strong bg-panel shadow-brand-float p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-fg-muted text-center">
          {blockLabel} · {tourWord} {cursor.tourIndex + 1}
        </p>
        <p className="text-sm font-extrabold italic tracking-tight text-fg text-center mt-1 mb-3">
          {displayName}
        </p>
        <IsoChronoButton
          durationLow={cursor.spec.durationLow}
          durationHigh={cursor.spec.durationHigh}
          perSide={cursor.spec.perSide}
          perDirection={cursor.spec.perDirection}
          label={displayName}
          onCompleted={onValidate}
        />
      </div>
    )
  }

  // Reps (or unknown) → simple validate button.
  return (
    <button
      type="button"
      onClick={onValidate}
      className="w-full rounded-2xl bg-brand hover:bg-brand-hover text-on-brand px-4 py-3.5 shadow-brand-float rf-focus-ring text-left flex items-center gap-3"
    >
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
        <Check className="w-5 h-5" strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-black uppercase tracking-widest opacity-80">
          {blockLabel} · {tourWord} {cursor.tourIndex + 1}
        </span>
        <span className="block font-black uppercase italic tracking-wide truncate">
          {validateExerciseCtaLine(displayName, lang)}
        </span>
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Finish mode

function FinishCard({ lang, onFinish }: { lang: AppLang; onFinish: () => void }) {
  return (
    <button
      type="button"
      data-testid="ms-complete-btn"
      onClick={onFinish}
      className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover text-on-brand font-black uppercase italic tracking-wide transition-all shadow-brand-float flex items-center justify-center gap-2"
    >
      <CheckCircle2 className="w-5 h-5" />
      {finishSessionCtaLabel(lang)}
    </button>
  )
}
