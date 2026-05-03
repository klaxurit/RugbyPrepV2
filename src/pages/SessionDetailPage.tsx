import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { posthog } from '../services/analytics/posthog'
import { ChevronLeft, ShieldCheck, ChevronDown, CheckCircle2, Play } from 'lucide-react'
import { useSessionRun, buildExerciseTourKey } from '../contexts/SessionRunContext'
import { SessionRunProgress } from '../components/motherSession/SessionRunProgress'
import { RunSessionCTA } from '../components/motherSession/RunSessionCTA'
import type { PendingCursor } from '../services/motherSession/findCurrentPending'
import { SessionCelebration } from '../components/motherSession/SessionCelebration'
import { isDirectiveText, resolveExerciseId } from '../services/motherSession/motherSessionExerciseMap'
import { parseBlockTourCount } from '../services/ui/blockPresentation'
import { parseBlockFormat } from '../services/ui/parseBlockFormat'
import { translateBlockNameToFr } from '../services/motherSession/motherSessionContentFr'
import { useWakeLock } from '../hooks/useWakeLock'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR } from '../hooks/useACWR'
import { useAcwrOverride } from '../hooks/useAcwrOverride'
import { useProgramFeatureFlags } from '../hooks/useProgramFeatureFlags'
import { useWeeklyProgramSurface } from '../hooks/useWeeklyProgramSurface'
import { useWeekSnapshot } from '../hooks/useWeekSnapshot'
import { useAuth } from '../hooks/useAuth'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useExerciseSetLogs } from '../hooks/useExerciseSetLogs'
import { buildSlotSignature, dateYmdFromIso } from '../services/motherSession/slotSignature'
import { getLoadSuggestion as computeLoadSuggestion, type LoadSuggestion } from '../services/loadSuggestion'
import { useReadinessScore } from '../hooks/useReadinessScore'
import { getGlobalProgramHardBlock } from '../services/program/hasGlobalProgramHardBlock'
import { buildMotherSessionProgramSessionLog } from '../services/program/buildProgramSessionLog'
import { BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'
import { formatTitleFromMotherSessionId } from '../components/motherSession/formatMotherSessionTitle'
import { MotherSessionView } from '../components/motherSession/MotherSessionView'
import { RPEModal } from '../components/modals/RPEModal'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { getPrehab, CONTRA_LABELS } from '../services/ui/getPrehab'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import type { SessionType } from '../types/training'
import type { MotherSessionType } from '../types/motherSession'

const MS_TYPE_TO_SESSION_TYPE: Record<MotherSessionType, SessionType> = {
  upper: 'UPPER',
  lower: 'LOWER',
  full: 'FULL',
  full_light_primer: 'FULL',
  speed_power: 'CONDITIONING',
}

import { getToday } from '../services/ui/debugDateOverride'

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

export function SessionDetailPage() {
  const { sessionIndex } = useParams<{ sessionIndex: string }>()
  const index = Number(sessionIndex ?? '0')
  const { profile } = useProfile()
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'
  const sessionPageTitle = lang === 'fr' ? 'Séance' : 'Session'
  const { week, lastNonDeloadWeek } = useWeek()
  const { fatigue, setFatigue } = useFatigue()
  const { addLog, logs } = useHistory()
  const { structuralEvents } = useCalendar()
  const navigate = useNavigate()
  const { addBlockLog, getLastEntryForExercise, getBestForExercise } = useBlockLogs()
  const { upsertSet, linkToSessionLog, getLastSetForExercise } = useExerciseSetLogs()
  const { isPremium } = useFeatureAccess()
  const sessionRun = useSessionRun()
  const [prehabbOpen, setPrehabbOpen] = useState(true)
  const [msNotes, setMsNotes] = useState('')
  const [msSaved, setMsSaved] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [msSaveError, setMsSaveError] = useState<string | null>(null)
  const [isSavingSession, setIsSavingSession] = useState(false)
  const handleSaveBlock = (log: Parameters<typeof addBlockLog>[0]) => { addBlockLog(log) }

  useEffect(() => {
    posthog.capture('session_viewed', { index })
    window.scrollTo(0, 0)
  }, [index])

  const { acwr, zone: acwrZone, hasSufficientData: acwrHasData } = useACWR(logs, structuralEvents)
  const { ignoreAcwrOverload } = useAcwrOverride()
  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()

  // ── Surface unifiée ────────────────────────────────────────────────────────
  const today = useMemo(() => getToday(), [])
  const nextMatchDate = useMemo(() => {
    const fm = structuralEvents.filter((e) => e.type === 'match' && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
    return fm.length > 0 ? fm[0].date : null
  }, [structuralEvents, today])
  const readinessResult = useReadinessScore({
    acwrZone: acwrHasData ? acwrZone : null,
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
    acwrZone: acwrHasData ? acwrZone : null,
    week,
    lastNonDeloadWeek,
    ignoreAcwrOverload,
    hasSufficientACWRData: acwrHasData,
    featureFlags: programFeatureFlags,
    readinessScore: readinessResult.score,
    userId,
  }), [profile, structuralEvents, logs, today, fatigue, acwrHasData, acwrZone, week, lastNonDeloadWeek, ignoreAcwrOverload, programFeatureFlags, readinessResult.score, userId])
  const { surface: rawSurface } = useWeeklyProgramSurface(surfaceParams)
  // F2: Use snapshot-owned sessions so corrections (fatigue, skip, reschedule) are respected
  const { surface: snapshotSurface, snapshot } = useWeekSnapshot(surfaceParams)
  const surface = snapshotSurface ?? rawSurface

  // ── Hard-block global ──────────────────────────────────────────────────────
  const { hasHardBlock, hardBlockReasons } = getGlobalProgramHardBlock(profile)

  useEffect(() => {
    if (hasHardBlock) {
      posthog.capture('beta_eligibility_blocked', {
        surface: 'session_detail',
        primaryReason: hardBlockReasons[0] ?? null,
        reasons: hardBlockReasons,
      })
    }
  }, [hasHardBlock, hardBlockReasons])

  const msResolution = surface?.motherSession ?? null
  const activeSlot = useMemo(() => {
    const presentationSessions = snapshot?.presentation?.sessions
    if (presentationSessions && index < presentationSessions.length) {
      return presentationSessions[index].sessionSlot
    }
    const rawSessions = msResolution?.sessions ?? []
    return rawSessions[index] ?? null
  }, [snapshot, msResolution, index])

  // ── Session Run Mode (hooks must come before any early return) ───────────
  const sessionRunKey = activeSlot ? `${activeSlot.session.metadata.id}_${today}` : null
  const isRunning = sessionRunKey != null && sessionRun.isRunningFor(sessionRunKey)

  // Progression par TOURS (pas par série/exo). Un tour est "validé" quand tous
  // les exos loggables du bloc sont cochés pour ce tourIndex.
  const runProgress = useMemo(() => {
    if (!activeSlot) {
      return {
        totalTours: 0,
        completedTours: 0,
        activeBlockIndex: 0,
        totalBlocks: 0,
        activeBlockName: '',
        activeTourIndex: null as number | null,
        activeBlockTourCount: 0,
        activeBlockUnitLabel: 'Tour' as 'Tour' | 'Minute' | 'Round' | 'For Time',
      }
    }
    const blocks = activeSlot.session.blocks
    let totalTours = 0
    let completedTours = 0
    let activeBlockIndex = 0 // 0 = pas encore trouvé
    let activeBlockName = ''
    let activeTourIndex: number | null = null
    let activeBlockTourCount = 0
    let activeBlockUnitLabel: 'Tour' | 'Minute' | 'Round' | 'For Time' = 'Tour'
    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b]
      const loggableIdx: number[] = []
      block.exercises.forEach((ex, i) => {
        if (isDirectiveText(ex.name)) return
        if (!(ex.exerciseId || resolveExerciseId(ex.name))) return
        loggableIdx.push(i)
      })
      // Pour le total d'unités : EMOM/Tabata utilisent `format.rounds` (nombre
      // de minutes/rounds exécutés), pas le compteur "tours" génériques.
      const fmt = parseBlockFormat(block.format)
      const unitCount =
        fmt.type === 'emom' || fmt.type === 'tabata'
          ? fmt.rounds
          : parseBlockTourCount(block)
      if (loggableIdx.length === 0) continue
      totalTours += unitCount
      let blockCompletedTours = 0
      let blockActiveTour: number | null = null
      // Les formats temporels sont considérés "non loggués" — on ne compte pas
      // de tours validés tant que le chrono n'est pas terminé côté overlay.
      // Pour l'affichage du header, on reste sur l'unité 0 (premier).
      if (fmt.type === 'rounds') {
        for (let t = 0; t < unitCount; t++) {
          const allDone = loggableIdx.every((i) =>
            sessionRun.completedExercises.has(buildExerciseTourKey(block.number, t, i)),
          )
          if (allDone) blockCompletedTours += 1
          else if (blockActiveTour === null) blockActiveTour = t
        }
      } else {
        // Bloc temporel : considéré comme "à faire" jusqu'à validation explicite.
        blockActiveTour = 0
      }
      completedTours += blockCompletedTours
      if (activeBlockIndex === 0 && blockActiveTour !== null) {
        activeBlockIndex = b + 1
        activeBlockName = translateBlockNameToFr(block.name)
        activeTourIndex = blockActiveTour + 1
        activeBlockTourCount = unitCount
        activeBlockUnitLabel =
          fmt.type === 'emom'
            ? 'Minute'
            : fmt.type === 'tabata'
              ? 'Round'
              : fmt.type === 'for_time'
                ? 'For Time'
                : 'Tour'
      }
    }
    if (activeBlockIndex === 0 && blocks.length > 0) {
      activeBlockIndex = blocks.length
      activeBlockName = translateBlockNameToFr(blocks[blocks.length - 1].name)
    }
    return {
      totalTours,
      completedTours,
      activeBlockIndex,
      totalBlocks: blocks.length,
      activeBlockName,
      activeTourIndex,
      activeBlockTourCount,
      activeBlockUnitLabel,
    }
  }, [activeSlot, sessionRun.completedExercises])

  // Auto-scroll : quand le CTA bas signale un changement de série courante,
  // on amène la `<li>` correspondante dans le viewport (centre vertical).
  // L'id DOM est posé par SessionTourTracker — pas de ref nécessaire.
  const handleCursorChange = useCallback((cursor: PendingCursor | null) => {
    if (!cursor) return
    const id = `set-${cursor.blockNumber}-${cursor.tourIndex}-${cursor.exerciseIndex}`
    if (typeof window === 'undefined') return
    // Petit délai pour laisser React peindre l'état "validé" sur la série
    // précédente avant le scroll — moins disorienting visuellement.
    window.setTimeout(() => {
      const el = document.getElementById(id)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 80)
  }, [])

  // Keep the screen awake while a session is running. Released on unmount / stop.
  useWakeLock(isRunning)

  // ── Stats for the celebration screen ─────────────────────────────────────
  const celebrationStats = useMemo(() => {
    const startedAt = sessionRun.startedAt
    const durationMin = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : 0
    // "totalSets" = étapes exo-tour validées (1 coche = 1 "série" pour l'affichage).
    const totalSets = sessionRun.completedExercises.size
    let tonnageKg = 0
    let hasAnyLoad = false
    for (const key of sessionRun.completedExercises) {
      const load = sessionRun.exerciseTourLoads[key]
      if (load?.loadKg != null && load?.reps != null) {
        tonnageKg += load.loadKg * load.reps
        hasAnyLoad = true
      }
    }
    return {
      durationMin,
      totalSets,
      tonnageKg: hasAnyLoad ? Math.round(tonnageKg) : null,
    }
  }, [sessionRun.completedExercises, sessionRun.exerciseTourLoads, sessionRun.startedAt])

  // ── Slot signature : clé idempotente pour persister sets + session_log ──
  const slotSignature = useMemo(() => {
    if (!activeSlot || !surface) return null
    const dateYMD = sessionRun.startedAt
      ? dateYmdFromIso(new Date(sessionRun.startedAt).toISOString())
      : today
    return buildSlotSignature({
      motherSessionId: activeSlot.session.metadata.id,
      weekLabel: surface.planningContext.weekLabel ?? 'unknown',
      sessionIndex: index,
      dateYMD,
    })
  }, [activeSlot, surface, sessionRun.startedAt, today, index])

  // ── Autosave par bloc : déclenché dès que le dernier tour d'un bloc est validé ──
  // Autofill : si l'utilisateur n'a saisi que le tour 1, on hérite de ses valeurs
  // pour les tours suivants validés mais vides. La règle : "tour validé sans saisie
  // = même charge/reps que la première saisie de ce même exercice".
  const handleBlockCompleted = useCallback((blockNumber: number) => {
    if (!slotSignature || !activeSlot || !surface) return
    const block = activeSlot.session.blocks.find((b) => b.number === blockNumber)
    if (!block) return
    const weekLabel = surface.planningContext.weekLabel ?? 'unknown'
    const motherSessionId = activeSlot.session.metadata.id
    const tourCount = parseBlockTourCount(block)

    block.exercises.forEach((exercise, exerciseIndex) => {
      if (!exercise || isDirectiveText(exercise.name)) return
      const exerciseId = exercise.exerciseId ?? resolveExerciseId(exercise.name)
      if (!exerciseId) return

      // Trouve les valeurs de chaque tour pour cet exercice et la 1re saisie non vide.
      const valuesPerTour: ({ loadKg?: number; reps?: number } | undefined)[] = []
      let firstFilled: { loadKg?: number; reps?: number } | undefined
      for (let tour = 0; tour < tourCount; tour++) {
        const k = buildExerciseTourKey(blockNumber, tour, exerciseIndex)
        const v = sessionRun.exerciseTourLoads[k]
        valuesPerTour.push(v)
        if (!firstFilled && v && (v.loadKg != null || v.reps != null)) firstFilled = v
      }
      if (!firstFilled) return

      // Pour chaque tour validé (coché ou avec une saisie), on persiste — en
      // héritant de firstFilled si aucune saisie propre.
      for (let tour = 0; tour < tourCount; tour++) {
        const k = buildExerciseTourKey(blockNumber, tour, exerciseIndex)
        const isValidated = sessionRun.completedExercises.has(k)
        const own = valuesPerTour[tour]
        const ownHasData = own && (own.loadKg != null || own.reps != null)
        if (!isValidated && !ownHasData) continue
        const effective = ownHasData ? own! : firstFilled
        void upsertSet({
          slotSignature,
          motherSessionId,
          weekLabel,
          sessionIndex: index,
          blockNumber,
          exerciseId,
          tourIndex: tour,
          loadKg: effective.loadKg,
          reps: effective.reps,
        })
      }
    })
  }, [slotSignature, activeSlot, surface, sessionRun.exerciseTourLoads, sessionRun.completedExercises, upsertSet, index])

  // ── Suggestion de charge premium par exercice (KB rugby + RPE) ──
  const buildLoadSuggestion = useCallback((exerciseId: string): LoadSuggestion | undefined => {
    if (!isPremium) return undefined
    const lastSet = getLastSetForExercise(exerciseId)
    const lastEntry = lastSet?.loadKg != null
      ? { exerciseId, loadKg: lastSet.loadKg, reps: lastSet.reps, rir: lastSet.rir }
      : getLastEntryForExercise(exerciseId)
    if (!lastEntry) {
      return { decision: 'no_data', suggestedWeight: null, suggestedReps: null, justification: '', nextTarget: null, confidence: 'low' }
    }
    const fatigueForSuggestion: 'normal' | 'high' | 'critical' =
      acwrZone === 'critical' || acwrZone === 'danger' ? 'high' : 'normal'
    return computeLoadSuggestion({
      exerciseId,
      lastEntry,
      week,
      acwr: acwrHasData ? acwr : null,
      isRehabActive: Boolean(profile.rehabInjury),
      fatigueLevel: fatigueForSuggestion,
    })
  }, [isPremium, getLastSetForExercise, getLastEntryForExercise, acwr, acwrZone, acwrHasData, week, profile.rehabInjury])

  if (hasHardBlock) {
    return (
      <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav">
        <PageHeader title={sessionPageTitle} backTo="/week" />
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

  // ── Décision moteur ────────────────────────────────────────────────────────
  const primarySource = surface?.primarySource ?? 'mother_session'
  const isUnavailable = primarySource === 'unavailable'

  // ── Mother-session path (F2: prefer snapshot-owned sessions) ─────────
  const msSessionType = activeSlot?.session.metadata.sessionType
    ? MS_TYPE_TO_SESSION_TYPE[activeSlot.session.metadata.sessionType]
    : undefined

  const prehabs = getPrehab(profile.injuries)

  const handleStartSession = () => {
    if (!sessionRunKey) return
    sessionRun.start(sessionRunKey)
    posthog.capture('session_started', { index, sessionId: activeSlot?.session.metadata.id })
  }

  const handleQuitRunningSession = () => {
    if (window.confirm('Quitter la séance en cours ? Les cases cochées seront perdues.')) {
      sessionRun.stop()
    }
  }

  // ── Title ────────────────────────────────────────────────────────────────
  const pageTitle = activeSlot
    ? formatTitleFromMotherSessionId(activeSlot.session.metadata.id, lang)
    : sessionPageTitle
  const pageSuffix = localizeWeekLabel(surface?.planningContext.weekLabel ?? week, lang)

  const handleConfirmMotherSession = async (payload: {
    fatigue: 'OK' | 'FATIGUE'
    rpe: number
    durationMin: number
    notes?: string
  }) => {
    if (!surface || !activeSlot) return

    setIsSavingSession(true)
    setMsSaveError(null)

    // If the caller provided notes (celebration flow), use them; otherwise fall back to the notes textarea.
    if (payload.notes != null) setMsNotes(payload.notes)

    try {
      setFatigue(payload.fatigue)
      const noteText = (payload.notes != null ? payload.notes : msNotes).trim() || undefined
      const log = buildMotherSessionProgramSessionLog({
        dateISO: new Date().toISOString(),
        fatigue: payload.fatigue,
        notes: noteText,
        rpe: payload.rpe,
        durationMin: payload.durationMin,
        tonnageKg: celebrationStats.tonnageKg ?? undefined,
        slot: activeSlot,
        planningContext: surface.planningContext,
        slotSignature: slotSignature ?? undefined,
      })

      const savedLog = await addLog(log)
      // Une fois le session_log sauvegardé, on rattache les exercise_set_logs
      // déjà créés par l'autosave par bloc.
      if (savedLog?.id && slotSignature) {
        await linkToSessionLog(slotSignature, savedLog.id)
      }
      setCompletionOpen(false)
      setCelebrationOpen(false)
      setMsNotes('')
      setMsSaved(true)
      // Clean up the running session state once the log is persisted.
      sessionRun.stop()
      window.setTimeout(() => navigate('/week'), 1200)
    } catch (error) {
      console.error('session_detail_complete_failed', error)
      setMsSaveError("La séance n'a pas pu être enregistrée. Réessaie dans quelques instants.")
    } finally {
      setIsSavingSession(false)
    }
  }

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-64 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={pageTitle} backTo="/week" titleSuffix={pageSuffix} />

      {isRunning && sessionRun.startedAt != null && (
        <SessionRunProgress
          totalTours={runProgress.totalTours}
          completedTours={runProgress.completedTours}
          startedAt={sessionRun.startedAt}
          activeBlockIndex={runProgress.activeBlockIndex}
          totalBlocks={runProgress.totalBlocks}
          activeBlockName={runProgress.activeBlockName}
          activeTourIndex={runProgress.activeTourIndex}
          activeBlockTourCount={runProgress.activeBlockTourCount}
          activeBlockUnitLabel={runProgress.activeBlockUnitLabel}
          onQuit={handleQuitRunningSession}
        />
      )}

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">

        {/* ═══════════════════════════════════════════════════════════════════
            UNAVAILABLE — plan annuel non résolu
           ═══════════════════════════════════════════════════════════════════ */}
        {isUnavailable && (
          <section className="rounded-[24px] border border-warn-bd bg-warn-bg-muted p-5 space-y-3">
            <p className="text-sm font-bold text-warn">Séance introuvable</p>
            <p className="text-xs text-fg-soft">
              Le plan annuel n'a pas pu être résolu pour cette semaine. Vérifie ton profil ou réessaie après une mise à jour.
            </p>
            <Link
              to="/week"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour à ma semaine
            </Link>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MOTEUR MOTHER-SESSION
           ═══════════════════════════════════════════════════════════════════ */}
        {!isUnavailable && (
          <>
            {activeSlot ? (
              <>
                {/* Contexte de forme — chip rapide au-dessus du détail séance (aperçu uniquement). */}
                {!isRunning && isPremium && (
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                        readinessResult.score >= 60
                          ? 'border-ok-bd bg-ok-bg-muted text-ok-strong'
                          : readinessResult.score >= 40
                            ? 'border-warn-bd bg-warn-bg-muted text-warn-strong'
                            : 'border-alert-bd bg-alert-bg-muted text-alert-strong'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Forme {readinessResult.score} · {readinessResult.label}
                    </span>
                  </div>
                )}

                <div data-testid="mother-session-detail">
                  <MotherSessionView
                    session={activeSlot.session}
                    lang={lang}
                    injuries={profile.injuries}
                    trainingLevel={profile.trainingLevel}
                    equipment={profile.equipment}
                    sessionType={msSessionType}
                    week={week}
                    fatigue={fatigue}
                    onSaveBlock={handleSaveBlock}
                    onBlockCompleted={handleBlockCompleted}
                    getLoadSuggestion={buildLoadSuggestion}
                    getLastEntryForExercise={(exerciseId) => {
                      // Priorité : nouvelles données per-set, puis fallback legacy block_logs
                      const lastSet = getLastSetForExercise(exerciseId)
                      if (lastSet?.loadKg != null) {
                        return {
                          exerciseId,
                          loadKg: lastSet.loadKg,
                          reps: lastSet.reps,
                          rir: lastSet.rir,
                        }
                      }
                      return getLastEntryForExercise(exerciseId)
                    }}
                    getBestForExercise={getBestForExercise}
                    isPremium={isPremium}
                    acwr={acwrHasData ? acwr : null}
                    isRehabActive={false}
                    isRunning={isRunning}
                  />
                </div>

                {/* Prehab */}
                {prehabs.length > 0 && (
                  <div className="bg-layer-5 border border-border-app rounded-[2rem] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPrehabbOpen((o) => !o)}
                      className="w-full flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-ok-bg-muted text-ok">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-fg">Échauffement ciblé</p>
                          <p className="text-xs text-fg-muted mt-0.5">
                            {prehabs.length} exercices · {profile.injuries.map(i => CONTRA_LABELS[i]).join(', ')}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-fg-faint transition-transform flex-shrink-0 ${prehabbOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {prehabbOpen && (
                      <div className="border-t border-border-app">
                        <div className="px-5 py-3 bg-ok-bg-muted border-b border-ok-bd">
                          <p className="text-[11px] text-ok leading-relaxed">
                            À faire <strong>avant</strong> la séance principale (~10 min). Ces exercices sont adaptés à tes zones sensibles.
                            <span className="opacity-70"> En cas de douleur persistante, consulte un professionnel.</span>
                          </p>
                        </div>
                        <div className="divide-y divide-edge-hairline">
                          {prehabs.map((ex) => (
                            <div key={ex.id} className="px-5 py-4 space-y-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-bold text-fg leading-snug">{ex.nameFr}</p>
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-layer-10 text-[10px] font-black text-fg-soft">
                                  {ex.sets}×{ex.reps}
                                </span>
                              </div>
                              <p className="text-xs text-fg-muted leading-snug">{ex.notes}</p>
                              {ex.equipment.length > 0 && (
                                <p className="text-[10px] text-fg-faint font-medium">
                                  Matériel : {ex.equipment.join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Messages de statut inline (le CTA principal est en sticky footer ci-dessous). */}
                {(msSaveError || msSaved) && (
                  <section data-testid="ms-completion-section" className="space-y-2">
                    {msSaveError && (
                      <div className="px-4 py-3 bg-danger-bg border border-danger-bd rounded-2xl">
                        <p className="text-xs text-danger-soft font-bold">{msSaveError}</p>
                      </div>
                    )}
                    {msSaved && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-ok-bg-muted border border-ok-bd rounded-2xl">
                        <CheckCircle2 className="w-4 h-4 text-ok flex-shrink-0" />
                        <p className="text-xs text-ok font-bold">Séance enregistrée !</p>
                      </div>
                    )}
                  </section>
                )}
              </>
            ) : (
              <div className="p-8 text-center space-y-3" data-testid="session-not-found">
                <p className="text-sm text-fg-muted">Séance introuvable à cet index.</p>
                <Link
                  to="/week"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-brand"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour au plan semaine
                </Link>
              </div>
            )}
          </>
        )}

      </main>

      {/* ── CTA bas de page.
          - Mode Aperçu : footer sticky classique (Commencer + Marquer comme faite + lien Premium).
          - Mode En cours : RunSessionCTA prend le relai (CTA orchestrant repos / chrono iso /
            valider série / terminer séance) — voir RunSessionCTA.tsx. */}
      {activeSlot && !isUnavailable && !isRunning && (
        <div className="fixed left-0 right-0 z-40 bottom-20 bg-app border-t border-border-app shadow-[0_-6px_24px_rgb(44_24_16/0.08)]">
          <div className="max-w-md mx-auto px-5 pt-3 pb-4">
            {!isPremium && (
              <Link
                to="/profile#premium"
                className="block mb-2 text-center text-[11px] font-bold text-fg-muted hover:text-brand-tint transition-colors"
              >
                Débloque le suivi set-par-set — <span className="underline underline-offset-2">Découvrir Premium</span>
              </Link>
            )}
            <button
              type="button"
              data-testid="ms-start-btn"
              onClick={handleStartSession}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover text-on-brand font-black uppercase italic tracking-wide transition-all shadow-lg shadow-brand-float flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Commencer la séance
            </button>
            <button
              type="button"
              data-testid="ms-complete-btn"
              onClick={() => {
                setMsSaved(false)
                setMsSaveError(null)
                setCompletionOpen(true)
              }}
              className="block w-full mt-2 text-center text-[11px] font-bold text-fg-muted hover:text-fg transition-colors"
            >
              Marquer comme faite (sans la lancer)
            </button>
          </div>
        </div>
      )}
      {activeSlot && !isUnavailable && isRunning && (
        <RunSessionCTA
          session={activeSlot.session}
          lang={lang}
          onCursorChange={handleCursorChange}
          onFinish={() => {
            setMsSaved(false)
            setMsSaveError(null)
            setCelebrationOpen(true)
          }}
        />
      )}

      <RPEModal
        isOpen={completionOpen}
        sessionLabel={pageTitle}
        initialFatigue={fatigue}
        isSubmitting={isSavingSession}
        onClose={() => {
          if (isSavingSession) return
          setCompletionOpen(false)
        }}
        onConfirm={handleConfirmMotherSession}
      />
      <SessionCelebration
        isOpen={celebrationOpen}
        sessionLabel={pageTitle}
        stats={celebrationStats}
        isSubmitting={isSavingSession}
        onClose={() => {
          if (isSavingSession) return
          setCelebrationOpen(false)
        }}
        onConfirm={handleConfirmMotherSession}
      />
      {!isRunning && <BottomNav />}
    </div>
  )
}
