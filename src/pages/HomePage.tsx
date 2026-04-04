import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { motion } from 'framer-motion'
import {
  LogOut,
  Play,
  Clock,
  Activity,
  Calendar,
  Zap,
  ChevronRight,
  BarChart2,
  History,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  TrendingUp,
  Trophy,
  Swords,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useProfile } from '../hooks/useProfile'
import { useFatigue } from '../hooks/useFatigue'
import { useWeek } from '../hooks/useWeek'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../hooks/useAuth'
import { useCalendar } from '../hooks/useCalendar'
import { useAdaptiveSchedule } from '../hooks/useAdaptiveSchedule'
import { useACWR, ACWR_ZONE_CONFIG } from '../hooks/useACWR'
import { useWeeklyProgramSurface } from '../hooks/useWeeklyProgramSurface'
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
import { buildExplanation } from '../services/scheduling/buildExplanation'
import { ReadinessScoreSkeleton, WeeklySummarySkeleton } from '../components/SkeletonCard'
import { getTodaySessionIndex } from '../services/ui/getTodaySessionIndex'
import { getToday } from '../services/ui/debugDateOverride'
import { formatTitleFromMotherSessionId } from '../components/motherSession/formatMotherSessionTitle'
import type { CycleWeek, SessionType, SeasonPhase, SeasonMode } from '../types/training'
import type { SequentialSession } from '../types/scheduling'
import { cycleToSeasonPhase } from '../services/season/cycleToSeasonPhase'

// ─── Helpers ────────────────────────────────────────────────

const seasonPhaseLabel: Record<SeasonPhase, { label: string; color: string; bg: string }> = {
  'off-season': { label: 'Hors-saison', color: 'text-badge-muted-fg', bg: 'bg-badge-muted-bg' },
  'pre-season': { label: 'Pré-saison', color: 'text-warn-strong', bg: 'bg-warn-bg' },
  'in-season': { label: 'En saison', color: 'text-ok', bg: 'bg-ok-bg-muted' },
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
  UPPER: <Dumbbell className="w-3 h-3 text-fg fill-current" />,
  LOWER: <Activity className="w-3 h-3 text-fg" />,
  FULL: <Zap className="w-3 h-3 text-fg fill-current" />,
  CONDITIONING: <Activity className="w-3 h-3 text-fg" />,
  RECOVERY: <Activity className="w-3 h-3 text-fg" />,
  ACTIVE_RECOVERY: <Activity className="w-3 h-3 text-fg" />,
}

const weekLabel = (w: CycleWeek) => (w === 'DELOAD' ? 'Décharge' : w.startsWith('H') ? `Hypert. ${w.replace('H', '')}` : `Semaine ${w.replace('W', '')}`)

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

// Mapping SeasonPhase (calendrier) → SeasonMode (profil)
const CALENDAR_TO_SEASON_MODE: Record<SeasonPhase, SeasonMode> = {
  'in-season':  'in_season',
  'playoffs':   'in_season',
  'pre-season': 'pre_season',
  'off-season': 'off_season',
}

const SEASON_MODE_LABEL: Record<SeasonMode, string> = {
  in_season:  '⚡ Saison',
  off_season: '🌿 Inter-saison',
  pre_season: '🔥 Pré-saison',
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
  const { authState, signOut } = useAuth()
  const { fatigue } = useFatigue()
  const { week } = useWeek()
  const { logs } = useHistory()
  const { events, nextMatch, isMatchDay } = useCalendar()
  const adaptiveSchedule = useAdaptiveSchedule(profile, events)
  const acwr = useACWR(logs, events)
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
    nextMatchDate: nextMatch?.date ?? null,
    today,
  })

  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const surfaceParams = useMemo(() => ({
    profile,
    events,
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
  }), [profile, events, logs, today, fatigue, acwr.hasSufficientData, acwr.zone, week, programFeatureFlags, readinessResult.score, userId])
  const { surface, blockProgression, weekPresentation } = useWeeklyProgramSurface(surfaceParams)

  // Season phase derived from the single source of truth (planning context)
  const seasonPhase = cycleToSeasonPhase(surface?.planningContext?.cycle)

  const msSessions = useMemo(
    () => surface?.motherSession?.sessions ?? [],
    [surface],
  )
  const todaySessionIndex = useMemo(
    () => getTodaySessionIndex(msSessions, adaptiveSchedule, profile.clubSchedule),
    [msSessions, adaptiveSchedule, profile.clubSchedule],
  )
  const todaySession = todaySessionIndex != null ? msSessions[todaySessionIndex] : null
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'

  // ── Premium features: weekly summary ──────────────────────────────────────
  const weeklySummary = useWeeklySummary({
    logs,
    blockLogs,
    plannedSessionCount: msSessions.length,
    today,
  })
  const { transition: seasonTransition, dismiss: dismissSeasonTransition } = useSeasonTransitions({
    planningContext: surface?.planningContext ?? null,
    today,
  })
  const { transition: schedulingTransition, dismiss: dismissSchedulingTransition } = useSchedulingTransition({
    schedulingMode: surface?.schedulingMode ?? null,
    logs,
    today,
    userId,
  })

  // Derive summaryLine from buildExplanation (compact, no disclosure on HomePage)
  const summaryLine = useMemo(() => {
    if (!surface || !weekPresentation) return null
    const explanation = buildExplanation({
      planningContext: surface.planningContext,
      schedulingMode: surface.schedulingMode,
      presentation: weekPresentation,
      corrections: [],
    })
    return explanation.summaryLine
  }, [surface, weekPresentation])

  const todaySessionTitle = todaySession
    ? formatTitleFromMotherSessionId(todaySession.session.metadata.id, lang)
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

  const visibleTrainingLevel = getVisibleTrainingLevel(profile.trainingLevel)
  const sessionDuration = LEVEL_DURATION[profile.trainingLevel ?? 'builder']
  const trainingLevelLabel = TRAINING_LEVEL_LABEL[visibleTrainingLevel]

  // Auto-suggestion: if calendar phase differs from profile.seasonMode (Performance only)
  const currentSeasonMode = profile.seasonMode ?? 'in_season'
  const suggestedSeasonMode = seasonPhase ? CALENDAR_TO_SEASON_MODE[seasonPhase] : null
  const showSeasonSuggestion =
    visibleTrainingLevel === 'performance' &&
    suggestedSeasonMode !== null &&
    suggestedSeasonMode !== currentSeasonMode

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* ── Header ── */}
      <PageHeader
        title={lang === 'fr' ? 'Accueil' : 'Home'}
        right={
        authState.status === 'authenticated' && authState.user ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={signOut}
              className="w-9 h-9 rounded-2xl border border-border-app bg-glass flex items-center justify-center text-fg-muted hover:text-brand hover:border-brand-border transition-colors"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth/login"
            className="px-3 py-2 rounded-2xl border border-border-app bg-glass text-xs font-bold text-fg-muted hover:border-brand-border hover:text-brand transition-colors"
          >
            Se connecter
          </Link>
        )}
      />

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto relative">

        {/* ── Hero Session Card ── */}
        <section data-testid="home-hero-card">
          <div className="bg-glass border border-border-app rounded-[24px] p-5 space-y-4">
            {/* Header: badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSequential && blockProgression?.currentBlockLabel ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-medium text-brand">
                    {blockProgression.currentBlockLabel}
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-medium text-brand">
                    {weekLabel(week)}
                  </span>
                )}
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-layer-10 text-fg-soft">
                  {trainingLevelLabel}
                </span>
              </div>
              <span className="text-[10px] font-bold text-fg-faint flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {SEASON_MODE_LABEL[currentSeasonMode]}
              </span>
            </div>

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
                    {profile.weeklySessions}x/sem.
                  </span>
                )}
              </div>
              {summaryLine && (
                <p className="text-[11px] text-fg-muted mt-1.5" data-testid="home-summary-line">
                  {summaryLine}
                </p>
              )}
            </div>

            {/* CTA */}
            <Link
              to={isSequential
                ? (nextSequentialSession ? `/session/0` : '/week')
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
                    ? (nextSequentialSession ? 'Commencer la séance' : 'Voir mon programme')
                    : (todaySession ? 'Commencer la séance' : 'Voir ma semaine')}
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
          <SeasonTransitionBanner
            transition={seasonTransition}
            onAction={() => {
              if (seasonTransition.type === 'season_ended') {
                const cleanAnchors = { ...profile.planningAnchors }
                delete cleanAnchors.manualPlayoffs
                updateProfile({
                  seasonMode: 'off_season',
                  planningAnchors: {
                    ...cleanAnchors,
                    seasonEndedAt: seasonTransition.lastMatchDate,
                  },
                })
              } else if (seasonTransition.type === 'playoffs_suggested') {
                updateProfile({
                  planningAnchors: {
                    ...profile.planningAnchors,
                    manualPlayoffs: true,
                  },
                })
              }
              dismissSeasonTransition(seasonTransition.type)
            }}
            onDismiss={() => dismissSeasonTransition(seasonTransition.type)}
          />
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
              <div className="p-2 rounded-2xl bg-layer-10 text-success-app">
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
              <div className="p-2 rounded-2xl bg-brand-soft text-brand">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-lg font-black tracking-tight text-fg leading-none" data-testid="home-stats-sessions">
                {isSequential && blockProgression
                  ? `${blockProgression.sessionsCompletedInBlock}/${blockProgression.totalSessionsInBlock}`
                  : `${sessionsThisWeek}/${profile.weeklySessions}`}
              </div>
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">Séances</div>
            </div>
          </div>
        </section>

        {/* ── Auto-suggestion mode saison (Performance only, quand calendrier diverge) ── */}
        {showSeasonSuggestion && suggestedSeasonMode && (
          <section>
            <div className="flex items-center gap-3 p-4 bg-warn-bg border border-warn-bd rounded-[2rem]">
              <div className="p-2 rounded-2xl bg-warn-bg-strong text-warn-strong flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-warn">Programme adapté à ta saison</p>
                <p className="text-[10px] text-warn-strong mt-0.5">
                  Ton calendrier suggère : {SEASON_MODE_LABEL[suggestedSeasonMode]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateProfile({ seasonMode: suggestedSeasonMode })}
                className="flex-shrink-0 px-3 py-2 rounded-2xl bg-warn-button text-on-brand text-[10px] font-black uppercase tracking-wide hover:bg-warn-button-hover transition-colors"
              >
                Appliquer
              </button>
            </div>
          </section>
        )}

        {/* ── ACWR Widget ── */}
        <section>
          {acwr.hasSufficientData && acwr.zone ? (() => {
            const cfg = ACWR_ZONE_CONFIG[acwr.zone]
            const pct = Math.min((acwr.acwr ?? 0) / 2, 1) // 0→2 mapped to 0→100%
            return (
              <div className={`bg-layer-5 border border-border-app rounded-[2rem] p-5 space-y-3 ${cfg.border}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-fg">Charge d'entraînement</h3>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Bar */}
                <div className="relative h-2.5 bg-layer-10 rounded-full overflow-hidden">
                  {/* Optimal zone highlight */}
                  <div className="absolute top-0 bottom-0 bg-ok-strip rounded-full"
                    style={{ left: '40%', width: '25%' }} />
                  {/* ACWR indicator */}
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

                <div className="flex items-end justify-between">
                  <div>
                    <div className={`text-2xl font-black ${cfg.color}`}>
                      {acwr.acwr?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-fg-muted">ACWR cette semaine</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-fg-emphasis">{acwr.acuteLoad} UA</div>
                    <div className="text-[10px] text-fg-muted">charge aiguë</div>
                  </div>
                </div>

                <p className={`text-xs font-medium ${cfg.color}`}>{cfg.message}</p>
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
                      : `Sem. ${acwr.weeksOfData}/2 — encore ${2 - acwr.weeksOfData} sem. pour activer l'ACWR.`}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wide">
                    {acwr.weeksOfData === 0 ? 'Étape 1 sur 2' : 'Étape 2 sur 2'}
                  </span>
                  <span className="text-[10px] font-bold text-brand">
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

        {/* ── Premium: Qualitative charge label (T2.2) ── */}
        {isPremium && acwr.hasSufficientData && acwr.acwr != null && (() => {
          const val = acwr.acwr
          const label = val > 1.5 ? 'Danger — deload fortement recommandé'
            : val > 1.3 ? 'Charge élevée — envisage un allègement'
            : val > 1.1 ? 'Semaine chargée — reste attentif'
            : val >= 0.8 ? 'Charge maîtrisée — continue'
            : 'Semaine légère — tu peux pousser'
          const color = val > 1.5 ? 'text-critical bg-critical-bg border border-critical-bd'
            : val > 1.3 ? 'text-tone-orange bg-tone-orange-bg border border-tone-orange-bd'
            : val > 1.1 ? 'text-warn bg-warn-bg border border-warn-bd'
            : val >= 0.8 ? 'text-ok bg-ok-bg-muted border border-ok-bd'
            : 'text-info bg-info-bg border border-info-bd'
          return (
            <section>
              <div className={`rounded-2xl border px-4 py-3 ${color}`}>
                <p className="text-xs font-bold">{label}</p>
              </div>
            </section>
          )
        })()}

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
        {isPremium && (() => {
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
                    }}
                    className="text-[10px] text-fg-faint hover:text-fg-soft"
                  >
                    Masquer 48h
                  </button>
                </div>
                <p className="text-xs text-critical-body leading-relaxed">
                  Ton ratio de charge (ACWR {acwr.acwr.toFixed(2)}) et ta fraîcheur neuromusculaire (CMJ {pctDrop.toFixed(0)}% sous ta baseline) indiquent un risque élevé. Deload recommandé cette semaine.
                </p>
              </div>
            </section>
          )
        })()}

        {/* ── Season + Next Match ── */}
        <section>
          <div className="bg-glass border border-border-app rounded-[2rem] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-fg">Saison</h3>
              {(() => {
                const cfg = seasonPhaseLabel[seasonPhase]
                return (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    {cfg.label}
                  </span>
                )
              })()}
            </div>

            {isMatchDay && (
              <div className="flex items-center gap-2 py-2 px-3 bg-danger-bg rounded-2xl">
                <Trophy className="w-4 h-4 text-brand fill-current" />
                <span className="text-xs font-black text-danger uppercase tracking-wide">Jour de match !</span>
              </div>
            )}

            {nextMatch && !isMatchDay && (
              <Link to="/calendar">
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-2xl bg-danger-bg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-brand" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-fg">
                      Prochain match — J−{diffDays(nextMatch.date)}
                    </div>
                    {nextMatch.opponent && (
                      <div className="text-[10px] text-fg-muted flex items-center gap-1">
                        <Swords className="w-2.5 h-2.5" />
                        vs {nextMatch.opponent}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-fg-faint group-hover:text-brand transition-colors" />
                </div>
              </Link>
            )}

            {!nextMatch && (
              <Link to="/calendar">
                <div className="flex items-center gap-3 text-fg-muted hover:text-brand transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold">Ajoute tes matchs →</span>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ── Quick Access ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">Accès Rapide</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/week', icon: Dumbbell, label: 'Programme', color: 'text-brand', bg: 'bg-brand-soft' },
              { to: '/calendar', icon: Calendar, label: 'Calendrier', color: 'text-info', bg: 'bg-info-bg' },
              { to: '/progress', icon: BarChart2, label: 'Progression', color: 'text-warn-strong', bg: 'bg-warn-bg' },
            ].map(({ to, icon: Icon, label, color, bg }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-glass border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div className={`p-2.5 rounded-2xl ${bg} ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-fg text-center leading-tight">{label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent History ── */}
        {recentLogs.length > 0 && (
          <section>
            <div className="bg-glass border border-border-app rounded-[24px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-fg">Dernières séances</h3>
                <Link
                  to="/history"
                  className="text-xs font-bold text-fg-muted flex items-center hover:text-brand transition-colors"
                >
                  Tout voir <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-layer-10 rounded-2xl flex items-center justify-center text-fg-muted group-hover:bg-brand-soft group-hover:text-brand transition-colors">
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
                <span className="text-xs font-black text-brand uppercase tracking-wide">Commencer maintenant →</span>
              </Link>
            </div>
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  )
}
