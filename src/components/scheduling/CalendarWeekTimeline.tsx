import { useState } from 'react'
import { ArrowRight, CalendarOff, Play, SkipForward, Undo2, X } from 'lucide-react'
import type { DatedSession, DayOfWeek, PresentedMatchEvent, WeekCorrection } from '../../types/scheduling'
import { formatTitleFromMotherSessionId } from '../motherSession/formatMotherSessionTitle'
import { parseLocalDate } from '../../services/scheduling/parseLocalDate'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { InlineActiveRecovery, ActiveRecoveryBadge } from '../ActiveRecoveryCard'
import { WeekTimelineRow } from '../planning/WeekTimelineRow'
import { SessionStatusIndicator } from '../planning/SessionStatusIndicator'
import { ClubAvatar } from '../match/ClubAvatar'

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0] // Mon→Sun

interface CalendarWeekTimelineProps {
  sessions: DatedSession[]
  matchEvents: PresentedMatchEvent[]
  /** Days the user explicitly marked unavailable. */
  unavailableDays: DayOfWeek[]
  /** Days structurally occupied by club rugby training. */
  clubDays?: DayOfWeek[]
  /** Active corrections on the snapshot — used for local undo affordances. */
  corrections?: WeekCorrection[]
  /** ISO dates (YYYY-MM-DD) where active recovery was logged — badge récup (bleu info). */
  activeRecoveryDates?: string[]
  /** Days of week eligible for inline active-recovery module (empty = disabled). */
  activeRecoveryEligibleDays?: DayOfWeek[]
  /** Whether today is J+1 after a match (changes AR copy). */
  isRecoveryDay?: boolean
  /** Callback when the player completes an active-recovery activity inline. */
  onActiveRecoveryComplete?: (activityType: string, durationMin: number, rpe: number) => void
  today: string
  lang?: AppLang
  onSessionSelect?: (index: number) => void
  onSkipSession?: (sessionId: string) => void
  onRescheduleSession?: (sessionId: string, toDay: DayOfWeek) => void
  onMarkDayUnavailable?: (day: DayOfWeek) => void
  onUndoCorrection?: (correctionId: string) => void
}

export function CalendarWeekTimeline({
  sessions,
  matchEvents,
  unavailableDays,
  clubDays = [],
  corrections = [],
  activeRecoveryDates = [],
  activeRecoveryEligibleDays = [],
  isRecoveryDay = false,
  onActiveRecoveryComplete,
  today,
  lang = 'fr',
  onSessionSelect,
  onSkipSession,
  onRescheduleSession,
  onMarkDayUnavailable,
  onUndoCorrection,
}: CalendarWeekTimelineProps) {
  const matchByDay = new Map<DayOfWeek, PresentedMatchEvent>()
  for (const e of matchEvents) {
    matchByDay.set(parseLocalDate(e.date).getDay() as DayOfWeek, e)
  }
  const unavailableSet = new Set(unavailableDays)
  const clubSet = new Set(clubDays)
  const todayDate = parseLocalDate(today)
  const todayDow = todayDate.getDay() as DayOfWeek

  // Active recovery: eligible days and completed dates
  const arEligibleSet = new Set(activeRecoveryEligibleDays)
  const arDateSet = new Set(activeRecoveryDates)
  const dowHasActiveRecovery = (dow: DayOfWeek): boolean => {
    const diff = dow - todayDow
    const d = new Date(todayDate)
    d.setDate(d.getDate() + diff)
    const iso = d.toISOString().slice(0, 10)
    return arDateSet.has(iso)
  }

  // Index sessions by dayOfWeek
  const sessionsByDay = new Map<DayOfWeek, DatedSession[]>()
  for (const s of sessions) {
    const list = sessionsByDay.get(s.dayOfWeek) ?? []
    list.push(s)
    sessionsByDay.set(s.dayOfWeek, list)
  }

  return (
    <section
      className="rounded-[24px] border border-border-app bg-tl-card p-4 shadow-elevated"
      data-testid="calendar-week-timeline"
    >
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-fg">Cette semaine</p>
          <p className="text-[10px] text-fg-muted">Répartition jour par jour</p>
        </div>
      </div>

      <div className="space-y-2">
      {DAY_ORDER.map((dow) => {
        const dayLabel = DAY_LABELS[dow]
        const daySessions = sessionsByDay.get(dow) ?? []
        const matchEvent = matchByDay.get(dow)
        const hasMatch = matchEvent != null
        const isUserUnavailable = unavailableSet.has(dow)
        const isClubDay = clubSet.has(dow)
        const isToday = dow === todayDow
        const hasSessions = daySessions.length > 0
        const isEmpty = !hasSessions && !hasMatch && !isUserUnavailable && !isClubDay

        const dayRowClasses = (() => {
          if (isToday) {
            return 'border-2 border-brand-border-strong bg-tl-today shadow-sm'
          }
          if (isUserUnavailable) {
            return 'border border-bd-muted bg-layer-2'
          }
          if (isClubDay) {
            return 'border border-bd-soft bg-tl-pool'
          }
          return 'border border-bd-soft bg-tl-day'
        })()

        const dayPillClasses = (() => {
          if (isToday) {
            return 'border-brand-border bg-brand-soft text-brand-tint'
          }
          if (isUserUnavailable) {
            return 'border-bd-muted bg-layer-5 text-fg-muted'
          }
          if (isClubDay) {
            return 'border-bd-soft bg-layer-7 text-fg-soft'
          }
          return 'border-bd-soft bg-tl-pool text-fg-soft'
        })()

        const rowInner = (
          <>
            {/* Day label — vertically centered, REPOS above, AUJ. below */}
            <div className={`flex-shrink-0 w-12 rounded-2xl border px-2 py-2 flex flex-col items-center justify-center ${dayPillClasses}`}>
              {isEmpty && (
                <span className="text-[7px] font-bold uppercase tracking-wider text-fg-ghost leading-none">
                  Repos
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                {dayLabel}
              </span>
              {isToday && (
                <span className="text-[7px] font-bold uppercase text-brand-tint leading-none">
                  Auj.
                </span>
              )}
            </div>

            {/* Day content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Match card (enriched) */}
              {hasMatch && (() => {
                const addMatchCorrection = corrections.find(
                  (c) => c.type === 'add_match' && c.reversible && c.matchDate === matchEvent.date,
                )
                return (
                  <div
                    data-testid={`timeline-match-${dow}`}
                    className="rounded-xl border border-warn-bd bg-warn-bg py-2 px-3"
                  >
                    <WeekTimelineRow planKind="match" layout="embedded" data-testid={`week-timeline-match-${dow}`}>
                      <div className="flex min-w-0 items-center gap-2">
                        <ClubAvatar
                          code={matchEvent.opponent_code}
                          name={matchEvent.opponent}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black uppercase text-warn-strong">
                            Match{matchEvent.opponent ? ` vs ${matchEvent.opponent}` : ''}
                          </p>
                          {(matchEvent.is_home != null || matchEvent.kickoff_time) && (
                            <p className="mt-0.5 text-[9px] text-warn opacity-80">
                              {matchEvent.is_home != null && (matchEvent.is_home ? 'Domicile' : 'Extérieur')}
                              {matchEvent.is_home != null && matchEvent.kickoff_time && ' · '}
                              {matchEvent.kickoff_time && `${matchEvent.kickoff_time}`}
                            </p>
                          )}
                        </div>
                        {addMatchCorrection && onUndoCorrection && (
                          <button
                            type="button"
                            data-testid={`timeline-undo-match-${dow}`}
                            onClick={() => onUndoCorrection(addMatchCorrection.id)}
                            className="flex flex-shrink-0 items-center gap-0.5 text-[9px] font-bold text-danger-soft transition-colors hover:text-danger"
                          >
                            <Undo2 className="h-3 w-3" />
                            Annuler
                          </button>
                        )}
                      </div>
                    </WeekTimelineRow>
                  </div>
                )
              })()}

              {/* Sessions */}
              {daySessions.map((s, i) => (
                <SessionRow
                  key={`${s.sessionSlot.sessionId}-${i}`}
                  session={s}
                  globalIndex={sessions.indexOf(s)}
                  lang={lang}
                  allUnavailableDays={unavailableDays}
                  corrections={corrections}
                  onSessionSelect={onSessionSelect}
                  onSkipSession={onSkipSession}
                  onRescheduleSession={onRescheduleSession}
                  onMarkDayUnavailable={onMarkDayUnavailable}
                  onUndoCorrection={onUndoCorrection}
                  sessionDayOfWeek={dow}
                />
              ))}

              {/* Club rugby training day — visible even when sessions are scheduled */}
              {isClubDay && !hasMatch && (
                hasSessions ? (
                  <WeekTimelineRow
                    planKind="club"
                    layout="embedded"
                    data-testid={`timeline-club-${dow}`}
                    className="px-2 py-0.5"
                  >
                    <span className="inline-flex h-5 max-w-full items-center leading-none text-[9px] text-fg-muted">
                      Entraînement club aussi ce jour
                    </span>
                  </WeekTimelineRow>
                ) : (
                  <WeekTimelineRow
                    planKind="club"
                    layout="standalone"
                    data-testid={`timeline-club-${dow}`}
                    className="items-center py-1.5"
                  >
                    <span className="inline-flex h-5 max-w-full items-center text-[10px] font-bold leading-none text-violet-700">
                      Entraînement club
                    </span>
                  </WeekTimelineRow>
                )
              )}

              {/* User-marked unavailable day */}
              {isUserUnavailable && !hasSessions && !hasMatch && (() => {
                const unavailCorrection = corrections.find(
                  (c) => c.type === 'unavailable_day' && c.toDay === dow && c.reversible,
                )
                return (
                  <div data-testid={`timeline-user-unavailable-${dow}`} className="flex items-center gap-1.5 py-1.5 rounded-xl border border-bd-muted bg-layer-5 px-2.5">
                    <X className="w-3 h-3 text-fg-muted shrink-0" aria-hidden />
                    <span className="text-[10px] font-bold text-fg-muted flex-1">Indisponible</span>
                    {unavailCorrection && onUndoCorrection && (
                      <button
                        type="button"
                        data-testid={`timeline-undo-unavailable-${dow}`}
                        onClick={() => onUndoCorrection(unavailCorrection.id)}
                        className="flex items-center gap-0.5 text-[9px] font-bold text-brand-tint hover:text-brand-tint transition-colors"
                      >
                        <Undo2 className="w-3 h-3" />
                        Annuler
                      </button>
                    )}
                  </div>
                )
              })()}

              {/* Empty rest day — AR module or badge if eligible, otherwise empty */}
              {isEmpty && (
                <div className="py-1" data-testid={`timeline-rest-${dow}`}>
                  {dowHasActiveRecovery(dow) ? (
                    <WeekTimelineRow planKind="recovery" layout="standalone" className="items-start">
                      <ActiveRecoveryBadge />
                    </WeekTimelineRow>
                  ) : arEligibleSet.has(dow) && onActiveRecoveryComplete ? (
                    <WeekTimelineRow planKind="recovery" layout="standalone" className="items-start">
                      <InlineActiveRecovery
                        isRecoveryDay={isRecoveryDay && dow === todayDow}
                        onComplete={onActiveRecoveryComplete}
                      />
                    </WeekTimelineRow>
                  ) : null}
                </div>
              )}
            </div>
          </>
        )

        return (
          <div
            key={dow}
            data-testid={`timeline-day-${dow}`}
            className={`flex gap-3 rounded-2xl p-3 transition-colors ${dayRowClasses}`}
          >
            {rowInner}
          </div>
        )
      })}
      </div>
    </section>
  )
}

// ── Session row with inline corrections ─────────────────────────────

function SessionRow({
  session: s,
  globalIndex,
  lang,
  allUnavailableDays,
  corrections,
  onSessionSelect,
  onSkipSession,
  onRescheduleSession,
  onMarkDayUnavailable,
  onUndoCorrection,
  sessionDayOfWeek,
}: {
  session: DatedSession
  globalIndex: number
  lang: AppLang
  allUnavailableDays: DayOfWeek[]
  corrections: WeekCorrection[]
  onSessionSelect?: (index: number) => void
  onSkipSession?: (sessionId: string) => void
  onRescheduleSession?: (sessionId: string, toDay: DayOfWeek) => void
  onMarkDayUnavailable?: (day: DayOfWeek) => void
  onUndoCorrection?: (correctionId: string) => void
  sessionDayOfWeek: DayOfWeek
}) {
  const [showReschedule, setShowReschedule] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [showUnavailableConfirm, setShowUnavailableConfirm] = useState(false)
  const title = formatTitleFromMotherSessionId(s.sessionSlot.session.metadata.id, lang)
  const isSkipped = s.completionStatus === 'skipped'
  const isCompleted = s.completionStatus === 'completed'
  const rawBlocks = s.sessionSlot.session.blocks.length
  const maxBlocks = s.sessionSlot.maxBlocks
  const effectiveBlocks = maxBlocks != null && maxBlocks < rawBlocks
    ? `${maxBlocks} blocs`
    : `${rawBlocks} blocs`

  const skipCorrection = corrections.find(
    (c) => c.type === 'skip' && c.sessionId === s.sessionSlot.sessionId && c.reversible,
  )

  const statusSlot =
      isCompleted ? (
        <SessionStatusIndicator status="completed" data-testid={`timeline-session-status-${globalIndex}`} />
      )
      : isSkipped ? (
          <SessionStatusIndicator
            status="skipped"
            onUndo={
              skipCorrection && onUndoCorrection ? () => onUndoCorrection(skipCorrection.id) : undefined
            }
            data-testid={`timeline-session-status-${globalIndex}`}
          />
        )
      : undefined

  return (
    <div>
      <div
        className={`rounded-xl transition-all ${
          isSkipped
            ? 'border border-edge-hairline bg-layer-2 opacity-50'
            : isCompleted
              ? 'border border-ok-bd bg-ok-bg shadow-sm'
              : 'border border-ok-bd bg-ok-bg hover:shadow-sm'
        }`}
      >
        <WeekTimelineRow
          planKind="personal"
          layout="embedded"
          statusSlot={statusSlot}
          data-testid={`week-timeline-session-${globalIndex}`}
          className="py-2 px-3"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => !isSkipped && onSessionSelect?.(globalIndex)}
              disabled={isSkipped}
              className="min-w-0 flex-1 text-left"
            >
              <p
                className={`truncate text-xs font-black ${
                  isSkipped ? 'text-fg-faint line-through' : isCompleted ? 'text-brand-tint' : 'text-fg'
                }`}
              >
                {title}
              </p>
              <p
                className={`mt-0.5 text-[10px] ${isCompleted ? 'text-brand-tint' : 'text-fg-muted'}`}
                data-testid={`session-meta-${globalIndex}`}
              >
                {isSkipped ? (
                  <>
                    {effectiveBlocks}
                    {s.sessionSlot.variant === 'light' ? ' · léger' : ''}
                  </>
                ) : isCompleted ? (
                  lang === 'fr' ? (
                    <>
                      Faite · {effectiveBlocks}
                      {s.sessionSlot.variant === 'light' ? ' · léger' : ''}
                    </>
                  ) : (
                    <>
                      Done · {effectiveBlocks}
                      {s.sessionSlot.variant === 'light' ? ' · light' : ''}
                    </>
                  )
                ) : (
                  <>
                    {effectiveBlocks}
                    {s.sessionSlot.variant === 'light' ? ' · léger' : ''}
                    {s.matchProximity ? ` · ${s.matchProximity}` : ''}
                  </>
                )}
              </p>
            </button>

            {!isSkipped && !isCompleted && (
              <div className="flex flex-shrink-0 items-center gap-1">
                {onRescheduleSession && (
                  <button
                    type="button"
                    data-testid={`timeline-reschedule-${globalIndex}`}
                    onClick={() => {
                      setShowReschedule(!showReschedule)
                      setShowSkipConfirm(false)
                      setShowUnavailableConfirm(false)
                    }}
                    className="rounded-lg border border-bd-soft bg-tl-pool p-1.5 text-fg-muted transition-colors hover:border-layer-15 hover:text-fg-secondary"
                    title="Reporter"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {onSkipSession && (
                  <button
                    type="button"
                    data-testid={`timeline-skip-${globalIndex}`}
                    onClick={() => {
                      setShowSkipConfirm(!showSkipConfirm)
                      setShowReschedule(false)
                      setShowUnavailableConfirm(false)
                    }}
                    className="rounded-lg border border-bd-soft bg-tl-pool p-1.5 text-fg-muted transition-colors hover:border-layer-15 hover:text-fg-secondary"
                    title="Passer"
                  >
                    <SkipForward className="h-3 w-3" />
                  </button>
                )}
                {onMarkDayUnavailable && (
                  <button
                    type="button"
                    data-testid={`timeline-unavailable-${globalIndex}`}
                    onClick={() => {
                      setShowUnavailableConfirm(!showUnavailableConfirm)
                      setShowSkipConfirm(false)
                      setShowReschedule(false)
                    }}
                    className="rounded-lg border border-bd-soft bg-tl-pool p-1.5 text-fg-muted transition-colors hover:border-layer-15 hover:text-fg-secondary"
                    title="Jour indisponible"
                  >
                    <CalendarOff className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSessionSelect?.(globalIndex)}
                  className="rounded-lg bg-brand-soft p-1.5 text-brand-tint transition-colors hover:bg-brand-border"
                >
                  <Play className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </WeekTimelineRow>
      </div>

      {/* Inline skip confirmation */}
      {showSkipConfirm && onSkipSession && (
        <div className="flex items-center gap-2 pt-1 pl-3" data-testid={`timeline-skip-confirm-${globalIndex}`}>
          <span className="text-[9px] text-fg-muted flex-1">
            Tu es sûr ? Cette séance ne sera pas rattrapée.
          </span>
          <button
            type="button"
            data-testid={`timeline-skip-confirm-yes-${globalIndex}`}
            onClick={() => { onSkipSession(s.sessionSlot.sessionId); setShowSkipConfirm(false) }}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-danger-bg-cta text-danger-soft hover:bg-danger-bg-hover transition-colors"
          >
            Confirmer
          </button>
          <button
            type="button"
            data-testid={`timeline-skip-confirm-no-${globalIndex}`}
            onClick={() => setShowSkipConfirm(false)}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-layer-10 text-fg-soft hover:bg-layer-15 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Inline reschedule day picker — club days remain eligible */}
      {showReschedule && onRescheduleSession && (
        <div className="flex gap-1 pt-1 pl-3 flex-wrap" data-testid={`timeline-reschedule-picker-${globalIndex}`}>
          {(DAY_ORDER as DayOfWeek[])
            .filter((d) => d !== s.dayOfWeek && !allUnavailableDays.includes(d))
            .map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onRescheduleSession(s.sessionSlot.sessionId, d)
                  setShowReschedule(false)
                }}
                className="px-2 py-1 rounded-lg text-[9px] font-bold bg-layer-10 text-fg-secondary hover:bg-brand-border hover:text-brand-tint transition-colors"
              >
                {DAY_LABELS[d]}
              </button>
            ))}
        </div>
      )}

      {/* Inline unavailable confirmation */}
      {showUnavailableConfirm && onMarkDayUnavailable && (
        <div className="flex items-center gap-2 pt-1 pl-3" data-testid={`timeline-unavailable-confirm-${globalIndex}`}>
          <span className="text-[9px] text-fg-muted flex-1">
            Marquer ce jour indisponible ?
          </span>
          <button
            type="button"
            data-testid={`timeline-unavailable-confirm-yes-${globalIndex}`}
            onClick={() => { onMarkDayUnavailable(sessionDayOfWeek); setShowUnavailableConfirm(false) }}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-warn-bg-strong text-warn hover:bg-warn-bg transition-colors"
          >
            Confirmer
          </button>
          <button
            type="button"
            data-testid={`timeline-unavailable-confirm-no-${globalIndex}`}
            onClick={() => setShowUnavailableConfirm(false)}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-layer-10 text-fg-soft hover:bg-layer-15 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Local undo for rescheduled session */}
      {!isSkipped && (() => {
        const rescheduleCorrection = corrections.find(
          (c) => c.type === 'reschedule' && c.sessionId === s.sessionSlot.sessionId && c.reversible,
        )
        if (!rescheduleCorrection || !onUndoCorrection) return null
        return (
          <div className="flex items-center gap-1 pt-1 pl-3" data-testid={`timeline-undo-reschedule-${globalIndex}`}>
            <button
              type="button"
              onClick={() => onUndoCorrection(rescheduleCorrection.id)}
              className="flex items-center gap-0.5 text-[9px] font-bold text-brand-tint hover:text-brand-tint transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              Annuler le report
            </button>
          </div>
        )
      })()}
    </div>
  )
}
