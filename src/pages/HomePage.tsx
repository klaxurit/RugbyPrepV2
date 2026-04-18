import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { posthog } from '../services/analytics/posthog'
import { motion } from 'framer-motion'
import {
  Play,
  Activity,
  Zap,
  ChevronRight,
  History,
  AlertTriangle,
  Dumbbell,
  Trophy,
  MessageSquare,
  Lock,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Chip, type ChipTone } from '../components/ui'
import { useProfile } from '../hooks/useProfile'
import { useFatigue } from '../hooks/useFatigue'
import { useWeek } from '../hooks/useWeek'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../hooks/useAuth'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR } from '../hooks/useACWR'
import { useWeekSnapshot } from '../hooks/useWeekSnapshot'
import { useProgramFeatureFlags } from '../hooks/useProgramFeatureFlags'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { useAthleteTests } from '../hooks/useAthleteTests'
import { useReadinessScore } from '../hooks/useReadinessScore'
import { ScoreDeFormeTeaser } from '../components/ScoreDeFormeTeaser'
import { ScoreDeFormeCard } from '../components/ScoreDeFormeCard'
import { SeasonTransitionBanner, SchedulingTransitionBanner } from '../components/SeasonTransitionBanner'
import { useSeasonTransitions } from '../hooks/useSeasonTransitions'
import { useSchedulingTransition } from '../hooks/useSchedulingTransition'
import { getToday } from '../services/ui/debugDateOverride'
import { formatTitleFromMotherSessionId } from '../components/motherSession/formatMotherSessionTitle'
import type { CycleWeek, SessionType, SeasonPhase, TransitionEntry } from '../types/training'
import { appendTransitionEntry, computeDeferralExpiry } from '../services/season/transitionJournal'
import { mergeDatedSessionCompletion } from '../services/scheduling/mergeDatedSessionCompletion'
import { cycleToSeasonPhase } from '../services/season/cycleToSeasonPhase'

// ─── Helpers ────────────────────────────────────────────────

const seasonPhaseLabel: Record<SeasonPhase, { label: string; tone: ChipTone }> = {
  'off-season': { label: 'Inter-saison', tone: 'neutral' },
  'pre-season': { label: 'Pré-saison', tone: 'warn' },
  'in-season': { label: 'En saison', tone: 'brand' },
  'playoffs': { label: 'Playoffs', tone: 'alert' },
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
  let nextDatedSession: import('../types/scheduling').DatedSession | null = null
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
    // Prochaine séance programmée (jour > today, non passée) — sert uniquement quand il n'y a rien aujourd'hui.
    if (!todayDatedSession) {
      nextDatedSession =
        allDated.find(
          (s) =>
            s.dayOfWeek > todayDow &&
            s.completionStatus !== 'skipped' &&
            s.completionStatus !== 'completed',
        ) ?? null
    }
  }

  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'

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

  // ── Rest day context ────────────────────────────────────────────────────
  // État visé par la refonte du doc design-home-page-restday.md : hero
  // affirmatif ("Repos avant le match") + nouvelle section "Cette semaine",
  // stats 3-up + ACWR masqués en rest day.
  const isRestDay = !todaySessionTitle
  const todayDow = new Date(today + 'T12:00:00').getDay()
  const daysToMatch = nextMatch ? diffDays(nextMatch.date) : null
  // Dernier match passé (pour le cas post-match J+1).
  const lastPastMatch = useMemo(() => {
    const past = structuralEvents
      .filter((e) => e.type === 'match' && e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))
    return past[0] ?? null
  }, [structuralEvents, today])
  const daysSinceLastMatch = lastPastMatch ? Math.abs(diffDays(lastPastMatch.date)) : null

  const restDayContext: 'match_tomorrow' | 'post_match' | 'match_today' | 'none' =
    isMatchDay
      ? 'match_today'
      : daysToMatch != null && daysToMatch === 1
        ? 'match_tomorrow'
        : daysSinceLastMatch != null && daysSinceLastMatch <= 1
          ? 'post_match'
          : 'none'

  const restDayCopy = (() => {
    switch (restDayContext) {
      case 'match_tomorrow':
        return {
          eyebrow: 'REPOS AUJOURD\'HUI',
          title: 'Repos avant le match.',
          body: '20 min marche ou 10 min mobilité.',
        }
      case 'post_match':
        return {
          eyebrow: 'REPOS AUJOURD\'HUI',
          title: 'Récup post-match.',
          body: 'Hydrate-toi, protéines, marche légère.',
        }
      case 'match_today':
        return {
          eyebrow: 'JOUR DE MATCH',
          title: "C'est aujourd'hui !",
          body: 'Mobilité, activation courte, hydratation.',
        }
      default:
        return {
          eyebrow: 'REPOS AUJOURD\'HUI',
          title: 'Repos programmé.',
          body: '20 min marche, mobilité ou sauna.',
        }
    }
  })()

  // Ligne meta (date + saison + S1 + niveau) au-dessus du hero en rest day.
  const metaLine = (() => {
    const todayDate = new Date(today + 'T12:00:00')
    const dateLabel = todayDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    const seasonLabel = seasonPhaseLabel[seasonPhase]?.label ?? ''
    const cycleLabel = blockProgression?.currentBlockLabel ?? weekLabel(week)
    const levelLabel = trainingLevelLabel
    return [dateLabel, seasonLabel, cycleLabel, levelLabel].filter(Boolean).join(' · ')
  })()

  // Planned sessions pour la semaine (liste verticale section "Cette semaine").
  // Note : on ne veut que les DatedSession non-completed, non-skipped futures ou du jour.
  const upcomingWeekSessions = useMemo(() => {
    if (!weekPresentation || weekPresentation.mode !== 'calendar') return []
    const allDatedRaw = weekPresentation.sessions.filter(
      (s): s is import('../types/scheduling').DatedSession => s.kind === 'dated',
    )
    const allDated = mergeDatedSessionCompletion(allDatedRaw, logs, today)
    // Trier par dayOfWeek, Lun=1 → Dim=0 (mais on reste semaine ISO Lun→Dim)
    const ordered = [...allDated].sort((a, b) => {
      const aOrder = a.dayOfWeek === 0 ? 7 : a.dayOfWeek
      const bOrder = b.dayOfWeek === 0 ? 7 : b.dayOfWeek
      return aOrder - bOrder
    })
    return ordered
  }, [weekPresentation, logs, today])

  // Count "faites" depuis la même source que /week (completionStatus via merge),
  // pas depuis logs.filter(l.week === week) qui peut diverger quand la semaine
  // cycle change ou si le log n'a pas la même clé de semaine.
  const sessionsThisWeek = upcomingWeekSessions.filter((s) => s.completionStatus === 'completed').length


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

        {/* ── Meta-ligne commune (date · saison · semaine · niveau) ─────────── */}
        <section data-testid="home-hero-card">
          <p className="text-xs text-fg-soft mb-3 text-center">{metaLine}</p>

          {/* ── Bandeau match conditionnel ──
              Affiché seulement si un match est programmé dans les 7 prochains
              jours. En inter-saison sans match, rien n'est rendu. */}
          {nextMatch != null && daysToMatch != null && daysToMatch >= 0 && daysToMatch <= 7 && (
            <Link to="/calendar" className="block mb-3" data-testid="home-match-banner">
              <div className="flex items-center gap-3 py-3 px-4 bg-warn-bg border border-warn-bd rounded-2xl group min-h-[56px]">
                <Trophy className="w-5 h-5 text-warn-strong fill-current flex-shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-warn-strong leading-tight">
                    {isMatchDay
                      ? "C'est aujourd'hui !"
                      : `J-${daysToMatch} · ${nextMatch.opponent ? `vs ${nextMatch.opponent}` : 'Prochain match'}`}
                  </p>
                  {!isMatchDay && nextMatch.kickoff_time && (
                    <p className="text-[11px] text-warn-body mt-0.5">
                      {nextMatch.is_home === false ? 'Extérieur · ' : 'Domicile · '}
                      {nextMatch.kickoff_time}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-warn-body group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </div>
            </Link>
          )}

          {/* ── Hero — variante selon état rest day / training day ─────────── */}
          {isRestDay ? (
            // Rest day : eyebrow + H1 affirmatif + prescription récup + CTA secondary.
            <div className="bg-glass border border-border-app rounded-[24px] p-5">
              <p className="text-[11px] font-bold text-fg-muted uppercase tracking-wider" data-testid="home-hero-label">
                {restDayCopy.eyebrow}
              </p>
              <h3 className="text-2xl font-black text-fg leading-tight mt-1">
                {restDayCopy.title}
              </h3>
              <p className="text-sm text-fg-soft mt-3 leading-relaxed whitespace-nowrap truncate">
                {restDayCopy.body}
              </p>
              {nextDatedSession && (
                <p className="text-xs text-fg-muted mt-3">
                  Prochaine séance : <span className="font-bold text-fg">{nextDatedSession.dayLabel}</span>
                  {' · '}
                  {formatTitleFromMotherSessionId(nextDatedSession.sessionSlot.session.metadata.id, lang)}
                </p>
              )}
              <Link
                to="/week"
                data-testid="home-cta-primary"
                className="block mt-5"
              >
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-2xl border-2 border-brand text-brand-tint hover:bg-brand-soft transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-sm font-black tracking-wide">Voir le plan de la semaine</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          ) : (
            // Training day : eyebrow SÉANCE DU JOUR + H1 séance + CTA primary + lien skip.
            <div className="bg-glass border border-border-app rounded-[24px] p-5">
              <p className="text-[11px] font-bold text-fg-muted uppercase tracking-wider" data-testid="home-hero-label">
                Séance du jour
              </p>
              {/* H1 — séparateur interne `·` remplacé par ` — ` pour éviter la
                  collision avec le `·` des meta-lignes. */}
              <h3 className="text-2xl font-black text-fg leading-tight mt-1">
                {todaySessionTitle!.replace(/\s·\s/g, ' — ')}
              </h3>
              <p className="text-sm text-fg-soft mt-2 leading-relaxed">
                {sessionDuration} · {actualSessionCount} séance{actualSessionCount > 1 ? 's' : ''} cette semaine
              </p>
              <Link
                to={todaySessionIndex != null ? `/session/${todaySessionIndex}` : '/week'}
                data-testid="home-cta-primary"
                className="block mt-5"
              >
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 bg-brand hover:bg-brand-hover transition-colors"
                >
                  <Play className="w-4 h-4 text-on-brand fill-current" />
                  <span className="font-black text-on-brand text-sm tracking-wide">
                    Commencer la séance
                  </span>
                </motion.button>
              </Link>
              {/* Action secondaire — skip le lancement, ouvrir la session pour cocher manuellement. */}
              {todaySessionIndex != null && (
                <Link
                  to={`/session/${todaySessionIndex}`}
                  className="block mt-3 text-center text-sm font-bold text-fg-soft hover:text-brand-tint transition-colors"
                >
                  Marquer comme faite (sans la lancer)
                </Link>
              )}
            </div>
          )}
        </section>

        {/* ── Score de forme (free → teaser flouté · premium → vraie card compact) ─ */}
        {premiumResolved && !isPremium && (
          <ScoreDeFormeTeaser />
        )}
        {premiumResolved && isPremium && (
          <ScoreDeFormeCard current={readinessResult} />
        )}

        {/* ── Cette semaine (training + rest day) ────────────────────────────── */}
        {upcomingWeekSessions.length > 0 && (
          <section data-testid="home-this-week">
            <div className="bg-glass border border-border-app rounded-[24px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-wider text-fg-muted">
                  Cette semaine
                </h2>
                <span className="text-[11px] font-bold text-fg-muted tabular-nums">
                  {sessionsThisWeek}/{actualSessionCount} faites
                </span>
              </div>
              <ul className="divide-y divide-border-app">
                {upcomingWeekSessions.map((s, idx) => {
                  // Calcule la date réelle du jour de la semaine planifié, pour
                  // afficher "LUN 20" plutôt que "LUN" seul.
                  const todayDate = new Date(today + 'T12:00:00')
                  const deltaDays = ((s.dayOfWeek + 7 - todayDow) % 7)
                  const sessionDate = new Date(todayDate)
                  sessionDate.setDate(todayDate.getDate() + deltaDays)
                  const dowShort = s.dayLabel.slice(0, 3).toUpperCase()
                  const dateNumber = sessionDate.getDate()
                  // Titre séance — on remplace le " · " interne par " — " pour éviter la
                  // collision avec le séparateur de meta-ligne.
                  const rawTitle = formatTitleFromMotherSessionId(s.sessionSlot.session.metadata.id, lang)
                  const title = rawTitle.replace(/\s·\s/g, ' — ')
                  const isDone = s.completionStatus === 'completed'
                  const isSkipped = s.completionStatus === 'skipped'
                  const isTodayRow = s.dayOfWeek === todayDow
                  // Highlight visuel de la séance du jour : point bordeaux + fond doux +
                  // label en brand-tint. Sinon rendu neutre (gris muted).
                  return (
                    <li key={idx}>
                      <Link
                        to={`/session/${idx}`}
                        className={`flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-xl transition-colors ${
                          (isDone || isSkipped)
                            ? 'opacity-50 hover:bg-layer-5'
                            : isTodayRow
                              ? 'bg-brand-soft/50 hover:bg-brand-soft'
                              : 'hover:bg-layer-5'
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isTodayRow ? 'bg-brand' : 'bg-transparent'}`}
                        />
                        <span className={`flex-shrink-0 w-14 text-xs font-black uppercase tabular-nums ${isTodayRow ? 'text-brand-tint' : 'text-fg-muted'}`}>
                          {dowShort} {dateNumber}
                        </span>
                        <span className={`flex-1 min-w-0 truncate text-sm font-bold ${isTodayRow ? 'text-brand-tint' : 'text-fg'}`}>
                          {title}
                        </span>
                        <span className="flex-shrink-0 text-[11px] text-fg-muted tabular-nums">
                          {sessionDuration}
                        </span>
                        <ChevronRight className="w-4 h-4 text-fg-faint flex-shrink-0" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
              {/* Forme est désormais dans le teaser dédié (au-dessus). Seule Fatigue reste ici. */}
              <div className="flex items-center gap-2 pt-2 border-t border-border-app text-[11px]">
                <span className="text-fg-muted">Fatigue :</span>
                <span className={`font-bold ${fatigue === 'OK' ? 'text-ok-strong' : 'text-warn-strong'}`}>
                  {fatigue === 'OK' ? 'OK' : 'Élevée'}
                </span>
              </div>
              {/* Lien bilan complet — remplace la pill flottante "Bilan de semaine".
                  Verrouillé pour les users free, actif pour les Premium. */}
              <Link
                to={isPremium ? '/progress' : '/profile#premium'}
                className="flex items-center justify-between gap-2 pt-3 border-t border-border-app text-xs font-bold text-fg hover:text-brand-tint transition-colors rf-focus-ring rounded-lg"
              >
                <span className="inline-flex items-center gap-1.5">
                  {!isPremium && <Lock className="w-3 h-3 text-brand-tint" aria-hidden />}
                  Voir le bilan complet de la semaine
                </span>
                <ChevronRight className="w-4 h-4 text-fg-faint" />
              </Link>
            </div>
          </section>
        )}

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

        {/* Readiness Score full gauge : retiré de la home — remplacé par
            le ScoreDeFormeTeaser (free) ou une future card Premium (TODO). */}

        {/* Stats row 3-up (Week / Fatigue / Séances) : retiré — info fondue
            dans la meta-ligne (cycle) + section "Cette semaine" (séances +
            fatigue). */}

        {/* Season suggestion removed — planning context is the single source of truth */}

        {/* ACWR widget (Charge d'entraînement) : retiré de la home v1.
            Les données de charge détaillées vivent dans /progress. La home
            expose uniquement fatigue + teaser score + lien bilan. */}

        {/* Weekly Summary (ex pill "Bilan de semaine") : retiré de la home.
            Remplacé par un lien "Voir le bilan complet de la semaine ›" en
            pied de la card Cette semaine. */}

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
                    <Chip tone={log.fatigue === 'OK' ? 'success' : 'warn'}>
                      {log.fatigue === 'OK' ? 'OK' : 'Fatigue'}
                    </Chip>
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

        {/* ── Premium CTA for free users — bandeau texte léger (pattern Option A du doc).
            Visible mais non-commercial : pas de gros bouton bordeaux plein qui duplique
            le pattern CTA du hero. ── */}
        {premiumResolved && !isPremium && (
          <Link
            to="/profile#premium"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-brand-border bg-brand-soft/50 hover:bg-brand-soft transition-colors"
          >
            <Lock className="w-4 h-4 text-brand-tint flex-shrink-0" aria-hidden />
            <p className="flex-1 min-w-0 text-xs font-bold text-fg leading-tight">
              <span className="block truncate">Tout RugbyForge en illimité</span>
              <span className="block text-[11px] font-normal text-fg-muted mt-0.5 truncate">
                Analytics · historique · coach IA
              </span>
            </p>
            <ChevronRight className="w-4 h-4 text-brand-tint flex-shrink-0" />
          </Link>
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
