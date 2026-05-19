import { useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Plus, Lock } from 'lucide-react'
import { WeekViewToggle, WeekMonthView, WeekDailyPlanner } from '../components/week'
import { formatTitleFromMotherSessionId } from '../components/motherSession/formatMotherSessionTitle'
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
import { useExerciseSetLogs } from '../hooks/useExerciseSetLogs'
import { computeMonthlyTonnage } from '../services/home/computeMonthlyTonnage'
import { PremiumUpsellCard } from '../components/PremiumUpsellCard'
import { getGlobalProgramHardBlock } from '../services/program/hasGlobalProgramHardBlock'
import { BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { PlanningContextCard } from '../components/scheduling/PlanningContextCard'
import { useRegisterCoachContext, type CoachInfoMessage } from '../contexts/CoachContext'
import { useProgramEvolutionSheet } from '../contexts/ProgramEvolutionSheetContext'
import { useWeekSnapshotConfirmationSheet } from '../hooks/useWeekSnapshotConfirmationSheet'
import { useHintVisibility } from '../hooks/useHintVisibility'
import { NextMatchCard } from '../components/match/NextMatchCard'
import { MatchEditDrawer } from '../components/match/MatchEditDrawer'
import { AddMatchModal } from '../components/match/AddMatchModal'
import { MatchKindFollowUpSheet } from '../components/match/MatchKindFollowUpSheet'
import { suggestedMatchSaturdayISO } from '../components/match/matchDate'
import { WeekCorrectionToast } from '../components/scheduling/WeekCorrectionToast'
import { SchedulingTransitionBanner } from '../components/SeasonTransitionBanner'
import { useSchedulingTransition } from '../hooks/useSchedulingTransition'
import type { DatedSession } from '../types/scheduling'
import { useReadinessScore } from '../hooks/useReadinessScore'
import { getToday } from '../services/ui/debugDateOverride'
import { mergeDatedSessionCompletion } from '../services/scheduling/mergeDatedSessionCompletion'
import { cyclePhaseLabel, tr } from '../i18n/appLabels'
import type { CalendarEvent, MatchKind } from '../types/training'
import { buildProfileUpdatesForManualMatchKind } from '../services/season/buildProfileUpdatesForManualMatchKind'
import { hasPendingOffseasonMatchDecision } from '../services/season/hasPendingOffseasonMatchDecision'
import { planProgramEvolutionAfterManualMatch } from '../services/calendar/planProgramEvolutionAfterManualMatch'

function localizeWeekLabel(label: string, lang: 'fr' | 'en'): string {
  let out = label
    .replace(/\bOff[-_]season\b/gi, cyclePhaseLabel('off_season', lang))
    .replace(/\bPre[-_]season\b/gi, cyclePhaseLabel('pre_season', lang))
    .replace(/\bIn[-_]season\b/gi, cyclePhaseLabel('in_season', lang))
  if (lang === 'fr') out = out.replace(/ - W(\d)/, ' - S$1')
  return out
}

export function WeekPage() {
  const { profile, updateProfile } = useProfile()
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'
  const { week, lastNonDeloadWeek } = useWeek()
  const { fatigue } = useFatigue()
  const { logs, addLog } = useHistory()
  const { visibleEvents, structuralEvents, addEvent, updateMatchKind } = useCalendar()
  const navigate = useNavigate()

  const acwrResult = useACWR(logs, structuralEvents)
  const { isPremium: weekIsPremium } = useFeatureAccess()
  const { logs: exerciseSetLogs } = useExerciseSetLogs()
  const { canShowUpsell: weekCanShowUpsell } = useUpsellTiming()
  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()

  // Local state shadowing `isDismissed('week_match')` so dismiss re-renders immediately.
  const [weekMatchUpsellDismissed, setWeekMatchUpsellDismissed] = useState(() => isDismissed('week_match'))

  // Match edit drawer + monthly grid toggle + add match modal
  const [drawerMatch, setDrawerMatch] = useState<typeof visibleEvents[number] | null>(null)
  const [monthOpen, setMonthOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalDate, setAddModalDate] = useState<string | undefined>(undefined)
  const [pendingManualMatch, setPendingManualMatch] = useState<CalendarEvent | null>(null)

  const openMatchByDate = (dateISO: string) => {
    const match = visibleEvents.find((e) => e.type === 'match' && e.date === dateISO)
    if (match) setDrawerMatch(match)
  }

  const clubDaysForGrid = profile.clubSchedule?.clubDays.map((d) => d.day) ?? []
  const scDaysForGrid = profile.scSchedule?.sessions.map((s) => s.day) ?? []

  useEffect(() => {
    posthog.capture('week_viewed')
    markWeekViewed(userId)
  }, [userId])

  // Match non chargé hier → bannière rappel + suggestion mobilité
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const unmatchedYesterdayMatch = visibleEvents.find(
    (e) => e.type === 'match' && e.date === yesterdayStr && !e.rpe
  ) ?? null
  // (isRecoveryDay supprimé : la nouvelle WeekDailyPlanner détermine la récup
  // jour par jour via activeRecoveryEligibleDays + activeRecoveryDates.)

  // ── Surface unifiée ────────────────────────────────────────────────────────
  const today = useMemo(() => getToday(), [])

  // Charge totale soulevée du mois courant — alimente la 4e stat de WeekMonthView.
  // Le calcul tourne pour tous (le filtre Premium est dans WeekMonthView via blur+lock).
  const monthlyTonnageKg = useMemo(
    () =>
      computeMonthlyTonnage({
        sets: exerciseSetLogs,
        yearMonth: today.slice(0, 7),
        bodyweightKg: profile.weightKg,
      }),
    [exerciseSetLogs, today, profile.weightKg],
  )

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
    surface, snapshot,
    confirmPendingUpdate,
    addMatch,
    hasConfirmationRequired,
    toastMessage, clearToast,
  } = useWeekSnapshot(surfaceParams)
  const weekPresentation = snapshot?.presentation ?? null

  const confirmationItem = hasConfirmationRequired ? snapshot?.confirmationRequired[0] ?? null : null
  useWeekSnapshotConfirmationSheet({
    hasConfirmationRequired,
    confirmationItem,
    confirmPendingUpdate,
    visibleEvents,
    today,
    lang,
  })

  // ── Transition banners (scheduling > season, max 1) ────────────────────────
  // Use snapshot-visible mode, not raw upstream, to respect snapshot ownership
  const visibleSchedulingMode = snapshot?.surface?.schedulingMode ?? surface?.schedulingMode ?? null
  const { transition: schedulingTransition, dismiss: dismissSchedulingTransition } = useSchedulingTransition({
    schedulingMode: visibleSchedulingMode,
    logs,
    today,
    userId,
    lang,
  })

  const { openProgramEvolution } = useProgramEvolutionSheet()

  const dismissCalendarSchedulingIfNeeded = useCallback(() => {
    if (schedulingTransition?.type === 'calendar_mode_activated') {
      dismissSchedulingTransition('calendar_mode_activated')
    }
  }, [schedulingTransition?.type, dismissSchedulingTransition])

  const onMatchAddedProgramEvolution = useCallback(
    (matchDateISO: string) => {
      openProgramEvolution({
        matchDateISO,
        onAcknowledged: dismissCalendarSchedulingIfNeeded,
      })
    },
    [openProgramEvolution, dismissCalendarSchedulingIfNeeded],
  )

  const planningCtxForMatchKind = surface?.planningContext
  const schedulingModeForMatchKind = surface?.schedulingMode ?? 'calendar'

  const finalizeManualMatchKind = useCallback(
    async (kind: MatchKind, created: CalendarEvent) => {
      if (!created.id) return
      await updateMatchKind(created.id, kind)
      const merged: CalendarEvent = { ...created, match_kind: kind }
      if (planningCtxForMatchKind) {
        updateProfile(
          buildProfileUpdatesForManualMatchKind({
            kind,
            eventId: created.id,
            profile,
            today,
            planningContext: planningCtxForMatchKind,
            schedulingMode: schedulingModeForMatchKind,
          }),
        )
      }
      addMatch(merged)
      setPendingManualMatch(null)
      const evolutionPlan = planProgramEvolutionAfterManualMatch({
        matchDate: merged.date,
        today,
        kind,
        snapshotWeekId: snapshot?.weekId,
      })
      if (evolutionPlan.action === 'open_sheet') {
        onMatchAddedProgramEvolution(evolutionPlan.matchDateISO)
      } else if (evolutionPlan.dismissSchedulingBanner) {
        dismissCalendarSchedulingIfNeeded()
      }
    },
    [
      updateMatchKind,
      planningCtxForMatchKind,
      schedulingModeForMatchKind,
      profile,
      today,
      updateProfile,
      addMatch,
      snapshot?.weekId,
      onMatchAddedProgramEvolution,
      dismissCalendarSchedulingIfNeeded,
    ],
  )

  // Coordination cross-page : si un match futur en off-season attend
  // la décision de l'utilisateur (Oui/Non/Pas mon équipe sur le banner
  // SeasonTransitionBanner de /home), on supprime ici le scheduling
  // banner — il ne sert à rien de plus, son trigger est le même
  // événement (calendar mode activated = match détecté).
  const hasPendingOffseasonMatch = useMemo(
    () => hasPendingOffseasonMatchDecision(profile, visibleEvents, today),
    [profile, visibleEvents, today],
  )
  // Season transitions = HomePage (single source of truth).
  // WeekPage only displays scheduling-specific transitions (calendar/block mode changes).

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

  // ── Hint visibility (dismiss persistant Supabase + cooldown + expiration) ──
  // Contexte hash = cycle + phase courante : si l'utilisateur change de phase,
  // un dismiss précédent est invalidé et le hint réapparaît dans la mascotte.
  const planningCtxHash = surface?.planningContext
    ? `${surface.planningContext.cycle}:${surface.planningContext.offSeasonPhase ?? ''}:${surface.planningContext.preSeasonPhase ?? ''}`
    : ''

  const showWeekSkipRecoveryIntro = useMemo(() => {
    const ctx = surface?.planningContext
    if (!ctx) return false
    return (
      ctx.cycle === 'off_season' &&
      ctx.offSeasonPhase === 1 &&
      profile.planningAnchors?.skipOffSeasonRecoveryIntro !== true
    )
  }, [surface?.planningContext, profile.planningAnchors?.skipOffSeasonRecoveryIntro])
  const onboardingHint = useHintVisibility('rule:onboarding_cycle_hint', {
    cooldownDays: 14,
    expireAfterSessions: 5,
    contextHash: planningCtxHash,
  })
  const noMatchHint = useHintVisibility('rule:no_first_match_calendar', {
    cooldownDays: 14,
    expireAfterSessions: 5,
    contextHash: planningCtxHash,
  })
  const phase5CtaHint = useHintVisibility('offseason_phase5_cta', {
    cooldownDays: 30,
    contextHash: planningCtxHash,
  })

  const hintVisibilityById = useMemo<Record<string, { visible: boolean; dismiss: () => void } | undefined>>(
    () => ({
      'rule:onboarding_cycle_hint': onboardingHint,
      'rule:no_first_match_calendar': noMatchHint,
    }),
    [onboardingHint, noMatchHint],
  )

  // ── Coach bubble content (extract from warnings + companion + detail items)
  const coachInfoMessages = useMemo<CoachInfoMessage[]>(() => {
    if (!surface || !msResolution) return []
    const internalPatterns = [
      'recovery override',
      'repli déterministe',
      'pas de structure',
      'pas de mother session',
      'fréquence.*non prévue',
      'repli sur',
    ]
    const isInternal = (w: string) => internalPatterns.some((p) => new RegExp(p, 'i').test(w))
    const out: CoachInfoMessage[] = []
    const seenText = new Set<string>()

    // 1. Detail items from buildExplanation (rule-tagged → dismissable per id).
    for (const item of snapshot?.explanation?.detailItems ?? []) {
      const vis = hintVisibilityById[item.ruleId]
      if (vis && !vis.visible) continue
      if (seenText.has(item.text)) continue
      seenText.add(item.text)
      out.push({
        id: item.ruleId,
        text: item.text,
        contextHash: planningCtxHash,
        onDismiss: vis?.dismiss,
      })
    }

    // 2. Free-form warnings (planning + mother session).
    for (const w of [...surface.planningInputWarnings, ...msResolution.warnings]) {
      if (isInternal(w)) continue
      if (seenText.has(w)) continue
      seenText.add(w)
      out.push({ id: `warning:${w.slice(0, 40)}`, text: w })
    }
    return out
  }, [surface, msResolution, snapshot?.explanation, hintVisibilityById, planningCtxHash])

  const coachCompanionMessages = msResolution?.companionRecommendations ?? []
  const coachPhaseLabel = surface
    ? localizeWeekLabel(surface.planningContext.weekLabel ?? week, lang)
    : undefined
  // (isOffSeason déclaration retirée : utilisée uniquement pour la frozen note du
  // bandeau J-X qui a été supprimé. Re-déclarer si nouveau besoin.)

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
  const arGlobalOk = !isUnavailable
    && readinessResult.score >= 40
    && acwrResult.zone !== 'critical'
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

  const weekPageTitle = lang === 'fr' ? 'Ma Semaine' : 'My Week'

  if (hasHardBlock) {
    const hardBlockTitle = lang === 'fr' ? 'Ma Semaine' : 'My Week'
    return (
      <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav">
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
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={weekPageTitle} backTo="/home" />

      {/* Bandeau éditorial : eyebrow phase + H1 italic + toggle Semaine/Mois.
          Refonte UI mai 2026 — donne l'identité "magazine" à la page sans
          casser PageHeader (cohérence inter-pages). */}
      <div className="px-[22px] pt-5 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-[1.5px] w-6 bg-brand" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
            {localizeWeekLabel(surface?.planningContext.weekLabel ?? week, lang)}
          </p>
        </div>
        <h1
          className="font-serif italic text-[34px] font-extrabold leading-[0.95] text-fg [text-wrap:balance]"
          style={{ letterSpacing: '-1.2px' }}
        >
          Cette<br />semaine.
        </h1>
        <div className="mt-4">
          <WeekViewToggle
            value={monthOpen ? 'month' : 'week'}
            onChange={(next) => setMonthOpen(next === 'month')}
          />
        </div>
      </div>

      <main className="px-6 pt-5 space-y-5 max-w-md mx-auto relative">

        {isUnavailable && (
          <section className="rounded-[24px] border border-warn-bd bg-warn-bg-muted p-5 space-y-3">
            <p className="text-sm font-bold text-warn">Programme en préparation</p>
            <p className="text-xs text-fg-soft">
              Le programme n'a pas pu être généré pour cette semaine. Vérifie ton profil.
            </p>
          </section>
        )}

        {/* Cat. C : confirmation snapshot → {@link useWeekSnapshotConfirmationSheet} (bottom sheet). */}

        {/* Scheduling transition (calendar/block mode changes) — season
            transitions live on HomePage. Supprimé quand un match en
            attente de décision (`match_detected_in_offseason`) existe :
            le banner SeasonTransitionBanner sur /home est la surface
            unique pour cette décision, on évite d'empiler 2 popups sur
            le même événement. */}
        {!hasConfirmationRequired &&
          schedulingTransition &&
          !hasPendingOffseasonMatch &&
          schedulingTransition.type !== 'calendar_mode_activated' && (
          <SchedulingTransitionBanner
            transition={schedulingTransition}
            lang={lang}
            onAction={() => dismissSchedulingTransition(schedulingTransition.type)}
            onDismiss={() => dismissSchedulingTransition(schedulingTransition.type)}
          />
        )}

        {msResolution && surface && (
          <section
            className="space-y-5"
            data-testid="annual-plan-section"
            aria-label="Programme de la semaine"
          >
            {/* Match joué — ligne compacte avec CTA "Enregistrer ma charge" */}
            {unmatchedYesterdayMatch && (
              <button
                type="button"
                onClick={() => setDrawerMatch(unmatchedYesterdayMatch)}
                className="block w-full text-left rf-focus-ring"
              >
                <NextMatchCard
                  event={unmatchedYesterdayMatch}
                  variant="past"
                  size="mini"
                  ctaLabel="Enregistrer ma charge →"
                />
              </button>
            )}

            {/* Fatigue check-in retiré — désormais inline dans le HeroNormal côté HomePage.
                La fatigue persiste via useFatigue (localStorage) et est consommée par
                surfaceParams ici → useWeekSnapshot re-résout le programme automatiquement. */}

            {snapshot?.explanation && (
              <PlanningContextCard
                explanation={snapshot.explanation}
                hideCorrections
                contextHash={planningCtxHash}
                weekLabel={
                  surface?.planningContext?.weekLabel
                    ? localizeWeekLabel(surface.planningContext.weekLabel, lang)
                    : undefined
                }
                summaryFooterAction={
                  showWeekSkipRecoveryIntro
                    ? {
                        label: tr('profile_skip_recovery_intro_btn', lang),
                        testId: 'week-skip-recovery-intro',
                        onClick: () => {
                          updateProfile({
                            planningAnchors: {
                              ...profile.planningAnchors,
                              skipOffSeasonRecoveryIntro: true,
                            },
                          })
                        },
                      }
                    : undefined
                }
              />
            )}

            {/* Maintenance CTA — dismissable, réapparaît après 30j ou si phase change */}
            {surface?.planningContext?.cycle === 'off_season' &&
             surface?.planningContext?.offSeasonPhase === 5 &&
             !profile.planningAnchors?.returnToTeamTrainingAt &&
             phase5CtaHint.visible && (
              <div className="rounded-2xl border border-brand-border bg-brand-soft px-4 py-3 flex items-start gap-3">
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-bold text-brand-tint">Ton programme d&apos;inter-saison est terminé.</p>
                  <p className="text-[10px] text-brand-tint">Indique ta date de reprise pour lancer ta pré-saison.</p>
                  <Link to="/profile#reprise" className="inline-flex items-center gap-1 text-[10px] font-black text-brand hover:text-brand-hover transition-colors">
                    Indiquer ma date de reprise →
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={phase5CtaHint.dismiss}
                  aria-label="Masquer cette suggestion"
                  className="flex-shrink-0 p-1 rounded-lg text-brand-tint/60 hover:text-brand-tint hover:bg-brand/10 transition-colors"
                >
                  <span aria-hidden className="text-sm leading-none">×</span>
                </button>
              </div>
            )}

            {/* Bandeau J-X retiré — le match apparaît déjà sur Home (NextMatchEditorialCard),
                dans la grille du mois, et dans l'IndexLine de la semaine. Pas besoin
                d'une 4e occurrence. */}

            {/* Vue Semaine : DayStrip + FeatureCard + IndexLine (refonte UI mai 2026).
                Vue Mois : extras éditoriaux + grille mensuelle. */}
            {!monthOpen ? (
              <WeekDailyPlanner
                sessions={calendarSessions}
                matchEvents={weekPresentation?.matchEvents ?? []}
                unavailableDays={weekPresentation?.unavailableDays ?? []}
                clubDays={weekPresentation?.clubDays ?? []}
                activeRecoveryDates={activeRecoveryDates}
                activeRecoveryEligibleDays={activeRecoveryEligibleDays}
                logs={logs}
                todayISO={today}
                lang={lang}
                formatSessionTitle={(id) => formatTitleFromMotherSessionId(id, lang)}
                onSessionSelect={(index) => navigate(`/session/${index}`)}
                onSelectMatchByDate={openMatchByDate}
                onActiveRecoveryQuick={(activity, dateISO) => {
                  addLog({
                    dateISO: `${dateISO}T12:00:00.000Z`,
                    week: week as import('../types/training').CycleWeek,
                    sessionType: 'ACTIVE_RECOVERY',
                    fatigue,
                    rpe: 3,
                    durationMin: 20,
                    sessionLabel: activity,
                  })
                }}
              />
            ) : (
              <div className="animate-rf-fade">
                <WeekMonthView
                  events={visibleEvents}
                  logs={logs}
                  clubDays={clubDaysForGrid}
                  scDays={scDaysForGrid}
                  todayISO={today}
                  monthlyTonnageKg={monthlyTonnageKg}
                  isPremium={weekIsPremium}
                  onSelectMatch={(e) => setDrawerMatch(e)}
                  onAddForDate={(dateISO) => {
                    setAddModalDate(dateISO)
                    setAddModalOpen(true)
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* Add match CTA */}
        {!hasWeekMatch && msResolution && surface && (
          <AddMatchInline
            lang={lang}
            onOpen={() => {
              setAddModalDate(suggestedMatchSaturdayISO(today))
              setAddModalOpen(true)
            }}
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
              title={tr('week_upsell_match_title', lang)}
              body={tr('week_upsell_match_body', lang)}
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
                Activer Premium →
              </Link>
            </div>
          </div>
        )}
      </main>

      <WeekCorrectionToast message={toastMessage} onDismiss={clearToast} />
      <BottomNav />

      <MatchEditDrawer
        event={drawerMatch}
        onClose={() => setDrawerMatch(null)}
        matchKindProfileContext={
          surface?.planningContext
            ? {
                planningContext: surface.planningContext,
                schedulingMode: surface.schedulingMode ?? 'calendar',
                today,
              }
            : undefined
        }
      />
      <AddMatchModal
        open={addModalOpen}
        todayISO={today}
        initialDate={addModalDate}
        existingEvents={visibleEvents}
        onClose={() => {
          setAddModalOpen(false)
          setAddModalDate(undefined)
        }}
        onSave={async (payload) => {
          const created = await addEvent({ ...payload, source: 'manual' })
          if (!created) return
          if (created.type === 'match') {
            setPendingManualMatch(created)
          } else {
            addMatch(created)
          }
        }}
      />

      <MatchKindFollowUpSheet
        open={pendingManualMatch != null}
        lang={lang}
        matchDateISO={pendingManualMatch?.date}
        opponent={pendingManualMatch?.opponent}
        onSelect={(kind) => {
          const ev = pendingManualMatch
          if (!ev) return
          void finalizeManualMatchKind(kind, ev)
        }}
      />
    </div>
  )
}

// ── Inline add-match component ──────────────────────────────────────

function AddMatchInline({
  onOpen,
  lang,
}: {
  onOpen: () => void
  lang: 'fr' | 'en'
}) {
  return (
    <button
      type="button"
      data-testid="add-match-cta"
      onClick={onOpen}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border-dashed-app text-fg-muted hover:text-brand-tint hover:border-brand-border-strong transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span className="text-xs font-bold">
        {lang === 'fr' ? 'J\'ai un match cette semaine' : 'I have a match this week'}
      </span>
    </button>
  )
}
