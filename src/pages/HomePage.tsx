import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { posthog } from '../services/analytics/posthog'
import { motion } from 'framer-motion'
import {
  Play,
  Clock,
  Activity,
  Calendar,
  Zap,
  ChevronRight,
  History,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  TrendingUp,
  Trophy,
  ChevronDown,
  Info,
  MessageSquare,
  Lock,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useProfile } from '../hooks/useProfile'
import { useFatigue } from '../hooks/useFatigue'
import { useWeek } from '../hooks/useWeek'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../hooks/useAuth'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR, ACWR_ZONE_CONFIG } from '../hooks/useACWR'
import { useWeekSnapshot } from '../hooks/useWeekSnapshot'
import { useProgramFeatureFlags } from '../hooks/useProgramFeatureFlags'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { useAthleteTests } from '../hooks/useAthleteTests'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useReadinessScore } from '../hooks/useReadinessScore'
import { useWeeklySummary } from '../hooks/useWeeklySummary'
import { ReadinessScoreCard } from '../components/ReadinessScoreCard'
import { WeeklySummaryCard } from '../components/WeeklySummaryCard'
import { PremiumBlurredPreview } from '../components/PremiumBlurredPreview'
import { SeasonTransitionBanner, SchedulingTransitionBanner } from '../components/SeasonTransitionBanner'
import { useSeasonTransitions } from '../hooks/useSeasonTransitions'
import { useSchedulingTransition } from '../hooks/useSchedulingTransition'
import { ReadinessScoreSkeleton, WeeklySummarySkeleton } from '../components/SkeletonCard'
import { getToday } from '../services/ui/debugDateOverride'
import { formatTitleFromMotherSessionId } from '../components/motherSession/formatMotherSessionTitle'
import type { CycleWeek, SessionType, SeasonPhase, TransitionEntry } from '../types/training'
import { appendTransitionEntry, computeDeferralExpiry } from '../services/season/transitionJournal'
import type { SequentialSession } from '../types/scheduling'
import { mergeDatedSessionCompletion } from '../services/scheduling/mergeDatedSessionCompletion'
import { cycleToSeasonPhase } from '../services/season/cycleToSeasonPhase'

// ─── Helpers ────────────────────────────────────────────────

const seasonPhaseLabel: Record<SeasonPhase, { label: string; color: string; bg: string }> = {
  'off-season': { label: 'Inter-saison', color: 'text-badge-muted-fg', bg: 'bg-badge-muted-bg' },
  'pre-season': { label: 'Pré-saison', color: 'text-warn-strong', bg: 'bg-warn-bg' },
  'in-season': { label: 'En saison', color: 'text-brand-tint', bg: 'bg-brand-soft' },
  'playoffs': { label: 'Playoffs', color: 'text-danger', bg: 'bg-danger-bg' },
}

const diffDays = (dateStr: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const sessionTypeLabel: Record<SessionType, string> = {
  UPPER: 'Haut du Corps',
  LOWER: 'Bas du Corps',
  FULL: 'Corps Complet',
  CONDITIONING: 'Conditionnement',
  RECOVERY: 'Récupération',
  ACTIVE_RECOVERY: 'Récupération active',
}

const sessionTypeIcon: Record<SessionType, React.ReactNode> = {
  UPPER: <Dumbbell className="w-4 h-4" />,
  LOWER: <Activity className="w-4 h-4" />,
  FULL: <Zap className="w-4 h-4" />,
  CONDITIONING: <Activity className="w-4 h-4" />,
  RECOVERY: <Activity className="w-4 h-4" />,
  ACTIVE_RECOVERY: <Activity className="w-4 h-4" />,
}

const sessionTypeStyles: Record<SessionType, string> = {
  UPPER: 'bg-blue-50 text-blue-600 border border-blue-200',
  LOWER: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  FULL: 'bg-amber-50 text-amber-600 border border-amber-200',
  CONDITIONING: 'bg-violet-50 text-violet-600 border border-violet-200',
  RECOVERY: 'bg-teal-50 text-teal-600 border border-teal-200',
  ACTIVE_RECOVERY: 'bg-sky-50 text-sky-600 border border-sky-200',
}

const weekLabel = (w: CycleWeek) => (w === 'DELOAD' ? 'Semaine légère' : w.startsWith('H') ? `Hypertrophie ${w.replace('H', '')}` : `Semaine ${w.replace('W', '')}`)

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Durée estimée par niveau (4 blocs × séries × récup)
const LEVEL_DURATION: Record<string, string> = {
  starter:     '~30 min',
  builder:     '~45 min',
  performance: '~55 min',
}


const TRAINING_LEVEL_LABEL: Record<string, string> = {
  starter:     '🌱 Fondations',
  builder:     '🏆 Avancé',
  performance: '🏆 Avancé',
}

function getVisibleTrainingLevel(level: string | undefined): 'starter' | 'performance' {
  return level === 'starter' ? 'starter' : 'performance'
}

// ─── Main ────────────────────────────────────────────────────

export function HomePage() {
  const { profile, updateProfile } = useProfile()
  const { authState } = useAuth()
  const { fatigue } = useFatigue()
  const { week } = useWeek()
  const { logs } = useHistory()
  const { structuralEvents, visibleEvents, nextMatch, nextStructuralMatch, isMatchDay, hideImportedEvent } = useCalendar()

  const acwr = useACWR(logs, structuralEvents)
  const { isPremium, loading: entitlementsLoading } = useFeatureAccess()
  // Don't show premium-gated sections until entitlements are resolved
  // This prevents a flash of blurred content for premium users
  const premiumResolved = !entitlementsLoading
  const { getHistoryFor } = useAthleteTests()

  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()

  // ── Surface pour déterminer la séance du jour ─────────────────────────────
  const today = useMemo(() => {
    return getToday()
  }, [])

  // Readiness score computed before surface so it can feed into monitoring modulation
  const { logs: blockLogs } = useBlockLogs()
  const readinessResult = useReadinessScore({
    acwrZone: acwr.hasSufficientData ? acwr.zone : null,
    fatigue,
    logs,
    nextMatchDate: nextStructuralMatch?.date ?? null,
    today,
  })

  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const surfaceParams = useMemo(() => ({
    profile,
    events: structuralEvents,
    logs,
    today,
    fatigue,
    acwrZone: acwr.hasSufficientData ? acwr.zone : null,
    week,
    lastNonDeloadWeek: week,
    ignoreAcwrOverload: false,
    hasSufficientACWRData: acwr.hasSufficientData,
    featureFlags: programFeatureFlags,
    readinessScore: readinessResult.score,
    userId,
  }), [profile, structuralEvents, logs, today, fatigue, acwr.hasSufficientData, acwr.zone, week, programFeatureFlags, readinessResult.score, userId])
  const {
    surface, blockProgression, snapshot,
  } = useWeekSnapshot(surfaceParams)

  // Season phase derived from the single source of truth (planning context)
  const seasonPhase = cycleToSeasonPhase(surface?.planningContext?.cycle)

  const weekPresentation = snapshot?.presentation ?? null

  // In calendar mode, find today's active (non-skipped, non-completed) session from the corrected presentation
  let todayDatedSession: import('../types/scheduling').DatedSession | null = null
  let todaySessionIndex: number | null = null
  if (weekPresentation?.mode === 'calendar') {
    const todayDow = new Date(today + 'T12:00:00').getDay()
    const allDatedRaw = weekPresentation.sessions.filter(
      (s): s is import('../types/scheduling').DatedSession => s.kind === 'dated',
    )
    const allDated = mergeDatedSessionCompletion(allDatedRaw, logs, today)
    for (let i = 0; i < allDated.length; i++) {
      const s = allDated[i]
      if (
        s.dayOfWeek === todayDow &&
        s.completionStatus !== 'skipped' &&
        s.completionStatus !== 'completed'
      ) {
        todayDatedSession = s
        todaySessionIndex = i
        break
      }
    }
  }

  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'

  // ── Premium features: weekly summary ──────────────────────────────────────
  const weeklySummary = useWeeklySummary({
    logs,
    blockLogs,
    plannedSessionCount: weekPresentation?.sessions.length ?? 0,
    today,
  })
  const { transition: seasonTransition, dismiss: dismissSeasonTransition } = useSeasonTransitions({
    planningContext: surface?.planningContext ?? null,
    today,
    visibleEvents: visibleEvents ?? [],
    profile,
  })
  const { transition: schedulingTransition, dismiss: dismissSchedulingTransition } = useSchedulingTransition({
    schedulingMode: surface?.schedulingMode ?? null,
    logs,
    today,
    userId,
  })


  const todaySessionTitle = todayDatedSession
    ? formatTitleFromMotherSessionId(todayDatedSession.sessionSlot.session.metadata.id, lang)
    : null

  // ── Sequential mode awareness ────────────────────────────────────────────
  const isSequential = surface?.schedulingMode === 'sequential'
  const sequentialSessions: SequentialSession[] = useMemo(() => {
    if (!isSequential || !weekPresentation) return []
    return weekPresentation.sessions.filter(
      (s): s is SequentialSession => s.kind === 'sequential',
    )
  }, [isSequential, weekPresentation])
  const nextSequentialSession = sequentialSessions.length > 0 ? sequentialSessions[0] : null
  const nextSequentialTitle = nextSequentialSession
    ? formatTitleFromMotherSessionId(nextSequentialSession.sessionSlot.session.metadata.id, lang)
    : null

  const sessionsThisWeek = logs.filter((l) => l.week === week).length
  const recentLogs = logs.slice(0, 2)
  const injuryAlertNow = useMemo(
    () => new Date(`${today}T12:00:00`).getTime(),
    [today],
  )
  const [injuryDismissed, setInjuryDismissed] = useState(false)

  const visibleTrainingLevel = getVisibleTrainingLevel(profile.trainingLevel)
  // Adapt duration/frequency to the actual programme (recovery sessions are shorter)
  const actualSessionCount = (weekPresentation?.sessions?.length || 0) > 0
    ? weekPresentation!.sessions.length
    : (profile.weeklySessions ?? 3)
  const isRecoveryWeek = surface?.planningContext?.loadManagementOverride === 'recovery'
  const sessionDuration = isRecoveryWeek ? '~30 min' : LEVEL_DURATION[profile.trainingLevel ?? 'builder']
  const trainingLevelLabel = TRAINING_LEVEL_LABEL[visibleTrainingLevel]


  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* ── Header ── */}
      <PageHeader
        title={lang === 'fr' ? 'Accueil' : 'Home'}
        right={
        authState.status !== 'authenticated' ? (
          <Link
            to="/auth/login"
            className="px-3 py-2 rounded-2xl border border-white/20 bg-white/15 text-xs font-bold text-shell-text-muted hover:bg-white/30 hover:text-shell-text transition-colors"
          >
            Se connecter
          </Link>
        ) : undefined}
      />

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto relative">

        {/* ── Hero Card : Saison + Séance + CTA ── */}
        <section data-testid="home-hero-card">
          <div className="bg-glass border border-border-app rounded-[24px] p-5 space-y-4">
            {/* Row 1: Season phase + match info */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const cfg = seasonPhaseLabel[seasonPhase]
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {cfg.label}
                    </span>
                  )
                })()}
                {isSequential && blockProgression?.currentBlockLabel ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-medium text-brand-tint">
                    {blockProgression.currentBlockLabel}
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-medium text-brand-tint">
                    {weekLabel(week)}
                  </span>
                )}
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-layer-10 text-fg-soft">
                  {trainingLevelLabel}
                </span>
              </div>
            </div>

            {/* Match day or next match inline */}
            {isMatchDay && (
              <div className="flex items-center gap-2 py-2 px-3 bg-warn-bg border border-warn-bd rounded-2xl">
                <Trophy className="w-4 h-4 text-warn-strong fill-current" />
                <span className="text-xs font-black text-warn-strong uppercase tracking-wide">Jour de match !</span>
              </div>
            )}
            {nextMatch && !isMatchDay && (
              <Link to="/calendar" className="block">
                <div className="flex items-center gap-3 py-2 px-3 bg-layer-5 rounded-2xl group">
                  <div className="w-8 h-8 rounded-xl bg-warn-bg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-warn-strong" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-fg">Prochain match — J−{diffDays(nextMatch.date)}</span>
                    {nextMatch.opponent && (
                      <span className="text-[10px] text-fg-muted ml-2">vs {nextMatch.opponent}</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-fg-faint group-hover:text-brand-tint transition-colors" />
                </div>
              </Link>
            )}

            {/* Session info */}
            <div className="space-y-1">
              {isSequential ? (
                nextSequentialTitle ? (
                  <>
                    <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wider" data-testid="home-hero-label">Ta prochaine séance</p>
                    <h3 className="text-xl font-black text-fg">{nextSequentialTitle}</h3>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-black text-fg" data-testid="home-hero-idle">Reprends quand tu veux</h3>
                    <p className="text-xs text-fg-muted">Ton programme t'attend, à ton rythme.</p>
                  </>
                )
              ) : todaySessionTitle ? (
                <>
                  <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wider" data-testid="home-hero-label">Séance du jour</p>
                  <h3 className="text-xl font-black text-fg">{todaySessionTitle}</h3>
                </>
              ) : (
                <h3 className="text-xl font-black text-fg">Pas de séance aujourd'hui</h3>
              )}
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-xs font-medium text-fg-soft">
                  <Clock className="w-3.5 h-3.5 text-fg-faint" />
                  {sessionDuration}
                </span>
                {isSequential && nextSequentialSession ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-fg-soft" data-testid="home-hero-sequence">
                    <Activity className="w-3.5 h-3.5 text-fg-faint" />
                    Séance {nextSequentialSession.sequenceIndex} sur {nextSequentialSession.totalInWeek}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-fg-soft">
                    <Activity className="w-3.5 h-3.5 text-fg-faint" />
                    {actualSessionCount} séance{actualSessionCount > 1 ? 's' : ''} cette semaine
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <Link
              to={isSequential
                ? '/week'
                : (todaySessionIndex != null ? `/session/${todaySessionIndex}` : '/week')}
              data-testid="home-cta-primary"
              className="block"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 bg-brand hover:bg-brand-hover transition-colors"
              >
                <Play className="w-4 h-4 text-on-brand fill-current" />
                <span className="font-black text-on-brand text-sm tracking-wide">
                  {isSequential
                    ? 'Voir mes séances'
                    : (todayDatedSession ? 'Commencer la séance' : 'Voir ma semaine')}
                </span>
              </motion.button>
            </Link>
          </div>
        </section>

        {/* ── Transition Banner (max 1: scheduling > season) ── */}
        {schedulingTransition ? (
          <SchedulingTransitionBanner
            transition={schedulingTransition}
            onAction={() => dismissSchedulingTransition(schedulingTransition.type)}
            onDismiss={() => dismissSchedulingTransition(schedulingTransition.type)}
          />
        ) : seasonTransition ? (
          seasonTransition.type === 'match_detected_in_offseason' ? (
            <SeasonTransitionBanner
              transition={seasonTransition}
              onConfirmResume={() => {
                // "Oui, ma saison reprend"
                const prevAnchors = { ...profile.planningAnchors }
                const entry: TransitionEntry = {
                  id: `t-${Date.now()}`,
                  at: today,
                  trigger: 'ffr_match',
                  from: {
                    cycle: surface?.planningContext?.cycle ?? 'off_season',
                    weekNumber: surface?.planningContext?.weekNumber ?? 1,
                    phase: surface?.planningContext?.offSeasonPhase,
                    schedulingMode: surface?.schedulingMode ?? 'sequential',
                  },
                  anchorsSnapshot: prevAnchors,
                  to: 'pre_season',
                }
                const cleanAnchors = { ...prevAnchors }
                delete cleanAnchors.seasonEndedAt
                delete cleanAnchors.seasonEndedSource
                updateProfile({
                  planningAnchors: cleanAnchors,
                  seasonTransitionState: {
                    ...appendTransitionEntry(profile.seasonTransitionState, entry),
                    activeDeferral: undefined,
                    offseasonMatchResumeAckEventId: seasonTransition.matchEventId,
                  },
                })
              }}
              onDeferMatch={() => {
                // "Non, pas maintenant" — create deferral
                if (seasonTransition.type !== 'match_detected_in_offseason') return
                const { matchEventId, matchDate } = seasonTransition
                const matchEvent = (visibleEvents ?? []).find((e) => e.id === matchEventId)
                if (!matchEvent) return
                updateProfile({
                  seasonTransitionState: {
                    ...profile.seasonTransitionState,
                    offseasonMatchResumeAckEventId: undefined,
                    activeDeferral: {
                      eventId: matchEvent.id ?? `unknown-${matchDate}`,
                      matchDateAtDefer: matchDate,
                      deferredAt: today,
                      expiresAt: computeDeferralExpiry(matchDate, today),
                    },
                  },
                })
              }}
              onHideMatch={() => {
                // "Ce n'est pas mon équipe" — hide the match
                if (seasonTransition.type !== 'match_detected_in_offseason') return
                const matchEvent = (visibleEvents ?? []).find((e) => e.id === seasonTransition.matchEventId)
                if (matchEvent?.id) {
                  hideImportedEvent(matchEvent.id)
                  const st = profile.seasonTransitionState
                  const clearAck = st?.offseasonMatchResumeAckEventId === matchEvent.id
                  const clearDef = st?.activeDeferral?.eventId === matchEvent.id
                  if (clearAck || clearDef) {
                    updateProfile({
                      seasonTransitionState: {
                        ...st,
                        ...(clearAck ? { offseasonMatchResumeAckEventId: undefined } : {}),
                        ...(clearDef ? { activeDeferral: undefined } : {}),
                      },
                    })
                  }
                }
              }}
              onDismiss={() => {
                // X button = same as defer for this banner type
                if (seasonTransition.type !== 'match_detected_in_offseason') return
                const { matchEventId, matchDate } = seasonTransition
                const matchEvent = (visibleEvents ?? []).find((e) => e.id === matchEventId)
                if (!matchEvent) return
                updateProfile({
                  seasonTransitionState: {
                    ...profile.seasonTransitionState,
                    offseasonMatchResumeAckEventId: undefined,
                    activeDeferral: {
                      eventId: matchEvent.id ?? `unknown-${matchDate}`,
                      matchDateAtDefer: matchDate,
                      deferredAt: today,
                      expiresAt: computeDeferralExpiry(matchDate, today),
                    },
                  },
                })
              }}
            />
          ) : (
            <SeasonTransitionBanner
              transition={seasonTransition}
              onAction={() => {
                if (seasonTransition.type === 'season_ended') {
                  const prevAnchors = { ...profile.planningAnchors }
                  const entry: TransitionEntry = {
                    id: `t-${Date.now()}`,
                    at: today,
                    trigger: 'banner_action',
                    from: {
                      cycle: surface?.planningContext?.cycle ?? 'in_season',
                      weekNumber: surface?.planningContext?.weekNumber ?? 1,
                      phase: surface?.planningContext?.mesocycleWeek,
                      schedulingMode: surface?.schedulingMode ?? 'calendar',
                    },
                    anchorsSnapshot: prevAnchors,
                    to: 'off_season',
                  }
                  const cleanAnchors = { ...prevAnchors }
                  delete cleanAnchors.manualPlayoffs
                  updateProfile({
                    seasonMode: 'off_season',
                    planningAnchors: {
                      ...cleanAnchors,
                      seasonEndedAt: seasonTransition.lastMatchDate,
                      seasonEndedSource: 'manual',
                    },
                    seasonTransitionState: appendTransitionEntry(profile.seasonTransitionState, entry),
                  })
                } else if (seasonTransition.type === 'playoffs_suggested') {
                  const entry: TransitionEntry = {
                    id: `t-${Date.now()}`,
                    at: today,
                    trigger: 'banner_action',
                    from: {
                      cycle: surface?.planningContext?.cycle ?? 'in_season',
                      weekNumber: surface?.planningContext?.weekNumber ?? 1,
                      schedulingMode: surface?.schedulingMode ?? 'calendar',
                    },
                    anchorsSnapshot: { ...profile.planningAnchors },
                    to: 'playoffs',
                  }
                  updateProfile({
                    planningAnchors: {
                      ...profile.planningAnchors,
                      manualPlayoffs: true,
                    },
                    seasonTransitionState: appendTransitionEntry(profile.seasonTransitionState, entry),
                  })
                } else if (seasonTransition.type === 'pre_season_suggested') {
                  // Navigate to profile where the user can set their return date
                  window.location.href = '/profile#reprise'
                }
                dismissSeasonTransition(seasonTransition.type)
              }}
              onDismiss={() => dismissSeasonTransition(seasonTransition.type)}
            />
          )
        ) : null}

        {/* ── Readiness Score ── */}
        <section>
          {!premiumResolved ? (
            <ReadinessScoreSkeleton />
          ) : isPremium ? (
            <ReadinessScoreCard result={readinessResult} />
          ) : (
            <PremiumBlurredPreview label="Score de forme">
              <ReadinessScoreCard result={readinessResult} />
            </PremiumBlurredPreview>
          )}
        </section>

        {/* ── Stats Row ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">Récapitulatif</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Week / Block */}
            <div className="bg-glass border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-2">
              <div className="p-2 rounded-2xl bg-layer-10 text-brand-tint">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-lg font-black tracking-tight text-fg leading-none" data-testid="home-stats-cycle">
                {isSequential
                  ? `B${(blockProgression?.currentBlockIndex ?? 0) + 1}`
                  : (week === 'DELOAD' ? 'DL' : week)}
              </div>
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">
                {isSequential ? 'Bloc' : 'Cycle'}
              </div>
            </div>

            {/* Fatigue */}
            <div className="bg-glass border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-2">
              <div className={`p-2 rounded-2xl ${fatigue === 'OK' ? 'bg-ok-bg text-ok-strong' : 'bg-warn-bg-muted text-warn-body'}`}>
                {fatigue === 'OK'
                  ? <CheckCircle2 className="w-5 h-5" />
                  : <AlertTriangle className="w-5 h-5" />
                }
              </div>
              <div className={`text-lg font-black tracking-tight leading-none ${fatigue === 'OK' ? 'text-ok-strong' : 'text-warn'}`}>
                {fatigue === 'OK' ? 'OK' : 'Élevée'}
              </div>
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">Fatigue</div>
            </div>

            {/* Sessions */}
            <div className="bg-glass border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-2">
              <div className="p-2 rounded-2xl bg-brand-soft text-brand-tint">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-lg font-black tracking-tight text-fg leading-none" data-testid="home-stats-sessions">
                {isSequential && blockProgression
                  ? `${blockProgression.sessionsCompletedInBlock}/${blockProgression.totalSessionsInBlock}`
                  : `${sessionsThisWeek}/${actualSessionCount}`}
              </div>
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">Séances</div>
            </div>
          </div>
        </section>

        {/* Season suggestion removed — planning context is the single source of truth */}

        {/* ── ACWR Widget ── */}
        <section>
          {acwr.hasSufficientData && acwr.zone ? (() => {
            const cfg = ACWR_ZONE_CONFIG[acwr.zone]
            const pct = Math.min((acwr.acwr ?? 0) / 2, 1)
            const matchPct = acwr.acuteLoad > 0 ? Math.round((acwr.acuteMatchLoad / acwr.acuteLoad) * 100) : 0
            const trainingPct = 100 - matchPct

            // Build human-readable explanation
            const explanationParts: string[] = []
            if (acwr.acuteMatchCount > 0) {
              explanationParts.push(`${acwr.acuteMatchCount} match${acwr.acuteMatchCount > 1 ? 's' : ''} (${acwr.acuteMatchLoad} pts)`)
            }
            if (acwr.acuteTrainingCount > 0) {
              explanationParts.push(`${acwr.acuteTrainingCount} séance${acwr.acuteTrainingCount > 1 ? 's' : ''} (${acwr.acuteTrainingLoad} pts)`)
            }

            // Why is the ratio high/low?
            let ratioExplanation = ''
            if (acwr.acwr != null) {
              if (acwr.acwr >= 1.5 && acwr.chronicLoad < 200) {
                ratioExplanation = 'Ta charge habituelle est basse — un pic ponctuel fait monter le ratio.'
              } else if (acwr.acwr >= 1.5 && matchPct >= 60) {
                ratioExplanation = 'Les matchs représentent la majorité de ta charge cette semaine.'
              } else if (acwr.acwr >= 1.3) {
                ratioExplanation = 'Tu t\'entraînes plus que d\'habitude ces 7 derniers jours.'
              } else if (acwr.acwr < 0.8 && acwr.acuteLoad === 0) {
                ratioExplanation = 'Aucune activité enregistrée cette semaine.'
              } else if (acwr.acwr < 0.8) {
                ratioExplanation = 'Volume plus faible que tes semaines précédentes.'
              }
            }

            // What the programme does about it
            let programAction = ''
            if (acwr.zone === 'critical') {
              programAction = 'Programme réduit à 1 séance + récupération.'
            } else if (acwr.zone === 'danger') {
              programAction = 'Dernière séance remplacée par mobilité.'
            } else if (acwr.zone === 'caution') {
              programAction = 'Volume réduit sur la dernière séance.'
            } else if (acwr.zone === 'optimal') {
              programAction = 'Programme normal — bon équilibre.'
            } else if (acwr.zone === 'underload') {
              programAction = 'Tu peux augmenter le volume progressivement.'
            }

            return (
              <div className={`bg-layer-5 border border-border-app rounded-[2rem] p-5 space-y-3 ${cfg.border}`}>
                {/* Header + badge */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-fg">Charge d'entraînement</h3>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Gauge bar */}
                <div className="relative h-2.5 bg-layer-10 rounded-full overflow-hidden">
                  <div className="absolute top-0 bottom-0 bg-ok-strip rounded-full"
                    style={{ left: '40%', width: '25%' }} />
                  <div
                    className={`absolute top-0 bottom-0 rounded-full transition-all ${
                      acwr.zone === 'optimal' ? 'bg-meter-optimal'
                      : acwr.zone === 'underload' ? 'bg-meter-underload'
                      : acwr.zone === 'caution' ? 'bg-meter-caution'
                      : 'bg-meter-danger'
                    }`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>

                {/* Explanation + programme action (always visible) */}
                {ratioExplanation && (
                  <p className="text-xs text-fg-soft leading-relaxed">{ratioExplanation}</p>
                )}
                <div className={`rounded-xl px-3 py-2 ${cfg.bg}`}>
                  <p className={`text-[11px] font-bold ${cfg.color}`}>{programAction}</p>
                </div>

                {/* Collapsible details */}
                <details className="group">
                  <summary className="flex items-center gap-1.5 cursor-pointer list-none text-[10px] font-bold text-fg-muted hover:text-fg-soft transition-colors [&::-webkit-details-marker]:hidden">
                    <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                    Comprendre ma charge
                  </summary>
                  <div className="mt-3 space-y-3 pt-3 border-t border-border-app">
                    {/* Source breakdown */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">7 derniers jours — {acwr.acuteLoad} pts</p>
                      {acwr.acuteLoad > 0 && (
                        <div className="flex h-2 rounded-full overflow-hidden">
                          {acwr.acuteMatchLoad > 0 && (
                            <div className="bg-danger-bg-cta h-full" style={{ width: `${matchPct}%` }} />
                          )}
                          {acwr.acuteTrainingLoad > 0 && (
                            <div className="bg-brand h-full" style={{ width: `${trainingPct}%` }} />
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-[10px] text-fg-muted">
                        {acwr.acuteMatchCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-danger-bg-cta inline-block" />
                            {explanationParts[0]}
                          </span>
                        )}
                        {acwr.acuteTrainingCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-brand inline-block" />
                            {explanationParts[acwr.acuteMatchCount > 0 ? 1 : 0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chronic context */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-fg-muted">Charge habituelle</span>
                      <span className="font-bold text-fg-soft">{Math.round(acwr.chronicLoad)} pts/sem</span>
                    </div>

                    {/* RPE explainer */}
                    <div className="flex gap-2 p-2.5 rounded-xl bg-layer-3">
                      <Info className="w-3.5 h-3.5 text-fg-faint flex-shrink-0 mt-0.5" />
                      <div className="text-[10px] text-fg-muted leading-relaxed">
                        <p className="font-bold text-fg-soft mb-1">Comment ça marche ?</p>
                        <p>Après chaque séance ou match, tu notes ton <span className="font-bold text-fg-soft">effort ressenti (RPE)</span> de 1 (facile) à 10 (maximal).</p>
                        <p className="mt-1">Ta charge = RPE x durée. On compare ta semaine en cours à ta moyenne des 4 dernières semaines pour détecter les pics de charge.</p>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )
          })() : (
            <div className="bg-glass border border-border-app rounded-[2rem] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-layer-10 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-fg-ghost" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-fg-emphasis">Charge d'entraînement</p>
                  <p className="text-xs text-fg-muted">
                    {acwr.weeksOfData === 0
                      ? 'Disponible après ta 1re semaine de séances.'
                      : `Sem. ${acwr.weeksOfData}/2 — encore ${2 - acwr.weeksOfData} sem. pour activer le ratio de charge.`}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wide">
                    {acwr.weeksOfData === 0 ? 'Étape 1 sur 2' : 'Étape 2 sur 2'}
                  </span>
                  <span className="text-[10px] font-bold text-brand-tint">
                    {acwr.weeksOfData === 0 ? 'Note ton RPE après chaque séance' : 'Continue — presque là !'}
                  </span>
                </div>
                <div className="h-1.5 bg-layer-10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: acwr.weeksOfData === 0 ? '15%' : '60%' }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Weekly Summary ── */}
        <section>
          {!premiumResolved ? (
            <WeeklySummarySkeleton />
          ) : isPremium ? (
            <WeeklySummaryCard result={weeklySummary} />
          ) : (
            <PremiumBlurredPreview label="Bilan de semaine">
              <WeeklySummaryCard result={weeklySummary} />
            </PremiumBlurredPreview>
          )}
        </section>

        {/* ── Premium: Injury risk alert (T2.3) ── */}
        {isPremium && !injuryDismissed && (() => {
          // Conditions: ACWR > 1.3 AND CMJ regression > 10% vs baseline AND >= 3 CMJ measures
          if (!acwr.hasSufficientData || acwr.acwr == null || acwr.acwr <= 1.3) return null

          const cmjHistory = getHistoryFor('cmj', 8)
          if (cmjHistory.length < 3) return null

          const baseline = Math.max(...cmjHistory.map(t => t.value))
          const lastCmj = cmjHistory[0]?.value
          if (!lastCmj || !baseline) return null

          const pctDrop = ((baseline - lastCmj) / baseline) * 100
          if (pctDrop <= 10) return null

          // Check dismiss
          const dismissKey = 'rugbyforge_injury_alert_dismissed'
          try {
            const raw = localStorage.getItem(dismissKey)
            if (raw) {
              const ts = parseInt(raw, 10)
              const cooldownMs = 48 * 60 * 60 * 1000
              if (!isNaN(ts) && injuryAlertNow - ts < cooldownMs && acwr.acwr <= 1.5) return null
            }
          } catch { /* ignore */ }

          return (
            <section>
              <div className="rounded-2xl border border-critical-bd bg-critical-bg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-critical" />
                    <p className="text-xs font-black text-critical uppercase tracking-wide">Risque blessure</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try { localStorage.setItem(dismissKey, String(Date.now())) } catch { /* ignore */ }
                      setInjuryDismissed(true)
                    }}
                    className="text-[10px] text-fg-faint hover:text-fg-soft"
                  >
                    Masquer 48h
                  </button>
                </div>
                <p className="text-xs text-critical-body leading-relaxed">
                  Ton ratio de charge ({acwr.acwr.toFixed(2)}) et ta fraîcheur neuromusculaire (CMJ {pctDrop.toFixed(0)}% sous ta baseline) indiquent un risque élevé. Semaine légère recommandée.
                </p>
              </div>
            </section>
          )
        })()}

        {/* Bloc "Accès Rapide" supprimé — le footer navigation couvre désormais ces liens */}

        {/* ── Recent History ── */}
        {recentLogs.length > 0 && (
          <section>
            <div className="bg-glass border border-border-app rounded-[24px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-fg">Dernières séances</h3>
                <Link
                  to="/history"
                  className="text-xs font-bold text-fg-muted flex items-center hover:text-brand-tint transition-colors"
                >
                  Tout voir <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${sessionTypeStyles[log.sessionType]}`}>
                        {sessionTypeIcon[log.sessionType]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-fg">{sessionTypeLabel[log.sessionType]}</div>
                        <div className="text-xs text-fg-muted italic">{weekLabel(log.week)} · {formatDate(log.dateISO)}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      log.fatigue === 'OK'
                        ? 'bg-ok-bg text-ok-strong'
                        : 'bg-warn-bg-muted text-warn'
                    }`}>
                      {log.fatigue === 'OK' ? 'OK' : 'Fatigue'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty state if no history */}
        {recentLogs.length === 0 && (
          <section>
            <div className="bg-glass border border-border-app rounded-[24px] p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-layer-5 rounded-2xl flex items-center justify-center text-fg-ghost">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-fg">Aucune séance enregistrée</p>
                <p className="text-xs text-fg-muted mt-0.5">Lance ta première séance pour commencer à tracker ta progression.</p>
              </div>
              <Link to="/week">
                <span className="text-xs font-black text-brand-tint uppercase tracking-wide">Commencer maintenant →</span>
              </Link>
            </div>
          </section>
        )}

        {/* ── Premium CTA for free users ── */}
        {premiumResolved && !isPremium && (
          <section className="rounded-[24px] border border-brand-border-strong bg-brand-soft p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand/10">
                <Lock className="w-5 h-5 text-brand-tint" />
              </div>
              <div>
                <p className="text-sm font-black text-fg">Passe en Premium</p>
                <p className="text-[11px] text-fg-muted">Suivi des charges, historique, courbes et coach IA illimité.</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="block w-full py-3 rounded-full bg-brand hover:bg-brand-hover text-on-brand text-sm font-bold text-center transition-colors"
            >
              Découvrir Premium
            </Link>
          </section>
        )}

      </main>

      {/* Beta feedback banner */}
      <div className="mx-auto max-w-md px-6 mb-24 mt-4">
        <a
          href="mailto:support@rugbyforge.fr?subject=Feedback%20Beta%20RugbyForge"
          onClick={() => posthog.capture('feedback_clicked', { source: 'home' })}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand/10 border border-brand/20"
        >
          <MessageSquare className="w-5 h-5 text-brand-tint shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-fg">Tu es en bêta !</p>
            <p className="text-[11px] text-fg-muted">Un bug, une idée ? Ton retour compte.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-fg-ghost shrink-0" />
        </a>
      </div>

      <BottomNav />
    </div>
  )
}
