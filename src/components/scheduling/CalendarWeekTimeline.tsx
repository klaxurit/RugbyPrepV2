import { useState } from 'react'
import { MoreVertical, Undo2, X } from 'lucide-react'
import type { DatedSession, DayOfWeek, PresentedMatchEvent, WeekCorrection } from '../../types/scheduling'
import { formatTitleFromMotherSessionId } from '../motherSession/formatMotherSessionTitle'
import { parseLocalDate } from '../../services/scheduling/parseLocalDate'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { InlineActiveRecovery, ActiveRecoveryBadge } from '../ActiveRecoveryCard'
import { WeekTimelineRow } from '../planning/WeekTimelineRow'
import { SessionStatusIndicator } from '../planning/SessionStatusIndicator'
import { ClubAvatar } from '../match/ClubAvatar'
import { SessionActionsSheet } from './SessionActionsSheet'

const DAY_LABELS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
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
  /** Clic sur une row match — ouvre le MatchEditDrawer côté parent. */
  onSelectMatch?: (matchDateISO: string) => void
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
  onSelectMatch,
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

      <div className="space-y-3.5">
      {DAY_ORDER.map((dow) => {
        const dayLabel = DAY_LABELS_FULL[dow]
        const daySessions = sessionsByDay.get(dow) ?? []
        const matchEvent = matchByDay.get(dow)
        const hasMatch = matchEvent != null
        const isUserUnavailable = unavailableSet.has(dow)
        const isClubDay = clubSet.has(dow)
        const isToday = dow === todayDow
        const hasSessions = daySessions.length > 0
        const isEmpty = !hasSessions && !hasMatch && !isUserUnavailable && !isClubDay

        const dayLabelColor = (() => {
          if (isToday) return 'text-brand-tint'
          if (isUserUnavailable) return 'text-fg-muted'
          return 'text-fg-soft'
        })()

        const stateLabel = (() => {
          if (isToday) return { text: 'Aujourd\'hui', color: 'text-brand-tint' }
          if (isUserUnavailable) return { text: 'Indispo', color: 'text-fg-muted' }
          if (isEmpty) return { text: 'Repos', color: 'text-fg-ghost' }
          return null
        })()

        const rowInner = (
          <>
            {/* Header de jour centré : nom complet du jour (LUNDI...) en
                top, état (Aujourd'hui / Repos / Indispo) en sous-ligne.
                Pas de pill ni de bordure : le jour est juste un titre, le
                contenu en dessous prime. */}
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span
                className={`text-xs font-black uppercase tracking-wider leading-none ${dayLabelColor}`}
              >
                {dayLabel}
              </span>
              {stateLabel && (
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider leading-none ${stateLabel.color}`}
                >
                  {stateLabel.text}
                </span>
              )}
            </div>

            {/* Day content (column layout : sous le label de jour) */}
            <div className="min-w-0 space-y-1.5">
              {/* Match card (enriched) */}
              {hasMatch && (() => {
                const addMatchCorrection = corrections.find(
                  (c) => c.type === 'add_match' && c.reversible && c.matchDate === matchEvent.date,
                )
                const clickable = onSelectMatch != null
                return (
                  <div
                    data-testid={`timeline-match-${dow}`}
                    onClick={clickable ? () => onSelectMatch(matchEvent.date) : undefined}
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onSelectMatch(matchEvent.date)
                            }
                          }
                        : undefined
                    }
                    className={`rounded-xl border border-warn-bd bg-warn-bg py-2 px-3 ${
                      clickable ? 'cursor-pointer hover:bg-warn-bg-strong transition-colors rf-focus-ring' : ''
                    }`}
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
                          {(matchEvent.is_home != null || matchEvent.is_neutral || matchEvent.kickoff_time) && (() => {
                            const locationLabel = matchEvent.is_neutral
                              ? 'Terrain neutre'
                              : matchEvent.is_home != null
                                ? matchEvent.is_home ? 'Domicile' : 'Extérieur'
                                : null
                            return (
                              <p className="mt-0.5 text-[9px] text-warn opacity-80">
                                {locationLabel}
                                {locationLabel && matchEvent.kickoff_time && ' · '}
                                {matchEvent.kickoff_time && `${matchEvent.kickoff_time}`}
                              </p>
                            )
                          })()}
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
                    <span
                      className="inline-flex h-5 max-w-full items-center text-[10px] font-bold leading-none"
                      style={{ color: 'var(--color-event-club-fg)' }}
                    >
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
            data-today={isToday || undefined}
            data-empty={isEmpty || undefined}
            data-unavailable={isUserUnavailable || undefined}
            className="flex flex-col gap-1.5"
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
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false)
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

            {!isSkipped && !isCompleted && (onRescheduleSession || onSkipSession || onMarkDayUnavailable) && (
              <button
                type="button"
                data-testid={`timeline-actions-${globalIndex}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setActionsSheetOpen(true)
                }}
                aria-label="Plus d'actions"
                title="Plus d'actions"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-layer-7 hover:text-fg-secondary rf-focus-ring"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            )}
          </div>
        </WeekTimelineRow>
      </div>

      {/* Bottom sheet d'actions — Replanifier / Passer / Indispo. */}
      <SessionActionsSheet
        open={actionsSheetOpen}
        onClose={() => setActionsSheetOpen(false)}
        sessionTitle={title}
        currentDay={s.dayOfWeek}
        unavailableDays={allUnavailableDays}
        onReschedule={
          onRescheduleSession
            ? (toDay) => onRescheduleSession(s.sessionSlot.sessionId, toDay)
            : undefined
        }
        onSkip={
          onSkipSession ? () => onSkipSession(s.sessionSlot.sessionId) : undefined
        }
        onMarkDayUnavailable={
          onMarkDayUnavailable ? () => onMarkDayUnavailable(sessionDayOfWeek) : undefined
        }
      />

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
