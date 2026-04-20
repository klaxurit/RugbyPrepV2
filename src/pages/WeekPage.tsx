import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Plus, Lock } from 'lucide-react'
import { posthog } from '../services/analytics/posthog'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR } from '../hooks/useACWR'
import { useAuth } from '../hooks/useAuth'
import { useProgramFeatureFlags } from '../hooks/useProgramFeatureFlags'
import { useWeekSnapshot } from '../hooks/useWeekSnapshot'
import { markWeekViewed, useUpsellTiming, isDismissed, dismissUpsell } from '../hooks/useUpsellTiming'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { PremiumUpsellCard } from '../components/PremiumUpsellCard'
import { getGlobalProgramHardBlock } from '../services/program/hasGlobalProgramHardBlock'
import { BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { PlanningContextCard } from '../components/scheduling/PlanningContextCard'
import { useRegisterCoachContext } from '../contexts/CoachContext'
import { NextMatchCard } from '../components/match/NextMatchCard'
import { CalendarWeekTimeline } from '../components/scheduling/CalendarWeekTimeline'
import { WeekPlanningLegend } from '../components/planning'
import { WeekCorrectionToast } from '../components/scheduling/WeekCorrectionToast'
import { SchedulingTransitionBanner, SeasonTransitionBanner } from '../components/SeasonTransitionBanner'
import { useSchedulingTransition } from '../hooks/useSchedulingTransition'
import { useSeasonTransitions } from '../hooks/useSeasonTransitions'
import type { DatedSession } from '../types/scheduling'
import { useReadinessScore } from '../hooks/useReadinessScore'
import { getToday } from '../services/ui/debugDateOverride'
import { mergeDatedSessionCompletion } from '../services/scheduling/mergeDatedSessionCompletion'

function localizeWeekLabel(label: string, lang: 'fr' | 'en'): string {
  if (lang !== 'fr') return label
  return label
    .replace(/\bOff-season\b/gi, 'Inter-saison')
    .replace(/\boff_season\b/gi, 'Inter-saison')
    .replace(/\bPre-season\b/gi, 'Pré-saison')
    .replace(/\bpre_season\b/gi, 'Pré-saison')
    .replace(/\bIn-season\b/gi, 'En saison')
    .replace(/\bin_season\b/gi, 'En saison')
    .replace(/ - W(\d)/, ' - S$1')
}

export function WeekPage() {
  const { profile } = useProfile()
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'
  const { week, lastNonDeloadWeek } = useWeek()
  const { fatigue, setFatigue } = useFatigue()
  const { logs, addLog } = useHistory()
  const { visibleEvents, structuralEvents, addEvent, syncNotification, dismissSyncNotification } = useCalendar()
  const navigate = useNavigate()

  const acwrResult = useACWR(logs, structuralEvents)
  const { isPremium: weekIsPremium } = useFeatureAccess()
  const { canShowUpsell: weekCanShowUpsell } = useUpsellTiming()
  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()

  // Local state shadowing `isDismissed('week_match')` so dismiss re-renders immediately.
  const [weekMatchUpsellDismissed, setWeekMatchUpsellDismissed] = useState(() => isDismissed('week_match'))

  useEffect(() => {
    posthog.capture('week_viewed')
    markWeekViewed()
  }, [])

  // Match non chargé hier → bannière rappel + suggestion mobilité
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const unmatchedYesterdayMatch = visibleEvents.find(
    (e) => e.type === 'match' && e.date === yesterdayStr && !e.rpe
  ) ?? null
  const isRecoveryDay = visibleEvents.some((e) => e.type === 'match' && e.date === yesterdayStr)

  // ── Surface unifiée ────────────────────────────────────────────────────────
  const today = useMemo(() => getToday(), [])
  const nextMatchDate = useMemo(() => {
    const fm = visibleEvents.filter((e) => e.type === 'match' && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
    return fm.length > 0 ? fm[0].date : null
  }, [visibleEvents, today])
  const readinessResult = useReadinessScore({
    acwrZone: acwrResult.hasSufficientData ? acwrResult.zone : null,
    fatigue,
    logs,
    nextMatchDate,
    today,
  })
  const surfaceParams = useMemo(() => ({
    profile,
    events: structuralEvents,
    logs,
    today,
    fatigue,
    acwrZone: acwrResult.hasSufficientData ? acwrResult.zone : null,
    week,
    lastNonDeloadWeek,
    ignoreAcwrOverload: false,
    hasSufficientACWRData: acwrResult.hasSufficientData,
    featureFlags: programFeatureFlags,
    readinessScore: readinessResult.score,
    userId,
  }), [profile, structuralEvents, logs, today, fatigue, acwrResult.hasSufficientData, acwrResult.zone, week, lastNonDeloadWeek, programFeatureFlags, readinessResult.score, userId])
  const {
    surface, blockProgression, snapshot,
    skipSession, rescheduleSession, markDayUnavailable,
    undoCorrection, confirmPendingUpdate,
    setFatigue: snapshotSetFatigue, addMatch,
    hasConfirmationRequired,
    toastMessage, clearToast,
  } = useWeekSnapshot(surfaceParams)
  const weekPresentation = snapshot?.presentation ?? null

  // ── Transition banners (scheduling > season, max 1) ────────────────────────
  // Use snapshot-visible mode, not raw upstream, to respect snapshot ownership
  const visibleSchedulingMode = snapshot?.surface?.schedulingMode ?? surface?.schedulingMode ?? null
  const { transition: schedulingTransition, dismiss: dismissSchedulingTransition } = useSchedulingTransition({
    schedulingMode: visibleSchedulingMode,
    logs,
    today,
    userId,
  })
  const { transition: seasonTransition, dismiss: dismissSeasonTransition } = useSeasonTransitions({
    planningContext: surface?.planningContext ?? null,
    today,
  })

  // ── Hard-block global ──────────────────────────────────────────────────────
  const { hasHardBlock, hardBlockReasons } = getGlobalProgramHardBlock(profile)

  useEffect(() => {
    if (hasHardBlock) {
      posthog.capture('beta_eligibility_blocked', {
        surface: 'week_page',
        primaryReason: hardBlockReasons[0] ?? null,
        reasons: hardBlockReasons,
      })
    }
  }, [hasHardBlock, hardBlockReasons])

  const primarySource = surface?.primarySource ?? 'mother_session'
  const isUnavailable = primarySource === 'unavailable'
  const msResolution = surface?.motherSession ?? null

  // ── Coach bubble content (extract from warnings + companion) ──────────────
  const coachInfoMessages = useMemo(() => {
    if (!surface || !msResolution) return [] as string[]
    const internalPatterns = [
      'recovery override',
      'repli déterministe',
      'pas de structure',
      'pas de mother session',
      'fréquence.*non prévue',
      'repli sur',
    ]
    const isInternal = (w: string) => internalPatterns.some((p) => new RegExp(p, 'i').test(w))
    return [...new Set([...surface.planningInputWarnings, ...msResolution.warnings])]
      .filter((w) => !isInternal(w))
  }, [surface, msResolution])
  const coachCompanionMessages = msResolution?.companionRecommendations ?? []
  const coachPhaseLabel = surface
    ? localizeWeekLabel(surface.planningContext.weekLabel ?? week, lang)
    : undefined
  const isOffSeason = surface?.planningContext?.cycle === 'off_season'

  useRegisterCoachContext(
    snapshot
      ? {
          scopeKey: snapshot.weekId ?? today,
          phaseLabel: coachPhaseLabel,
          infoMessages: coachInfoMessages,
          companionMessages: coachCompanionMessages,
          chatSeed: coachPhaseLabel
            ? `Je suis en ${coachPhaseLabel}. `
            : undefined,
        }
      : null,
  )

  const calendarSessions: DatedSession[] = useMemo(() => {
    if (!weekPresentation) return []
    const dated = weekPresentation.sessions.filter(
      (s): s is DatedSession => s.kind === 'dated',
    )
    return mergeDatedSessionCompletion(dated, logs, today)
  }, [weekPresentation, logs, today])

  const hasWeekMatch = (weekPresentation?.matchEvents.length ?? 0) > 0
  const isRehabP1 = profile.rehabInjury?.phase === 1
  const arGlobalOk = !isUnavailable
    && readinessResult.score >= 40
    && acwrResult.zone !== 'critical'
    && !isRehabP1
    && msResolution != null

  const activeRecoveryEligibleDays = useMemo(() => {
    if (!arGlobalOk) return [] as import('../types/scheduling').DayOfWeek[]
    const sessionDays = new Set(calendarSessions.map((s) => s.dayOfWeek))
    const clubDaySet = new Set(weekPresentation?.clubDays ?? [])
    const matchDowSet = new Set<number>()
    for (const e of weekPresentation?.matchEvents ?? []) {
      const d = new Date(`${e.date}T12:00:00`)
      matchDowSet.add(d.getDay())
    }
    const unavailSet = new Set(weekPresentation?.unavailableDays ?? [])

    const effortDays = new Set<number>([...sessionDays, ...clubDaySet, ...matchDowSet])
    const DAY_ORDER: import('../types/scheduling').DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]
    return DAY_ORDER.filter((dow) => {
      if (sessionDays.has(dow) || matchDowSet.has(dow) || clubDaySet.has(dow) || unavailSet.has(dow)) return false
      const yesterday = ((dow + 6) % 7) as import('../types/scheduling').DayOfWeek
      return effortDays.has(yesterday)
    })
  }, [arGlobalOk, calendarSessions, weekPresentation])

  const activeRecoveryDates = useMemo(
    () =>
      logs
        .filter((l) => l.sessionType === 'ACTIVE_RECOVERY')
        .map((l) => l.dateISO.slice(0, 10)),
    [logs],
  )

  const confirmationItem = hasConfirmationRequired
    ? snapshot?.confirmationRequired[0] ?? null
    : null

  const weekPageTitle = lang === 'fr' ? 'Ma Semaine' : 'My Week'

  if (hasHardBlock) {
    const hardBlockTitle = lang === 'fr' ? 'Ma Semaine' : 'My Week'
    return (
      <div className="min-h-screen bg-app font-sans text-fg pb-24">
        <PageHeader title={hardBlockTitle} backTo="/home" />
        <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
          <div className="bg-warn-bg border border-warn-bd-strong rounded-2xl p-5 space-y-3">
            <p className="font-bold text-warn-strong">Programme temporairement indisponible</p>
            <ul className="space-y-2">
              {hardBlockReasons.map((r) => (
                <li key={r} className="text-sm text-warn-body">
                  <span className="font-semibold">{BETA_ELIGIBILITY_MESSAGES[r].reason}</span>
                  <br />{BETA_ELIGIBILITY_MESSAGES[r].detail}
                </li>
              ))}
            </ul>
            <p className="text-xs text-fg-muted">
              Ton compte et ton profil sont conservés. Réessaie dans quelques instants.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title={weekPageTitle}
        backTo="/home"
        titleSuffix={
          blockProgression?.currentBlockLabel ??
          localizeWeekLabel(surface?.planningContext.weekLabel ?? week, lang)
        }
      />

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">

        {isUnavailable && (
          <section className="rounded-[24px] border border-warn-bd bg-warn-bg-muted p-5 space-y-3">
            <p className="text-sm font-bold text-warn">Programme en préparation</p>
            <p className="text-xs text-fg-soft">
              Le programme n'a pas pu être généré pour cette semaine. Vérifie ton profil.
            </p>
          </section>
        )}

        {/* Confirmation banner (Category C) */}
        {confirmationItem && (
          <section
            data-testid="confirmation-banner"
            className="flex items-center gap-3 px-4 py-3 bg-warn-bg border border-warn-bd rounded-2xl"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-warn">{confirmationItem.message}</p>
            </div>
            <button
              type="button"
              data-testid="confirmation-banner-cta"
              onClick={() => confirmPendingUpdate(confirmationItem.id)}
              className="flex-shrink-0 px-3 py-2 rounded-2xl bg-warn-button text-on-brand text-[10px] font-black uppercase tracking-wide hover:bg-warn-button-hover transition-colors"
            >
              {confirmationItem.cta}
            </button>
          </section>
        )}

        {/* Transition banner (scheduling > season, max 1) */}
        {!confirmationItem && schedulingTransition && (
          <SchedulingTransitionBanner
            transition={schedulingTransition}
            onAction={() => dismissSchedulingTransition(schedulingTransition.type)}
            onDismiss={() => dismissSchedulingTransition(schedulingTransition.type)}
          />
        )}
        {!confirmationItem && !schedulingTransition && seasonTransition && (
          <SeasonTransitionBanner
            transition={seasonTransition}
            onAction={() => dismissSeasonTransition(seasonTransition.type)}
            onDismiss={() => dismissSeasonTransition(seasonTransition.type)}
          />
        )}

        {/* FFR auto-sync notification */}
        {syncNotification && (
          <section
            data-testid="ffr-sync-notification"
            className="flex items-center gap-3 px-4 py-3 bg-info-bg border border-info-bd rounded-2xl"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-info">{syncNotification}</p>
              <p className="text-[10px] text-fg-muted mt-0.5">Calendrier mis à jour automatiquement</p>
            </div>
            <button
              type="button"
              onClick={dismissSyncNotification}
              className="text-[10px] font-bold text-info hover:text-info/80 transition-colors"
            >
              OK
            </button>
          </section>
        )}

        {msResolution && surface && (
          <section
            className="space-y-5"
            data-testid="annual-plan-section"
            aria-label="Programme de la semaine"
          >
            {/* Match joué — ligne compacte avec CTA "Enregistrer ma charge" */}
            {unmatchedYesterdayMatch && (
              <Link to="/calendar" className="block">
                <NextMatchCard
                  event={unmatchedYesterdayMatch}
                  variant="past"
                  size="mini"
                  ctaLabel="Enregistrer ma charge →"
                />
              </Link>
            )}



            {/* Fatigue check-in discret */}
            <div className="flex items-center justify-between rounded-2xl border border-border-app bg-layer-5 px-4 py-2.5">
              <span className="text-[11px] font-bold text-fg-soft">Ta forme du jour</span>
              <div className="flex gap-1.5 bg-layer-10 rounded-xl p-0.5">
                {(['OK', 'FATIGUE'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    data-testid={`fatigue-btn-${f}`}
                    onClick={() => {
                      setFatigue(f) // persist locally
                      snapshotSetFatigue(f) // heavy correction: re-run engine
                    }}
                    className={`px-3 py-1 rounded-[10px] text-[10px] font-black transition-all ${
                      fatigue === f ? 'bg-layer-20 text-fg shadow-sm' : 'text-fg-muted'
                    }`}
                  >
                    {f === 'OK' ? 'En forme' : 'Fatigué'}
                  </button>
                ))}
              </div>
            </div>

            {snapshot?.explanation && (
              <PlanningContextCard
                explanation={snapshot.explanation}
                hideCorrections
              />
            )}

            {/* Maintenance CTA — permanent until returnDate is set */}
            {surface?.planningContext?.cycle === 'off_season' &&
             surface?.planningContext?.offSeasonPhase === 5 &&
             !profile.planningAnchors?.returnToTeamTrainingAt && (
              <div className="rounded-2xl border border-brand-border bg-brand-soft px-4 py-3 space-y-1.5">
                <p className="text-xs font-bold text-brand-tint">Ton programme d&apos;inter-saison est terminé.</p>
                <p className="text-[10px] text-brand-tint">Indique ta date de reprise pour lancer ta pré-saison.</p>
                <Link to="/profile#reprise" className="inline-flex items-center gap-1 text-[10px] font-black text-brand hover:text-brand-hover transition-colors">
                  Indiquer ma date de reprise →
                </Link>
              </div>
            )}

            {/* Carte match à venir — affichée dès qu'un match est au calendrier,
                indépendamment du mode saison. Le texte "programme ne change pas"
                reste conditionné à off-season + pas de reprise confirmée. */}
            {(() => {
              const futureMatch = structuralEvents.find((e) => e.type === 'match' && e.date >= today)
              if (!futureMatch) return null
              const showFrozenNote =
                isOffSeason && !profile.planningAnchors?.returnToTeamTrainingAt
              return (
                <div className="space-y-2" data-testid="week-match-banner">
                  <Link to="/calendar" className="block">
                    <NextMatchCard event={futureMatch} size="mini" />
                  </Link>
                  {showFrozenNote && (
                    <p className="text-[10px] text-fg-muted px-1">
                      Ton programme ne change pas tant que tu ne confirmes pas ta reprise.
                    </p>
                  )}
                </div>
              )
            })()}

            {/* Séances de la semaine — vue calendrier 7 jours tout le temps,
                y compris off_season (séances placées en Lun/Mer/Ven par défaut). */}
            <div
              data-testid="week-planning-legend"
              className="rounded-2xl border border-border-app bg-layer-5 px-3 py-2.5 flex items-center justify-between gap-3"
            >
              <WeekPlanningLegend />
              <Link
                to="/calendar"
                className="text-[10px] font-bold text-brand-tint hover:text-brand transition-colors whitespace-nowrap flex-shrink-0"
              >
                Mon planning →
              </Link>
            </div>
            <CalendarWeekTimeline
              sessions={calendarSessions}
              matchEvents={weekPresentation?.matchEvents ?? []}
              unavailableDays={weekPresentation?.unavailableDays ?? []}
              clubDays={weekPresentation?.clubDays ?? []}
              corrections={snapshot?.corrections ?? []}
              activeRecoveryDates={activeRecoveryDates}
              activeRecoveryEligibleDays={activeRecoveryEligibleDays}
              isRecoveryDay={isRecoveryDay}
              onActiveRecoveryComplete={(activityType, durationMin, rpe) => {
                addLog({
                  dateISO: new Date().toISOString(),
                  week: week as import('../types/training').CycleWeek,
                  sessionType: 'ACTIVE_RECOVERY',
                  fatigue,
                  rpe,
                  durationMin,
                  sessionLabel: activityType,
                })
              }}
              today={today}
              lang={lang}
              onSessionSelect={(index) => navigate(`/session/${index}`)}
              onSkipSession={skipSession}
              onRescheduleSession={rescheduleSession}
              onMarkDayUnavailable={markDayUnavailable}
              onUndoCorrection={undoCorrection}
            />
          </section>
        )}

        {/* Add match CTA */}
        {!hasWeekMatch && msResolution && surface && (
          <AddMatchInline
            onAddMatch={async (date, opponent) => {
              const matchPayload = {
                date,
                type: 'match' as const,
                opponent: opponent || undefined,
                is_home: true,
                source: 'manual' as const,
              }
              // Persist to Supabase — returns the canonical event with real id
              const createdEvent = await addEvent(matchPayload)
              // Heavy correction with the canonical event
              if (createdEvent) addMatch(createdEvent)
            }}
            lang={lang}
            today={today}
          />
        )}

        {/* T2.5: Upsell contextuel — match dans les 3 jours */}
        {!weekIsPremium && weekCanShowUpsell && !weekMatchUpsellDismissed && (() => {
          const now = new Date()
          now.setHours(0, 0, 0, 0)
          const in3days = new Date(now)
          in3days.setDate(in3days.getDate() + 3)
          const hasMatchSoon = visibleEvents.some((e: { type: string; date: string }) =>
            e.type === 'match' &&
            new Date(e.date + 'T00:00:00') >= now &&
            new Date(e.date + 'T00:00:00') <= in3days
          )
          if (!hasMatchSoon) return null
          return (
            <PremiumUpsellCard
              title="Match dans les prochains jours"
              body="Adapte ta semaine automatiquement en fonction du match — Premium."
              onDismiss={() => {
                dismissUpsell('week_match')
                setWeekMatchUpsellDismissed(true)
              }}
            />
          )
        })()}

        {/* ── Premium CTA for free users ── */}
        {!weekIsPremium && (
          <div className="rounded-[24px] border border-brand-border-strong bg-brand-soft p-4 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-brand/10 flex-shrink-0">
              <Lock className="w-4 h-4 text-brand-tint" />
            </div>
            <div>
              <p className="text-xs font-bold text-fg">Note tes charges après chaque bloc</p>
              <p className="text-[10px] text-fg-muted mt-0.5">Suis ta progression et reçois des suggestions personnalisées.</p>
              <Link to="/profile#premium" className="inline-block mt-2 text-[10px] font-black text-brand-tint uppercase tracking-wider">
                Passer en Premium →
              </Link>
            </div>
          </div>
        )}
      </main>

      <WeekCorrectionToast message={toastMessage} onDismiss={clearToast} />
      <BottomNav />
    </div>
  )
}

// ── Inline add-match component ──────────────────────────────────────

function AddMatchInline({
  onAddMatch,
  lang,
  today,
}: {
  onAddMatch: (date: string, opponent: string) => void
  lang: 'fr' | 'en'
  today: string
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(() => {
    // Default to next Saturday
    const d = new Date(today)
    const dow = d.getDay()
    d.setDate(d.getDate() + ((6 - dow + 7) % 7 || 7))
    return d.toISOString().split('T')[0]
  })
  const [opponent, setOpponent] = useState('')

  if (!open) {
    return (
      <button
        type="button"
        data-testid="add-match-cta"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border-dashed-app text-fg-muted hover:text-brand-tint hover:border-brand-border-strong transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs font-bold">
          {lang === 'fr' ? 'J\'ai un match cette semaine' : 'I have a match this week'}
        </span>
      </button>
    )
  }

  return (
    <div
      data-testid="add-match-form"
      className="bg-glass border border-border-app rounded-2xl p-4 space-y-3"
    >
      <p className="text-xs font-black text-fg">
        {lang === 'fr' ? 'Ajouter un match' : 'Add a match'}
      </p>
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 bg-layer-10 border border-border-app rounded-xl px-3 py-2 text-xs text-fg rf-focus-ring"
        />
        <input
          type="text"
          placeholder={lang === 'fr' ? 'Adversaire' : 'Opponent'}
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          className="flex-1 bg-layer-10 border border-border-app rounded-xl px-3 py-2 text-xs text-fg placeholder:text-fg-faint rf-focus-ring"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-fg-muted hover:text-fg-secondary transition-colors"
        >
          {lang === 'fr' ? 'Annuler' : 'Cancel'}
        </button>
        <button
          type="button"
          data-testid="add-match-confirm"
          onClick={() => {
            if (date) {
              onAddMatch(date, opponent)
              setOpen(false)
              setOpponent('')
            }
          }}
          className="flex-1 py-2 rounded-xl bg-brand text-xs font-black text-on-brand hover:bg-brand-hover transition-colors"
        >
          {lang === 'fr' ? 'Ajouter' : 'Add'}
        </button>
      </div>
    </div>
  )
}
