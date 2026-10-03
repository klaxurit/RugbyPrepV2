import { useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { PerceivedIntensityBars } from '../ui/PerceivedIntensityBars'
import { ClubCrestWatermark } from './ClubCrestWatermark'
import { formatDateFR } from './matchDate'
import type { CalendarEvent, MatchParticipationStatus } from '../../types/training'
import { clampPerceivedIntensity } from '../../services/ui/perceivedIntensity'
import { useHoldRepeat } from '../../hooks/useHoldRepeat'
import { getToday } from '../../services/ui/debugDateOverride'
import { parseLocalDateOnly } from '../../services/dates/localIsoDate'

export interface MatchLoadSheetProps {
  event: CalendarEvent | null
  open: boolean
  onClose: () => void
  lang?: 'fr' | 'en'
  onSaveLoad: (eventId: string, rpe: number, durationMin: number) => Promise<void>
  onSaveAbsence: (
    eventId: string,
    status: Exclude<MatchParticipationStatus, 'played'>,
  ) => Promise<void>
}

type SheetMode = 'played' | 'absence'

const MIN_MINUTES = 1
const MAX_MINUTES = 120

const COPY = {
  fr: {
    eyebrow: 'Après match',
    titleFallback: 'Ton match',
    minutes: 'Minutes jouées',
    minUnit: 'min',
    estimated: 'Charge estimée',
    ua: 'UA',
    save: 'Enregistrer ma charge',
    saving: 'Enregistrement…',
    saved: 'Charge enregistrée',
    absenceToggle: 'Je n’ai pas joué',
    backPlayed: '← J’ai joué',
    notSelected: 'Non sélectionné',
    notSelectedHint: 'Tu n’étais pas dans le groupe match.',
    didNotPlay: 'Sur la feuille, pas entré',
    didNotPlayHint: 'Tu étais là mais tu n’as pas joué.',
    error: 'Impossible d’enregistrer. Réessaie.',
  },
  en: {
    eyebrow: 'Post-match',
    titleFallback: 'Your match',
    minutes: 'Minutes played',
    minUnit: 'min',
    estimated: 'Estimated load',
    ua: 'AU',
    save: 'Save my load',
    saving: 'Saving…',
    saved: 'Load saved',
    absenceToggle: 'I didn’t play',
    backPlayed: '← I played',
    notSelected: 'Not selected',
    notSelectedHint: 'You weren’t in the match-day squad.',
    didNotPlay: 'On the sheet, no minutes',
    didNotPlayHint: 'You were there but didn’t play.',
    error: 'Couldn’t save. Try again.',
  },
} as const

function daysSinceMatch(matchDateISO: string, todayISO: string): number | null {
  const match = parseLocalDateOnly(matchDateISO)
  const today = parseLocalDateOnly(todayISO)
  if (!match || !today) return null
  return Math.round((today.getTime() - match.getTime()) / 86_400_000)
}

function jPlusLabel(daysAgo: number | null, lang: 'fr' | 'en'): string | null {
  if (daysAgo == null || daysAgo < 1) return null
  return lang === 'fr' ? `J+${daysAgo}` : `D+${daysAgo}`
}

function clampMinutes(n: number): number {
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(n)))
}

/**
 * Sheet charge match — DA Claude Design (serif hero, barres intensité, watermark crest).
 */
export function MatchLoadSheet({
  event,
  open,
  onClose,
  lang = 'fr',
  onSaveLoad,
  onSaveAbsence,
}: MatchLoadSheetProps) {
  const copy = COPY[lang]
  const [mode, setMode] = useState<SheetMode>('played')
  const [rpe, setRpe] = useState(7)
  const [durationMin, setDurationMin] = useState(80)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [absenceReason, setAbsenceReason] = useState<
    Exclude<MatchParticipationStatus, 'played'> | null
  >(null)

  useEffect(() => {
    if (!open || !event) return
    setMode('played')
    setAbsenceReason(null)
    setRpe(clampPerceivedIntensity(event.rpe ?? 7))
    setDurationMin(
      event.duration_min && event.duration_min > 0
        ? clampMinutes(event.duration_min)
        : 80,
    )
    setError(null)
    setSavedFlash(false)
    setBusy(false)
  }, [open, event])

  const bumpMinutes = (delta: number) => {
    setDurationMin((prev) => clampMinutes(prev + delta))
  }

  const minusHold = useHoldRepeat({
    onStep: () => bumpMinutes(-1),
    disabled: busy || mode !== 'played',
  })
  const plusHold = useHoldRepeat({
    onStep: () => bumpMinutes(1),
    disabled: busy || mode !== 'played',
  })

  const handleClose = () => {
    if (busy) return
    onClose()
  }

  const finishOk = () => {
    setSavedFlash(true)
    window.setTimeout(() => {
      setSavedFlash(false)
      onClose()
    }, 650)
  }

  const handleSavePlayed = async () => {
    if (!event || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSaveLoad(event.id, clampPerceivedIntensity(rpe), clampMinutes(durationMin))
      finishOk()
    } catch {
      setError(copy.error)
    } finally {
      setBusy(false)
    }
  }

  const handleAbsence = async (status: Exclude<MatchParticipationStatus, 'played'>) => {
    if (!event || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSaveAbsence(event.id, status)
      finishOk()
    } catch {
      setError(copy.error)
    } finally {
      setBusy(false)
    }
  }

  const handleSaveAbsence = async () => {
    if (!absenceReason) return
    await handleAbsence(absenceReason)
  }

  const goToAbsenceMode = () => {
    setAbsenceReason(null)
    setError(null)
    setMode('absence')
  }

  const goToPlayedMode = () => {
    setAbsenceReason(null)
    setError(null)
    setMode('played')
  }

  const title = event?.opponent ? `vs ${event.opponent}` : copy.titleFallback
  const subtitle = event
    ? `${formatDateFR(event.date)}${event.kickoff_time ? ` · ${event.kickoff_time.slice(0, 5)}` : ''}`
    : undefined
  const estimatedLoad = clampMinutes(durationMin) * clampPerceivedIntensity(rpe)
  const jPlus = useMemo(
    () => (event ? jPlusLabel(daysSinceMatch(event.date, getToday()), lang) : null),
    [event, lang],
  )

  return (
    <BottomSheet
      open={open && event != null}
      onClose={handleClose}
      ariaLabel={lang === 'fr' ? 'Enregistrer la charge du match' : 'Log match load'}
      hideDefaultHeader
      disableSwipeDismiss={busy}
      disableBackdropDismiss={busy}
      showClose={!busy}
    >
      {event ? (
        <div
          className="relative overflow-hidden px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1"
          data-testid="match-load-sheet"
        >
          <ClubCrestWatermark
            code={event.opponent_code}
            name={event.opponent}
            size="sheet"
          />

          <div className="relative z-[1]">
            {mode === 'absence' ? (
              <button
                type="button"
                onClick={goToPlayedMode}
                disabled={busy}
                data-testid="match-load-back-played"
                className="mb-3.5 flex items-center gap-1.5 self-start border-0 bg-transparent p-0 pb-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-brand disabled:opacity-50 rf-focus-ring rounded"
              >
                {copy.backPlayed}
              </button>
            ) : null}

            <div className="inline-flex items-center gap-2">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-brand text-on-brand">
                <Calendar className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-fg">
                {copy.eyebrow}
              </span>
              {jPlus ? (
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-muted">
                  · {jPlus}
                </span>
              ) : null}
            </div>

            <h2
              className="mt-3 font-serif italic font-extrabold leading-[1.02] text-fg [text-wrap:balance]"
              style={{ fontSize: 34, letterSpacing: '-0.5px' }}
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 text-[14px] font-semibold text-fg-muted">{subtitle}</p>
            ) : null}

            {mode === 'played' ? (
              <div className="mt-[22px] space-y-2.5">
                <div className="flex items-center gap-3 rounded-[18px] border border-paper-deep bg-app py-3.5 pl-[18px] pr-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted">
                      {copy.minutes}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={MIN_MINUTES}
                        max={MAX_MINUTES}
                        value={durationMin}
                        onChange={(e) => setDurationMin(clampMinutes(Number(e.target.value) || MIN_MINUTES))}
                        data-testid="match-load-minutes"
                        className="w-[5.75rem] border-0 bg-transparent p-0 text-[52px] font-black leading-none tracking-[-2px] text-fg tabular-nums outline-none rf-focus-ring rounded"
                        aria-label={copy.minutes}
                      />
                      <span className="text-[15px] font-extrabold text-fg-muted">{copy.minUnit}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="match-load-minutes-minus"
                    disabled={busy || durationMin <= MIN_MINUTES}
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] border border-paper-deep bg-paper-soft text-[22px] font-bold text-fg disabled:opacity-40 rf-focus-ring select-none touch-none"
                    aria-label={lang === 'fr' ? 'Moins une minute' : 'Minus one minute'}
                    {...minusHold}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    data-testid="match-load-minutes-plus"
                    disabled={busy || durationMin >= MAX_MINUTES}
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-fg text-[22px] font-bold text-paper-soft disabled:opacity-40 rf-focus-ring select-none touch-none"
                    aria-label={lang === 'fr' ? 'Plus une minute' : 'Plus one minute'}
                    {...plusHold}
                  >
                    +
                  </button>
                </div>

                <PerceivedIntensityBars value={rpe} onChange={setRpe} lang={lang} disabled={busy} />

                <button
                  type="button"
                  onClick={goToAbsenceMode}
                  disabled={busy}
                  data-testid="match-load-absence-toggle"
                  className="self-center border-0 bg-transparent px-3 pb-1 pt-2.5 text-[14px] font-bold text-fg-muted underline decoration-paper-deep underline-offset-4 disabled:opacity-50 rf-focus-ring rounded-lg"
                >
                  {copy.absenceToggle}
                </button>

                {error ? (
                  <p className="text-sm font-semibold text-danger" role="alert" data-testid="match-load-error">
                    {error}
                  </p>
                ) : null}

                <div className="flex items-baseline justify-between px-1 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted">
                    {copy.estimated}
                  </span>
                  <span className="whitespace-nowrap text-[15px] font-extrabold text-fg tabular-nums">
                    {estimatedLoad}{' '}
                    <span className="text-[11px] font-bold tracking-[0.12em] text-fg-muted">{copy.ua}</span>{' '}
                    <span className="text-[12px] font-semibold text-fg-muted">
                      ({clampMinutes(durationMin)}×{clampPerceivedIntensity(rpe)})
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSavePlayed()}
                  disabled={busy}
                  data-testid="match-load-save"
                  className="mt-1 flex h-[58px] w-full items-center justify-center rounded-[18px] bg-brand text-[15px] font-black uppercase italic tracking-[0.14em] text-on-brand shadow-[0_10px_24px_-10px_rgba(123,13,30,0.6)] transition-colors hover:bg-brand-hover disabled:opacity-60 rf-focus-ring"
                >
                  {savedFlash ? copy.saved : busy ? copy.saving : copy.save}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-2.5 px-0">
                <AbsenceOption
                  testId="match-absence-not-selected"
                  label={copy.notSelected}
                  hint={copy.notSelectedHint}
                  selected={absenceReason === 'not_selected'}
                  disabled={busy}
                  onClick={() => setAbsenceReason('not_selected')}
                />
                <AbsenceOption
                  testId="match-absence-did-not-play"
                  label={copy.didNotPlay}
                  hint={copy.didNotPlayHint}
                  selected={absenceReason === 'did_not_play'}
                  disabled={busy}
                  onClick={() => setAbsenceReason('did_not_play')}
                />

                {error ? (
                  <p className="text-sm font-semibold text-danger" role="alert" data-testid="match-load-error">
                    {error}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleSaveAbsence()}
                  disabled={busy || absenceReason == null}
                  data-testid="match-load-save"
                  className="mt-3 flex h-[58px] w-full items-center justify-center rounded-[18px] bg-brand text-[15px] font-black uppercase italic tracking-[0.14em] text-on-brand shadow-[0_10px_24px_-10px_rgba(123,13,30,0.6)] transition-colors hover:bg-brand-hover disabled:opacity-40 rf-focus-ring"
                >
                  {savedFlash ? copy.saved : busy ? copy.saving : copy.save}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </BottomSheet>
  )
}

function AbsenceOption({
  label,
  hint,
  selected,
  onClick,
  disabled,
  testId,
}: {
  label: string
  hint: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
  testId: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-pressed={selected}
      className={`flex min-h-[84px] w-full items-center gap-3.5 rounded-[18px] border-[1.5px] p-[18px] text-left transition-[border-color,background-color] duration-150 disabled:opacity-50 rf-focus-ring ${
        selected
          ? 'border-brand bg-white'
          : 'border-paper-deep bg-app hover:border-brand-border/80'
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[17px] font-extrabold leading-tight tracking-[-0.2px] text-fg">
          {label}
        </span>
        <span className="text-[14px] font-medium leading-[1.35] text-fg-muted">{hint}</span>
      </div>
      <span
        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          selected ? 'border-brand bg-brand' : 'border-[#CFC3B2] bg-transparent'
        }`}
        aria-hidden
      >
        <span
          className={`h-2 w-2 rounded-full bg-paper-soft ${selected ? 'opacity-100' : 'opacity-0'}`}
        />
      </span>
    </button>
  )
}
