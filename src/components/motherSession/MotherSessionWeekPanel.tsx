import { useMemo, useState } from 'react'
import { Layers, AlertTriangle } from 'lucide-react'
import type { DayOfWeek } from '../../types/training'
import type { ResolvedMotherSessionSlot } from '../../services/motherSession/resolveMotherSessionsForWeek'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel } from '../../services/motherSession/motherSessionLabels'
import type { SCSchedule, ClubSchedule } from '../../types/training'
import { mapSlotsToScheduleDays, type SlotDayMapping } from '../../services/ui/mapSlotsToScheduleDays'
import { formatTitleFromMotherSessionId } from './formatMotherSessionTitle'

const ROLE_FR: Record<ResolvedMotherSessionSlot['role'], string> = {
  primary: 'Principale',
  secondary: 'Secondaire',
  optional: 'Optionnelle',
}

const SESSION_BADGE_LABELS: Record<string, Record<AppLang, string>> = {
  upper: { fr: 'HAUT', en: 'UPPER' },
  lower: { fr: 'BAS', en: 'LOWER' },
  full: { fr: 'COMPLET', en: 'FULL' },
  full_light_primer: { fr: 'PRIMER', en: 'PRIMER' },
  speed_power: { fr: 'VITESSE', en: 'SPEED' },
}

function getSessionBadgeLabel(type: string, lang: AppLang): string {
  return SESSION_BADGE_LABELS[type]?.[lang] ?? (lang === 'fr' ? 'SÉANCE' : 'SESSION')
}

type MotherSessionWeekPanelProps = {
  sessions: ResolvedMotherSessionSlot[]
  warnings: string[]
  companionRecommendations?: string[]
  status: 'resolved' | 'resolved_with_warnings' | 'missing_session'
  missingMessage?: string
  scSchedule?: SCSchedule
  clubSchedule?: ClubSchedule
  lang?: AppLang
  /** Called when a session card is tapped; receives the slot index. */
  onSessionSelect?: (index: number) => void
  /** Called when user taps "Passer" on a session. */
  onSkipSession?: (sessionId: string) => void
  /** Set of session IDs that have been skipped. */
  skippedSessionIds?: Set<string>
  /** Called when user reschedules a session to a specific day. */
  onRescheduleSession?: (sessionId: string, toDay: DayOfWeek) => void
  /** Days that are unavailable for rescheduling (match, club, correction-blocked). */
  unavailableDays?: DayOfWeek[]
  /** Called when user marks a day unavailable. */
  onMarkDayUnavailable?: (day: DayOfWeek) => void
  /** Corrected day placements from snapshot.presentation. Overrides mapSlotsToScheduleDays. */
  dayOverrides?: SlotDayMapping[]
}

export function MotherSessionWeekPanel({
  sessions,
  warnings,
  companionRecommendations,
  status,
  missingMessage,
  scSchedule,
  clubSchedule,
  lang = 'fr',
  onSessionSelect,
  onSkipSession,
  onRescheduleSession,
  unavailableDays,
  onMarkDayUnavailable,
  skippedSessionIds,
  dayOverrides,
}: MotherSessionWeekPanelProps) {
  const [rescheduleOpenFor, setRescheduleOpenFor] = useState<string | null>(null)
  const dayMappings = useMemo(
    () => dayOverrides ?? mapSlotsToScheduleDays(sessions, scSchedule, clubSchedule?.matchDay),
    [sessions, scSchedule, clubSchedule, dayOverrides],
  )

  if (status === 'missing_session') {
    return (
      <section
        className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 space-y-2"
        data-testid="mother-session-week-missing"
      >
        <p className="flex items-center gap-2 text-sm font-black text-rose-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden />
          {msLabel('sessions_unavailable', lang)}
        </p>
        <p className="text-xs text-fg-secondary leading-relaxed">
          {missingMessage ??
            'Certaines séances ne sont pas encore disponibles dans le jeu de données. Réessaie après une mise à jour de l\'app.'}
        </p>
        {warnings.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-rose-600">
            {warnings.slice(0, 8).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-4" data-testid="mother-session-week-panel">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-medium text-brand-tint">
          <Layers className="h-4 w-4" aria-hidden />
        </div>
        <h3 className="text-sm font-black text-fg">{msLabel('sessions_of_week', lang)}</h3>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 space-y-1">
          {warnings.slice(0, 6).map((w) => (
            <p key={w} className="leading-snug">
              · {w}
            </p>
          ))}
        </div>
      )}

      {companionRecommendations && companionRecommendations.length > 0 && (
        <div className="rounded-2xl border border-border-app bg-layer-5 px-3 py-2 text-xs text-fg-muted space-y-1">
          <p className="text-[10px] font-black uppercase text-fg-muted">{msLabel('out_of_gym', lang)}</p>
          {companionRecommendations.map((c) => (
            <p key={c}>· {c}</p>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2" data-testid="week-session-list">
          {sessions.map((slot, i) => {
            const title = formatTitleFromMotherSessionId(slot.session.metadata.id, lang)
            const dayLabel = dayMappings[i]?.label ?? (slot.dayPreference === 'early_week'
              ? msLabel('session_early_week', lang)
              : slot.dayPreference === 'mid_week'
                ? msLabel('session_mid_week', lang)
                : slot.dayPreference === 'late_week'
                  ? msLabel('session_late_week', lang)
                  : ROLE_FR[slot.role])
            const badgeLabel = getSessionBadgeLabel(slot.session.metadata.sessionType, lang)
            const isSkipped = skippedSessionIds?.has(slot.sessionId) ?? false

            return (
              <div
                key={`${slot.sessionId}-${i}`}
                data-testid={`week-session-card-${i}`}
                className={`w-full flex items-center gap-4 border rounded-[2rem] p-4 transition-all text-left ${
                  isSkipped
                    ? 'bg-layer-5 border-border-app opacity-50'
                    : 'bg-layer-5 border-border-app hover:border-border-app hover:bg-layer-10'
                }`}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${isSkipped ? 'bg-layer-5' : 'bg-brand-soft'}`}>
                  <span className={`text-[10px] font-black tracking-wide ${isSkipped ? 'text-fg-faint' : 'text-brand-tint'}`}>
                    {dayLabel}
                  </span>
                  <span className={`text-[8px] font-bold uppercase ${isSkipped ? 'text-fg-ghost' : 'text-brand-tint'}`}>
                    {badgeLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => !isSkipped && onSessionSelect?.(i)}
                  disabled={isSkipped}
                  className="flex-1 min-w-0 text-left"
                >
                  <h4 className={`font-black text-sm truncate ${isSkipped ? 'text-fg-faint line-through' : 'text-fg'}`}>{title}</h4>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {isSkipped
                      ? (lang === 'fr' ? 'Passée' : 'Skipped')
                      : <>
                          {slot.session.blocks.length} blocs
                          {slot.variant === 'light' ? ' · léger' : ''}
                          {slot.maxBlocks != null ? ` · max ${slot.maxBlocks}` : ''}
                        </>
                    }
                  </p>
                </button>
                {isSkipped ? null : (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onRescheduleSession && (
                      <button
                        type="button"
                        data-testid={`week-reschedule-${i}`}
                        onClick={() => setRescheduleOpenFor(rescheduleOpenFor === slot.sessionId ? null : slot.sessionId)}
                        className="px-2 py-1 rounded-xl text-[9px] font-bold text-fg-faint hover:text-fg-muted hover:bg-layer-10 transition-colors"
                      >
                        {lang === 'fr' ? 'Reporter' : 'Move'}
                      </button>
                    )}
                    {onSkipSession && (
                      <button
                        type="button"
                        data-testid={`week-skip-${i}`}
                        onClick={() => onSkipSession(slot.sessionId)}
                        className="px-2 py-1 rounded-xl text-[9px] font-bold text-fg-faint hover:text-fg-muted hover:bg-layer-10 transition-colors"
                      >
                        {lang === 'fr' ? 'Passer' : 'Skip'}
                      </button>
                    )}
                    {onMarkDayUnavailable && dayMappings[i] && (
                      <button
                        type="button"
                        data-testid={`week-unavailable-${i}`}
                        onClick={() => onMarkDayUnavailable(dayMappings[i].dayNumber as DayOfWeek)}
                        className="px-2 py-1 rounded-xl text-[9px] font-bold text-fg-faint hover:text-fg-muted hover:bg-layer-10 transition-colors"
                        title={lang === 'fr' ? 'Rendre ce jour indisponible' : 'Mark day unavailable'}
                      >
                        {lang === 'fr' ? 'Indispo.' : 'N/A'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSessionSelect?.(i)}
                      className="p-1"
                    >
                      <svg className="w-5 h-5 text-fg-faint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
                {/* Inline day picker for reschedule */}
                {rescheduleOpenFor === slot.sessionId && onRescheduleSession && (
                  <div className="w-full flex gap-1 pt-2 flex-wrap" data-testid={`week-reschedule-picker-${i}`}>
                    {([1, 2, 3, 4, 5] as DayOfWeek[])
                      .filter((d) => !(unavailableDays ?? []).includes(d) && d !== (dayMappings[i]?.dayNumber))
                      .map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            onRescheduleSession(slot.sessionId, d)
                            setRescheduleOpenFor(null)
                          }}
                          className="px-2.5 py-1 rounded-xl text-[9px] font-bold bg-layer-10 text-fg-muted hover:bg-brand-medium hover:text-brand-tint transition-colors"
                        >
                          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d]}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {status === 'resolved_with_warnings' && warnings.length === 0 && (
        <p className="text-[10px] text-fg-faint text-center">Résolution avec recommandations compagnon.</p>
      )}
    </section>
  )
}
