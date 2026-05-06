import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { posthog } from '../services/analytics/posthog'
import { AlertTriangle } from 'lucide-react'
import { Icon } from '../components/ui'
import {
  HeroDayAfter,
  HeroNormal,
  StreakCard,
  NextMatchEditorialCard,
  BadgesStrip,
  PlayoffsThinBanner,
  fatigueToMood,
  moodToFatigue,
  type HeroMood,
} from '../components/home'
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
import type { SeasonPhase, TransitionEntry } from '../types/training'
import { appendTransitionEntry, computeDeferralExpiry } from '../services/season/transitionJournal'
import { mergeDatedSessionCompletion } from '../services/scheduling/mergeDatedSessionCompletion'
import { userScopedKey } from '../services/storage/userScopedStorage'
import { cycleToSeasonPhase } from '../services/season/cycleToSeasonPhase'
import { useRegisterCoachContext } from '../contexts/CoachContext'
import { MatchEditDrawer } from '../components/match/MatchEditDrawer'
import { computeStreak } from '../services/home/computeStreak'
import { computeMilestones } from '../services/home/computeMilestones'
import { selectCoachInsight } from '../services/home/coachInsights'
import { resolveFatigueLevel } from '../services/program/resolveFatigueLevel'
import { computePillars } from '../services/home/computePillars'
import { computeScoreHistory7d } from '../services/home/computeScoreHistory7d'
import { detectHomeState, type HomeHeroState } from '../services/home/detectHomeState'
import { getRugbySeasonWeek } from '../services/home/rugbySeasonWeek'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const seasonPhaseLabel: Record<SeasonPhase, string> = {
  'off-season': 'Inter-saison',
  'pre-season': 'Pré-saison',
  'in-season': 'En saison',
  'playoffs': 'Playoffs',
}

const TRAINING_LEVEL_LABEL: Record<string, string> = {
  starter: 'Fondations',
  builder: 'Avancé',
  performance: 'Avancé',
}


function diffDaysFromTodayISO(target: string, todayISO: string): number {
  const t = new Date(`${todayISO}T12:00:00`).getTime()
  const d = new Date(`${target}T12:00:00`).getTime()
  return Math.round((d - t) / 86_400_000)
}

interface NormalHeroCopy {
  eyebrow: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  cta: { label: string; to: string; icon?: import('../components/ui').IconName }
  /** Mood inline : exposé uniquement sur les états repos (rest_day, match_tomorrow). */
  showMood: boolean
}

/**
 * Copy du HeroNormal selon l'état détecté. Le post_match (< 48h après match)
 * est traité ailleurs avec HeroDayAfter (carte bordeaux pleine).
 */
function buildNormalHero(
  state: Exclude<HomeHeroState, 'post_match'>,
  todaySessionTitle: string | null,
  todaySessionIndex: number | null,
  nextSessionLabel: string | null,
): NormalHeroCopy {
  switch (state) {
    case 'match_today':
      return {
        eyebrow: "Aujourd'hui · Match",
        title: (
          <>
            C&apos;est aujourd&apos;hui.
            <br />
            <span className="opacity-55">Donne tout.</span>
          </>
        ),
        subtitle: <>Mobilité légère, activation courte, hydratation.</>,
        cta: { label: 'Voir le match', to: '/week', icon: 'calendar' },
        showMood: false,
      }
    case 'match_tomorrow':
      return {
        eyebrow: "Aujourd'hui · Repos avant match",
        title: (
          <>
            On range les outils.
            <br />
            <span className="opacity-55">Demain, c&apos;est terrain.</span>
          </>
        ),
        subtitle: <>20 min marche ou 10 min mobilité.</>,
        cta: { label: 'Voir le plan de la semaine', to: '/week', icon: 'calendar' },
        showMood: true,
      }
    case 'training_day':
      return {
        eyebrow: "Aujourd'hui · Séance",
        title: todaySessionTitle ? (
          <>{todaySessionTitle.replace(/\s·\s/g, ' — ')}</>
        ) : (
          <>Séance du jour</>
        ),
        cta: {
          label: 'Démarrer la séance',
          to: todaySessionIndex != null ? `/session/${todaySessionIndex}` : '/week',
          icon: 'play',
        },
        showMood: false,
      }
    case 'rest_day':
    default:
      return {
        eyebrow: "Aujourd'hui · Repos",
        title: (
          <>
            Repos
            <br />
            <span className="opacity-55">programmé.</span>
          </>
        ),
        subtitle: nextSessionLabel ? (
          <>
            L&apos;autre moitié du travail.
            <br />
            Prochaine séance :{' '}
            <span className="font-extrabold text-fg">{nextSessionLabel}</span>
          </>
        ) : (
          <>L&apos;autre moitié du travail. Sommeil · hydratation · mobilité légère.</>
        ),
        cta: { label: 'Voir le plan de la semaine', to: '/week', icon: 'calendar' },
        showMood: true,
      }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function HomePage() {
  const { profile, updateProfile } = useProfile()
  const { authState } = useAuth()
  const { fatigue, setFatigue } = useFatigue()
  const { week } = useWeek()
  const { logs } = useHistory()
  const {
    structuralEvents,
    visibleEvents,
    nextMatch,
    nextStructuralMatch,
    isMatchDay,
    hideImportedEvent,
  } = useCalendar()

  const acwr = useACWR(logs, structuralEvents)
  const { isPremium, loading: entitlementsLoading } = useFeatureAccess()
  const premiumResolved = !entitlementsLoading
  const { getHistoryFor } = useAthleteTests()
  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()

  const today = useMemo(() => getToday(), [])

  const readinessResult = useReadinessScore({
    acwrZone: acwr.hasSufficientData ? acwr.zone : null,
    fatigue,
    logs,
    nextMatchDate: nextStructuralMatch?.date ?? null,
    today,
  })

  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const surfaceParams = useMemo(
    () => ({
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
    }),
    [
      profile,
      structuralEvents,
      logs,
      today,
      fatigue,
      acwr.hasSufficientData,
      acwr.zone,
      week,
      programFeatureFlags,
      readinessResult.score,
      userId,
    ],
  )
  const { surface, snapshot } = useWeekSnapshot(surfaceParams)
  const seasonPhase = cycleToSeasonPhase(surface?.planningContext?.cycle)
  const weekPresentation = snapshot?.presentation ?? null

  // ── Today's session detection (calendar mode) ──
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
  const { transition: schedulingTransition, dismiss: dismissSchedulingTransition } =
    useSchedulingTransition({
      schedulingMode: surface?.schedulingMode ?? null,
      logs,
      today,
      userId,
    })

  const todaySessionTitle = todayDatedSession
    ? formatTitleFromMotherSessionId(todayDatedSession.sessionSlot.session.metadata.id, lang)
    : null
  const nextSessionLabel = nextDatedSession
    ? `${nextDatedSession.dayLabel} — ${formatTitleFromMotherSessionId(
        nextDatedSession.sessionSlot.session.metadata.id,
        lang,
      )}`
    : null

  // ── Hero state detection ──
  const heroDetect = useMemo(
    () =>
      detectHomeState({
        todayISO: today,
        hasTrainingToday: todayDatedSession != null,
        matchEvents: structuralEvents,
      }),
    [today, todayDatedSession, structuralEvents],
  )
  const heroState: HomeHeroState = isMatchDay ? 'match_today' : heroDetect.state
  const lastMatch = heroDetect.lastMatch
  // Post-match hero : actif si le dernier match a eu lieu dans les dernières 48h.
  const isPostMatchWindow = heroState === 'post_match' && lastMatch != null

  // ── Fatigue level résolu pour visibilité UX (badge "Programme allégé") ──
  // Source unique : resolveFatigueLevel(fatigue, acwrZone, { seasonEnded }).
  // On l'affiche quand le moteur module concrètement le programme.
  const fatigueLevel = resolveFatigueLevel(fatigue, acwr.hasSufficientData ? acwr.zone : null, {
    seasonEnded: Boolean(profile.planningAnchors?.seasonEndedAt),
  })

  // ── Streak + Milestones ──
  const streak = useMemo(() => computeStreak(logs, today), [logs, today])
  const milestones = useMemo(
    () => computeMilestones({ logs, todayISO: today }),
    [logs, today],
  )

  // ── Score Premium : insight + pillars + sparkline 7j ──
  const coachInsight = useMemo(
    () =>
      selectCoachInsight({
        score: readinessResult.score,
        acwr: acwr.acwr,
        acwrZone: acwr.hasSufficientData ? acwr.zone : null,
        todayISO: today,
        matchEvents: structuralEvents,
        logs,
      }),
    [readinessResult.score, acwr.acwr, acwr.hasSufficientData, acwr.zone, today, structuralEvents, logs],
  )
  const scorePillars = useMemo(
    () =>
      computePillars({
        acwr: acwr.acwr,
        acwrZone: acwr.hasSufficientData ? acwr.zone : null,
        logs,
        matchEvents: structuralEvents,
        todayISO: today,
      }),
    [acwr.acwr, acwr.hasSufficientData, acwr.zone, logs, structuralEvents, today],
  )
  const scoreHistory = useMemo(
    () =>
      computeScoreHistory7d({
        currentScore: readinessResult.score,
        logs,
        todayISO: today,
      }),
    [readinessResult.score, logs, today],
  )

  // ── Banners et états divers ──
  const injuryAlertNow = useMemo(() => new Date(`${today}T12:00:00`).getTime(), [today])
  const [injuryDismissed, setInjuryDismissed] = useState(false)
  const [drawerMatch, setDrawerMatch] = useState<typeof nextMatch>(null)

  // ── Coach context ──
  const coachZone = acwr.hasSufficientData ? acwr.zone : null
  const isHighLoad = coachZone === 'danger' || coachZone === 'critical'
  const isRestDay = heroState === 'rest_day' || heroState === 'match_tomorrow' || heroState === 'post_match'
  useRegisterCoachContext({
    scopeKey: `home-${today}`,
    phaseLabel: (() => {
      const d = new Date(today + 'T12:00:00')
      const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      return `Aujourd'hui · ${label.charAt(0).toUpperCase()}${label.slice(1)}`
    })(),
    infoMessages: [
      {
        id: isRestDay ? 'home:rest_day' : 'home:today_session',
        text: isRestDay
          ? heroState === 'post_match'
            ? 'Récup post-match : sommeil + hydratation + protéines.'
            : heroState === 'match_tomorrow'
              ? 'Repos avant le match : marche légère ou mobilité.'
              : 'Repos programmé : sommeil + mobilité légère.'
          : `Séance du jour : ${todaySessionTitle ?? '—'}`,
      },
    ],
    companionMessages: [
      isHighLoad
        ? 'Charge élevée détectée : écoute ton corps, allège si besoin.'
        : readinessResult.score < 50
          ? "Forme basse : mobilité + sommeil prioritaires aujourd'hui."
          : isMatchDay
            ? 'Jour de match : activation courte, hydratation, mental.'
            : isRestDay
              ? 'Profite du repos : sommeil, hydratation, mobilité légère.'
              : 'Énergie OK : exécute ta séance proprement, sans forcer.',
    ],
    chatSeed: 'Je regarde ma journée. ',
  })

  // ── Meta-line (date · saison · semaine de saison · niveau) ──
  // FIX 7 : la "Semaine N" affichée est désormais la semaine absolue de saison
  // rugby (ancrée au 1er septembre), pas le mésocycle interne du moteur — sinon
  // en mai on lirait "Semaine 1" alors qu'on est largement entamé dans la saison.
  const metaLine = useMemo(() => {
    const todayDate = new Date(today + 'T12:00:00')
    const dateLabel = todayDate.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    const seasonLabel = seasonPhaseLabel[seasonPhase] ?? ''
    const seasonWeek = `Semaine ${getRugbySeasonWeek(today)}`
    const levelLabel = TRAINING_LEVEL_LABEL[profile.trainingLevel ?? 'builder']
    return [dateLabel, seasonLabel, seasonWeek, levelLabel].filter(Boolean).join(' · ')
  }, [today, seasonPhase, profile.trainingLevel])

  // ── Hero copy (uniquement pour HeroNormal — HeroDayAfter est géré séparément) ──
  const normalHeroCopy = useMemo(
    () =>
      buildNormalHero(
        // post_match → traité par HeroDayAfter, fallback rest_day pour le typage
        heroState === 'post_match' ? 'rest_day' : heroState,
        todaySessionTitle,
        todaySessionIndex,
        nextSessionLabel,
      ),
    [heroState, todaySessionTitle, todaySessionIndex, nextSessionLabel],
  )

  // ── Mood inline (HeroNormal) ──
  // Source de vérité : `fatigue` du hook useFatigue (persiste en localStorage).
  // L'UI mood reflète directement ce store — au refresh, le toggle reste cohérent
  // avec le dernier choix de l'utilisateur. Click sur l'actif → toggle off (null +
  // setFatigue('OK') puisque c'est le défaut moteur).
  const mood: HeroMood = fatigueToMood(fatigue)
  const handleMoodChange = (next: HeroMood) => {
    setFatigue(moodToFatigue(next) ?? 'OK')
  }

  // ── Next match days-until (pour la NextMatchEditorialCard) ──
  const daysUntilNextMatch = nextMatch
    ? Math.max(0, diffDaysFromTodayISO(nextMatch.date, today))
    : null

  // ── Return-date countdown (pré-saison) ──
  const returnCountdown = (() => {
    const returnIso = profile.planningAnchors?.returnToTeamTrainingAt
    if (!returnIso) return null
    const days = diffDaysFromTodayISO(returnIso, today)
    if (days < 0) return null
    if (days === 0) return 'Reprise au club aujourd\'hui'
    if (days === 1) return 'Reprise au club demain'
    return `J−${days} avant la reprise au club`
  })()

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

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
          ) : undefined
        }
      />

      <main className="relative max-w-md mx-auto pt-5 pb-6">
        {/* Méta-ligne (date · cycle/phase · niveau) */}
        <p className="px-[22px] pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg/55">
          {metaLine}
        </p>

        {/* Return countdown chip */}
        {returnCountdown && (
          <div className="px-[22px] pb-2 -mt-1" data-testid="home-return-countdown">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand">
              <Icon name="calendar" size={11} strokeWidth={2.2} />
              {returnCountdown}
            </p>
          </div>
        )}

        {/* ─── HERO ─── Conditionnel : carte bordeaux pleine post-match (≤ 48h)
                      OU carte cream + bordure bordeaux (état du jour). */}
        <div className="pt-1" data-testid="home-hero-card">
          {isPostMatchWindow && lastMatch ? (
            <HeroDayAfter match={lastMatch} />
          ) : (
            <HeroNormal
              eyebrow={normalHeroCopy.eyebrow}
              title={normalHeroCopy.title}
              subtitle={normalHeroCopy.subtitle}
              dayNumber={String(new Date(`${today}T12:00:00`).getDate())}
              cta={normalHeroCopy.cta}
              mood={mood}
              onMoodChange={handleMoodChange}
              showMood={normalHeroCopy.showMood}
              modulationNote={
                fatigueLevel === 'very_high'
                  ? 'Programme allégé · Récup prioritaire'
                  : fatigueLevel === 'high'
                    ? 'Programme allégé · Charge ajustée'
                    : undefined
              }
            />
          )}
        </div>

        {/* ─── Streak ─── */}
        <StreakCard streak={streak} />

        {/* ─── Prochain match (éditorial) ─── */}
        {nextMatch && daysUntilNextMatch != null && daysUntilNextMatch <= 30 && (
          <div data-testid="home-match-banner">
            <NextMatchEditorialCard
              event={nextMatch}
              daysUntil={daysUntilNextMatch}
              onClick={() => setDrawerMatch(nextMatch)}
            />
          </div>
        )}

        {/* ─── Jalons / Badges ─── */}
        <BadgesStrip milestones={milestones} />

        {/* ─── Score de forme (free → teaser flouté · premium → vraie card) ─── */}
        <div className="px-[22px] pt-6">
          {premiumResolved && !isPremium && <ScoreDeFormeTeaser />}
          {premiumResolved && isPremium && (
            <ScoreDeFormeCard
              current={readinessResult}
              insight={coachInsight}
              pillars={scorePillars}
              history={scoreHistory}
            />
          )}
        </div>

        {/* ─── Transition Banners (max 1 : scheduling > season) ─── */}
        <div className="px-[22px] pt-4 space-y-3">
          {schedulingTransition ? (
            <SchedulingTransitionBanner
              transition={schedulingTransition}
              onAction={() => dismissSchedulingTransition(schedulingTransition.type)}
              onDismiss={() => dismissSchedulingTransition(schedulingTransition.type)}
            />
          ) : seasonTransition?.type === 'playoffs_suggested' ? (
            <PlayoffsThinBanner
              onActivate={() => {
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
                  seasonTransitionState: appendTransitionEntry(
                    profile.seasonTransitionState,
                    entry,
                  ),
                })
                dismissSeasonTransition('playoffs_suggested')
              }}
              onDismiss={() => dismissSeasonTransition('playoffs_suggested')}
            />
          ) : seasonTransition ? (
            seasonTransition.type === 'match_detected_in_offseason' ? (
              <SeasonTransitionBanner
                transition={seasonTransition}
                onConfirmResume={() => {
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
                  if (seasonTransition.type !== 'match_detected_in_offseason') return
                  const matchEvent = (visibleEvents ?? []).find(
                    (e) => e.id === seasonTransition.matchEventId,
                  )
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
                      seasonTransitionState: appendTransitionEntry(
                        profile.seasonTransitionState,
                        entry,
                      ),
                    })
                  } else if (seasonTransition.type === 'pre_season_suggested') {
                    window.location.href = '/profile#reprise'
                  }
                  dismissSeasonTransition(seasonTransition.type)
                }}
                onDismiss={() => dismissSeasonTransition(seasonTransition.type)}
              />
            )
          ) : null}
        </div>

        {/* ─── Premium: Injury risk alert (ACWR > 1.3 + CMJ drop > 10%) ─── */}
        {isPremium &&
          !injuryDismissed &&
          (() => {
            if (!acwr.hasSufficientData || acwr.acwr == null || acwr.acwr <= 1.3) return null
            const cmjHistory = getHistoryFor('cmj', 8)
            if (cmjHistory.length < 3) return null
            const baseline = Math.max(...cmjHistory.map((t) => t.value))
            const lastCmj = cmjHistory[0]?.value
            if (!lastCmj || !baseline) return null
            const pctDrop = ((baseline - lastCmj) / baseline) * 100
            if (pctDrop <= 10) return null

            const dismissKey = userScopedKey('rugbyforge_injury_alert_dismissed', userId)
            try {
              const raw = localStorage.getItem(dismissKey)
              if (raw) {
                const ts = parseInt(raw, 10)
                const cooldownMs = 48 * 60 * 60 * 1000
                if (!Number.isNaN(ts) && injuryAlertNow - ts < cooldownMs && acwr.acwr <= 1.5) return null
              }
            } catch {
              /* ignore */
            }

            return (
              <section className="px-[22px] pt-4">
                <div className="rounded-2xl border border-critical-bd bg-critical-bg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-critical" />
                      <p className="text-xs font-black text-critical uppercase tracking-wide">
                        Risque blessure
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem(dismissKey, String(Date.now()))
                        } catch {
                          /* ignore */
                        }
                        setInjuryDismissed(true)
                      }}
                      className="text-[10px] text-fg-faint hover:text-fg-soft"
                    >
                      Masquer 48h
                    </button>
                  </div>
                  <p className="text-xs text-critical-body leading-relaxed">
                    Ton ratio de charge ({acwr.acwr.toFixed(2)}) et ta fraîcheur neuromusculaire
                    (CMJ {pctDrop.toFixed(0)}% sous ta baseline) indiquent un risque élevé. Semaine
                    légère recommandée.
                  </p>
                </div>
              </section>
            )
          })()}

        {/* ─── Bêta feedback (pattern dashed sobre) ─── */}
        <div className="px-[22px] pt-6">
          <a
            href="mailto:support@rugbyforge.fr?subject=Feedback%20Beta%20RugbyForge"
            onClick={() => posthog.capture('feedback_clicked', { source: 'home' })}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-fg/30 px-3.5 py-3 hover:border-fg/50 transition-colors"
          >
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-paper-deep bg-paper-soft flex-shrink-0">
              <Icon name="heart" size={14} color="var(--color-accent)" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-fg leading-tight">Bêta · ton retour compte</p>
              <p className="mt-0.5 text-[10px] font-medium text-fg/55">
                Bug, idée, suggestion ?
              </p>
            </div>
            <Icon name="chevron-right" size={14} color="var(--color-text-primary)" strokeWidth={2} />
          </a>
        </div>
      </main>

      <BottomNav />
      <MatchEditDrawer event={drawerMatch} onClose={() => setDrawerMatch(null)} />
    </div>
  )
}
