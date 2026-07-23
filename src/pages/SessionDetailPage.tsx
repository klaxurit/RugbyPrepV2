import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { posthog } from '../services/analytics/posthog'
import { ChevronLeft, ShieldCheck, ChevronDown, CheckCircle2, X } from 'lucide-react'
import { useSessionRun, buildExerciseTourKey } from '../contexts/SessionRunContext'
import { findCurrentPending } from '../services/motherSession/findCurrentPending'
import { getRestAfterExerciseSet } from '../services/motherSession/interTourRest'
import { isDirectiveText, resolveExerciseIdForSessionRun } from '../services/motherSession/motherSessionExerciseMap'
import { parseBlockTourCount } from '../services/ui/blockPresentation'
import { parseExerciseSetSpec } from '../services/ui/exerciseSetSpec'
import { parseBlockFormat } from '../services/ui/parseBlockFormat'
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
import { useWeekSnapshotConfirmationSheet } from '../hooks/useWeekSnapshotConfirmationSheet'
import { useAuth } from '../hooks/useAuth'
import { useExerciseSetLogs } from '../hooks/useExerciseSetLogs'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { mergeExerciseHistoryLogs } from '../services/session/mergeExerciseHistoryLogs'
import { flushSessionExerciseSets } from '../services/session/flushSessionExerciseSets'
import { buildSlotSignature } from '../services/motherSession/slotSignature'
import { useReadinessScore } from '../hooks/useReadinessScore'
import { getGlobalProgramHardBlock } from '../services/program/hasGlobalProgramHardBlock'
import { collectBlockSetUpserts, type BlockCompletionSnapshot } from '../services/session/collectBlockSetUpserts'
import {
  resolveExerciseSetValidatePrefill,
  validateExerciseSetFromBlock,
} from '../services/session/validateExerciseSet'
import { buildMotherSessionProgramSessionLog } from '../services/program/buildProgramSessionLog'
import { BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'
import { formatTitleFromMotherSessionId } from '../components/motherSession/formatMotherSessionTitle'
import { prepareSessionForRender } from '../services/session/prepareSessionForRender'
import { localizeMotherSessionExerciseName } from '../services/motherSession/localizeMotherSessionExerciseName'
import { localizeBlockName } from '../services/motherSession/motherSessionBlockLabels'
import { restTimerAfterSetLine } from '../i18n/sessionRunUi'
import { SessionFinishedSheet } from '../components/session/SessionFinishedSheet'
import { SessionShareSheet } from '../components/session/SessionShareSheet'
import type { SessionSharePayload } from '../services/share/sessionShareTypes'
import { buildSessionShareIntent } from '../services/share/buildSessionShareIntent'
import { collectSessionExerciseMaxLoads } from '../services/share/collectSessionExerciseMaxLoads'
import { getExerciseName } from '../data/exercises'
import { computeSessionTonnage } from '../services/session/computeSessionTonnage'
import { detectSessionPRs } from '../services/session/detectSessionPRs'
import { buildSessionLoadSuggestions } from '../services/session/buildSessionLoadSuggestions'
import {
  buildPreviousSessionSetMap,
  previousSessionSetKey,
  type PreviousSessionSetRef,
} from '../services/session/buildPreviousSessionSetMap'
import { isBodyweightProgramTier } from '../services/equipment/resolveEquipmentProgramTier'
import { bodyweightProgramMissingMorphology } from '../services/bodyweight/bodyweightMorphologyWarning'
import { BodyweightMorphologyBanner } from '../components/profile/BodyweightMorphologyBanner'
import { resolveFatigueLevel } from '../services/program/resolveFatigueLevel'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { getPrehab, CONTRA_LABELS } from '../services/ui/getPrehab'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { SessionRunProgressBar, SessionStickyCTA, SessionBlocks } from '../components/session'
import { SessionPRToast } from '../components/session/SessionPRToast'
import { detectLiveSetPR, collectPriorSessionDrafts } from '../services/pr/detectLiveSetPR'
import { buildLivePRToastData, type LivePRToastData } from '../services/pr/formatLivePRToast'
import { getExerciseMetricType } from '../services/ui/exerciseMetrics'
import { HeroIdle } from '../components/session/blocks'
import { ExerciseDemoSheet } from '../components/motherSession/ExerciseDemoSheet'
import { hasExerciseDemo } from '../data/exercises'
import {
  RestOverlay,
  EmomOverlay,
  IsoOverlay,
  type IsoOverlayState,
} from '../components/session/timers'

// (MS_TYPE_TO_SESSION_TYPE retiré : plus de mapping local nécessaire après
//  remplacement de MotherSessionView par SessionBlocks. Le type SessionType
//  est utilisé en aval directement dans buildMotherSessionProgramSessionLog.)

import { getToday } from '../services/ui/debugDateOverride'
import { cyclePhaseLabel, trainingLevelLabel, tr } from '../i18n/appLabels'

function localizeWeekLabel(label: string, lang: 'fr' | 'en'): string {
  let out = label
    .replace(/\bOff[-_]season\b/gi, cyclePhaseLabel('off_season', lang))
    .replace(/\bPre[-_]season\b/gi, cyclePhaseLabel('pre_season', lang))
    .replace(/\bIn[-_]season\b/gi, cyclePhaseLabel('in_season', lang))
  if (lang === 'fr') out = out.replace(/ - W(\d)/, ' - S$1')
  return out
}

/** Date courte UPPERCASE pour l'eyebrow (ex: "VEN. 8 MAI"). */
function formatShortDateUpper(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d
    .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase()
}

/** Tags meta affichés en pill outline sous le titre du HeroIdle. */
function buildHeroTags(args: {
  weekLabel?: string
  targetDuration?: string
  trainingLevel?: string
  lang: 'fr' | 'en'
}): string[] {
  const { weekLabel, targetDuration, trainingLevel, lang } = args
  const tags: string[] = []
  if (weekLabel) {
    const localized = localizeWeekLabel(weekLabel, lang)
    const phaseOnly = localized.split('—')[0]?.trim()
    if (phaseOnly) tags.push(phaseOnly)
  }
  if (targetDuration) tags.push(targetDuration)
  if (trainingLevel === 'performance' || trainingLevel === 'builder') {
    tags.push(trainingLevelLabel('performance', lang))
  } else if (trainingLevel === 'starter') {
    tags.push(trainingLevelLabel('starter', lang))
  }
  return tags
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
  const { structuralEvents, visibleEvents } = useCalendar()
  const navigate = useNavigate()
  const { upsertSet, linkToSessionLog, logs: setLogs } = useExerciseSetLogs()
  const { logs: blockLogs } = useBlockLogs()
  const { isPremium } = useFeatureAccess()
  const sessionRun = useSessionRun()
  const [prehabbOpen, setPrehabbOpen] = useState(true)
  const [msNotes, setMsNotes] = useState('')
  const [msSaved, setMsSaved] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePayload, setSharePayload] = useState<SessionSharePayload | null>(null)
  const [msSaveError, setMsSaveError] = useState<string | null>(null)
  const [isSavingSession, setIsSavingSession] = useState(false)
  // B3 — exercise demo sheet (eye button on exercise rows in ToursBlock)
  const [demoExerciseId, setDemoExerciseId] = useState<string | null>(null)
  const [livePRToast, setLivePRToast] = useState<LivePRToastData | null>(null)
  // Note : depuis le passage à SessionBlocks, les sets sont persistés via
  // `upsertSet` (table exercise_set_logs). Le hook `useBlockLogs` ne sert plus
  // sur cette page — il sera ré-introduit en D5/D6 pour la suggestion de charge
  // Premium (lecture du dernier entry par exo).

  useEffect(() => {
    posthog.capture('session_viewed', { index })
    window.scrollTo(0, 0)
  }, [index])

  // `acwr` (ratio) sera utile en D5/D6 pour la suggestion de charge Premium.
  const { zone: acwrZone, hasSufficientData: acwrHasData } = useACWR(logs, structuralEvents)
  const { ignoreAcwrOverload } = useAcwrOverride()
  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()

  // ── Surface unifiée ────────────────────────────────────────────────────────
  const today = useMemo(() => getToday(), [])
  const nextMatchDate = useMemo(() => {
    const fm = structuralEvents
      .filter((e) => e.type === 'match' && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
    return fm.length > 0 ? fm[0].date : null
  }, [structuralEvents, today])
  const readinessResult = useReadinessScore({
    acwrZone: acwrHasData ? acwrZone : null,
    fatigue,
    logs,
    nextMatchDate,
    today,
  })
  const surfaceParams = useMemo(
    () => ({
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
    }),
    [
      profile,
      structuralEvents,
      logs,
      today,
      fatigue,
      acwrHasData,
      acwrZone,
      week,
      lastNonDeloadWeek,
      ignoreAcwrOverload,
      programFeatureFlags,
      readinessResult.score,
      userId,
    ],
  )
  const { surface: rawSurface } = useWeeklyProgramSurface(surfaceParams)
  const {
    surface: snapshotSurface,
    snapshot,
    confirmPendingUpdate,
    hasConfirmationRequired,
  } = useWeekSnapshot(surfaceParams)
  const surface = snapshotSurface ?? rawSurface

  const confirmationItem = hasConfirmationRequired ? snapshot?.confirmationRequired[0] ?? null : null
  useWeekSnapshotConfirmationSheet({
    hasConfirmationRequired,
    confirmationItem,
    confirmPendingUpdate,
    visibleEvents,
    today,
    lang,
  })

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

  const adaptedSession = useMemo(() => {
    if (!activeSlot) return null
    return prepareSessionForRender({
      session: activeSlot.session,
      trainingLevel: profile.trainingLevel,
      equipment: profile.equipment,
      lang,
    })
  }, [activeSlot, profile.trainingLevel, profile.equipment, lang])

  /** Set logs + block_logs legacy — source unique pour PR / PREVIOUS / suggestions. */
  const historyLogs = useMemo(
    () => mergeExerciseHistoryLogs(setLogs, blockLogs),
    [setLogs, blockLogs],
  )

  // ── Session Run Mode ──────────────────────────────────────────────────────
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
    let activeBlockIndex = 0
    let activeBlockName = ''
    let activeTourIndex: number | null = null
    let activeBlockTourCount = 0
    let activeBlockUnitLabel: 'Tour' | 'Minute' | 'Round' | 'For Time' = 'Tour'
    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b]
      const loggableIdx: number[] = []
      block.exercises.forEach((ex, i) => {
        if (isDirectiveText(ex.name)) return
        if (!(resolveExerciseIdForSessionRun(ex.name, ex.exerciseId))) return
        loggableIdx.push(i)
      })
      const fmt = parseBlockFormat(block.format)
      const unitCount =
        fmt.type === 'emom' || fmt.type === 'tabata' ? fmt.rounds : parseBlockTourCount(block)
      if (loggableIdx.length === 0) continue
      totalTours += unitCount
      let blockCompletedTours = 0
      let blockActiveTour: number | null = null
      if (fmt.type === 'rounds') {
        for (let t = 0; t < unitCount; t++) {
          const allDone = loggableIdx.every((i) =>
            sessionRun.completedExercises.has(buildExerciseTourKey(block.number, t, i)),
          )
          if (allDone) blockCompletedTours += 1
          else if (blockActiveTour === null) blockActiveTour = t
        }
      } else {
        blockActiveTour = 0
      }
      completedTours += blockCompletedTours
      if (activeBlockIndex === 0 && blockActiveTour !== null) {
        activeBlockIndex = b + 1
        activeBlockName = localizeBlockName(block.name, lang)
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
      activeBlockName = localizeBlockName(blocks[blocks.length - 1].name, lang)
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
  }, [activeSlot, sessionRun.completedExercises, lang])

  // (handleCursorChange retiré : l'auto-scroll vers la série courante sera
  //  réintégré en D6 via le sticky CTA contextuel `validate-exo`.)

  useWakeLock(isRunning)

  // ── États des overlays timer (D5) ────────────────────────────────────────
  // EMOM/Tabata : bloc en chrono actif
  const [emomBlockNumber, setEmomBlockNumber] = useState<number | null>(null)
  // Iso : exo en chrono actif (avec contexte pour pouvoir le marquer fait)
  const [isoTrigger, setIsoTrigger] = useState<{
    blockNumber: number
    tourIndex: number
    exerciseIndex: number
    overlayState: IsoOverlayState
  } | null>(null)

  // ── Slot signature : clé idempotente pour persister sets + session_log ──
  const slotSignature = useMemo(() => {
    if (!activeSlot || !surface) return null
    return buildSlotSignature({
      motherSessionId: activeSlot.session.metadata.id,
      weekLabel: surface.planningContext.weekLabel ?? 'unknown',
      sessionIndex: index,
    })
  }, [activeSlot, surface, index])

  // ── Stats for the celebration screen ─────────────────────────────────────
  const celebrationStats = useMemo(() => {
    const startedAt = sessionRun.startedAt
    const durationMin = startedAt
      ? Math.max(1, Math.round((Date.now() - startedAt) / 60000))
      : null
    const completedSets = sessionRun.completedExercises.size

    let totalSets = 0
    if (activeSlot) {
      for (const block of activeSlot.session.blocks) {
        const tourCount = parseBlockTourCount(block)
        const loggable = block.exercises.filter((e) => e && !isDirectiveText(e.name)).length
        totalSets += loggable * tourCount
      }
    }

    let tonnageKg: number | null = null
    if (slotSignature) {
      const persisted = computeSessionTonnage({
        sets: setLogs,
        slotSignature,
        bodyweightKg: profile.weightKg,
      })
      if (persisted > 0) {
        tonnageKg = persisted
      } else {
        let memTonnage = 0
        let hasAny = false
        for (const key of sessionRun.completedExercises) {
          const load = sessionRun.exerciseTourLoads[key]
          if (load?.loadKg != null && load?.reps != null) {
            memTonnage += load.loadKg * load.reps
            hasAny = true
          }
        }
        if (hasAny) tonnageKg = Math.round(memTonnage)
      }
    }

    return {
      durationMin,
      completedSets,
      totalSets,
      tonnageKg,
    }
  }, [
    sessionRun.completedExercises,
    sessionRun.exerciseTourLoads,
    sessionRun.startedAt,
    activeSlot,
    slotSignature,
    setLogs,
    profile.weightKg,
  ])

  // ── PRs détectés sur la séance ───────────────────────────────────────────
  const sessionPRs = useMemo(() => {
    if (!slotSignature) return []
    return detectSessionPRs({
      allSets: historyLogs,
      currentSlotSignature: slotSignature,
    })
  }, [historyLogs, slotSignature])

  // ── Suggestions de charge Premium par exercice (garde-fous KB) ───────────
  const loadSuggestionByExoId = useMemo(() => {
    const empty = new Map<string, never>()
    if (!isPremium || !activeSlot || !surface) return empty
    const exercises: { exerciseId: string; prescription: string }[] = []
    for (const block of activeSlot.session.blocks) {
      for (const exercise of block.exercises) {
        if (!exercise || isDirectiveText(exercise.name)) continue
        const exerciseId = resolveExerciseIdForSessionRun(exercise.name, exercise.exerciseId)
        if (!exerciseId) continue
        exercises.push({ exerciseId, prescription: exercise.prescription })
      }
    }
    const fatigueLevel = resolveFatigueLevel(fatigue, acwrZone)
    return buildSessionLoadSuggestions({
      allSetLogs: historyLogs,
      exercises,
      currentSlotSignature: slotSignature,
      week,
      acwr: null, // ratio brut non disponible ici, l'override ACWR>1.3 transite via fatigueLevel
      fatigueLevel,
      trainingLevel: profile.trainingLevel ?? 'performance',
      daysToMatch: surface.planningContext.daysUntilNextMatch ?? null,
      weightKg: profile.weightKg,
      isBodyweightProgram: isBodyweightProgramTier(profile.equipment),
    })
  }, [
    isPremium,
    activeSlot,
    surface,
    historyLogs,
    slotSignature,
    week,
    acwrZone,
    fatigue,
    profile.trainingLevel,
    profile.weightKg,
    profile.equipment,
  ])

  const getLoadSuggestion = useCallback(
    (exerciseId: string) => loadSuggestionByExoId.get(exerciseId),
    [loadSuggestionByExoId],
  )

  const previousSessionSetMap = useMemo(() => {
    if (!slotSignature || !activeSlot) return new Map<string, PreviousSessionSetRef>()
    const exerciseIds = new Set<string>()
    let maxTours = 1
    for (const block of activeSlot.session.blocks) {
      maxTours = Math.max(maxTours, parseBlockTourCount(block))
      for (const exercise of block.exercises) {
        if (!exercise || isDirectiveText(exercise.name)) continue
        const exerciseId = resolveExerciseIdForSessionRun(exercise.name, exercise.exerciseId)
        if (exerciseId) exerciseIds.add(exerciseId)
      }
    }
    return buildPreviousSessionSetMap({
      allSetLogs: historyLogs,
      currentSlotSignature: slotSignature,
      exerciseIds: Array.from(exerciseIds),
      tourCount: maxTours,
    })
  }, [slotSignature, activeSlot, historyLogs])

  const getPreviousSessionSet = useCallback(
    (exerciseId: string, tourIndex: number): PreviousSessionSetRef | undefined =>
      previousSessionSetMap.get(previousSessionSetKey(exerciseId, tourIndex)),
    [previousSessionSetMap],
  )

  const handleLiveSetValidated = useCallback(
    (payload: {
      exerciseId: string
      loadKg?: number
      reps?: number
      blockNumber: number
      tourIndex: number
      exerciseIndex: number
    }) => {
      if (!slotSignature || !isPremium) return
      const metricType = getExerciseMetricType({ exerciseId: payload.exerciseId })
      const priorSessionDrafts = collectPriorSessionDrafts(
        sessionRun.exerciseTourLoads,
        payload.blockNumber,
        payload.tourIndex,
        payload.exerciseIndex,
        buildExerciseTourKey,
      )
      const pr = detectLiveSetPR({
        setLogs: historyLogs,
        exerciseId: payload.exerciseId,
        metricType,
        draft: { loadKg: payload.loadKg, reps: payload.reps },
        validatingSet: {
          slotSignature,
          blockNumber: payload.blockNumber,
          tourIndex: payload.tourIndex,
        },
        priorSessionDrafts,
      })
      if (!pr) return
      const beatsPriorSessions = historyLogs.some(
        (s) =>
          s.exerciseId === payload.exerciseId &&
          s.slotSignature !== slotSignature &&
          (s.loadKg != null || s.reps != null),
      )
      setLivePRToast(buildLivePRToastData(pr, lang, { beatsPriorSessions }))
      posthog.capture('session_live_pr', {
        exerciseId: payload.exerciseId,
        metricType,
      })
    },
    [slotSignature, isPremium, historyLogs, lang, sessionRun.exerciseTourLoads],
  )

  const showBodyweightMorphoWarning = useMemo(
    () => isPremium && bodyweightProgramMissingMorphology(profile),
    [isPremium, profile],
  )

  // ── Autosave par bloc ─────────────────────────────────────────────────────
  const handleBlockCompleted = useCallback(
    (blockNumber: number, snapshot?: BlockCompletionSnapshot) => {
      if (!slotSignature || !adaptedSession || !surface) return
      const block = adaptedSession.blocks.find((b) => b.number === blockNumber)
      if (!block) return
      const weekLabel = surface.planningContext.weekLabel ?? 'unknown'
      const motherSessionId = adaptedSession.metadata.id

      const upserts = collectBlockSetUpserts({
        block,
        blockNumber,
        exerciseTourLoads: snapshot?.exerciseTourLoads ?? sessionRun.exerciseTourLoads,
        completedExercises: snapshot?.completedExercises ?? sessionRun.completedExercises,
      })

      for (const row of upserts) {
        void upsertSet({
          slotSignature,
          motherSessionId,
          weekLabel,
          sessionIndex: index,
          blockNumber: row.blockNumber,
          exerciseId: row.exerciseId,
          tourIndex: row.tourIndex,
          loadKg: row.loadKg,
          reps: row.reps,
        })
      }
    },
    [
      slotSignature,
      adaptedSession,
      surface,
      sessionRun.exerciseTourLoads,
      sessionRun.completedExercises,
      upsertSet,
      index,
    ],
  )

  // (Suggestion de charge Premium retirée temporairement — sera ré-introduite
  //  via `getLoadSuggestion` passé à SessionBlocks. Le service
  //  `loadSuggestion` reste disponible.)

  // ── Phase visuelle dérivée ─────────────────────────────────────────────────
  const phase: 'idle' | 'running' | 'completed' = celebrationOpen
    ? 'completed'
    : isRunning
      ? 'running'
      : 'idle'

  // ── Sticky CTA contextuel running (D6) ────────────────────────────────────
  // Calcule la prochaine série à valider via `findCurrentPending`.
  // Hook placé AVANT l'early return `hasHardBlock`.
  const runningCursor = useMemo(() => {
    if (phase !== 'running' || !adaptedSession) return null
    return findCurrentPending(adaptedSession, sessionRun.completedExercises)
  }, [phase, adaptedSession, sessionRun.completedExercises])

  // ── Auto-ouverture de la sheet de fin à la transition phase=completed ────
  // Évite l'étape phantom "Voir le récap" : dès que la séance est bouclée,
  // la sheet s'ouvre toute seule. On utilise un ref pour ne déclencher qu'une
  // fois par cycle de séance, et seulement tant que la séance n'a pas été
  // enregistrée. Si l'utilisateur ferme la sheet (X / swipe-down), un FAB
  // discret en bas-droite reste accessible pour la rouvrir.
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (phase === 'completed' && !msSaved && !autoOpenedRef.current) {
      autoOpenedRef.current = true
      setCompletionOpen(true)
    }
    if (phase !== 'completed') {
      autoOpenedRef.current = false
    }
  }, [phase, msSaved])

  // Auto-scroll vers la série courante à chaque changement de cursor.
  useEffect(() => {
    if (!runningCursor) return
    const id = `set-${runningCursor.blockNumber}-${runningCursor.tourIndex}-${runningCursor.exerciseIndex}`
    if (typeof window === 'undefined') return
    window.setTimeout(() => {
      const el = document.getElementById(id)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 80)
  }, [
    runningCursor?.blockNumber,
    runningCursor?.tourIndex,
    runningCursor?.exerciseIndex,
    runningCursor,
  ])

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
                  <br />
                  {BETA_ELIGIBILITY_MESSAGES[r].detail}
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

  // `MS_TYPE_TO_SESSION_TYPE` reste exporté pour les appels en aval (RPEModal/celebration).

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

  const handleMarkAsDone = () => {
    setMsSaved(false)
    setMsSaveError(null)
    setCompletionOpen(true)
  }

  // ── Handlers overlays D5 ─────────────────────────────────────────────────

  const handleStartEmomTimer = (blockNumber: number) => {
    setEmomBlockNumber(blockNumber)
  }

  const handleEmomComplete = () => {
    if (emomBlockNumber == null) return
    // Marque tous les exos loggables du bloc EMOM comme validés (le chrono pilote
    // un bloc entier — pas d'agrégation set-par-set).
    if (adaptedSession) {
      const block = adaptedSession.blocks.find((b) => b.number === emomBlockNumber)
      if (block) {
        block.exercises.forEach((exo, exerciseIndex) => {
          if (!exo.exerciseId && !exo.name) return
          const key = buildExerciseTourKey(emomBlockNumber, 0, exerciseIndex)
          sessionRun.markExerciseDone(key)
        })
        handleBlockCompleted(emomBlockNumber)
      }
    }
    setEmomBlockNumber(null)
  }

  // B3 — démo depuis le bouton œil (ToursBlock + WarmupBlock + Emom/Prehab, bloc #0).
  // Même résolution que le moteur de séance (`resolveExerciseIdForSessionRun`).
  const handlePlayDemo = (blockNumber: number, exerciseIndex: number) => {
    if (!adaptedSession) return
    const exercise =
      blockNumber === 0
        ? adaptedSession.warmUp.exercises[exerciseIndex]
        : adaptedSession.blocks.find((b) => b.number === blockNumber)?.exercises[exerciseIndex]
    if (!exercise) return
    const rawExerciseId =
      'exerciseId' in exercise ? (exercise as { exerciseId?: string }).exerciseId : undefined
    const exoId = resolveExerciseIdForSessionRun(exercise.name ?? '', rawExerciseId)
    if (!exoId || !hasExerciseDemo(exoId)) return
    setDemoExerciseId(exoId)
  }

  const handleStartIsoTimer = (
    blockNumber: number,
    tourIndex: number,
    exerciseIndex: number,
  ) => {
    if (!adaptedSession) return
    const block = adaptedSession.blocks.find((b) => b.number === blockNumber)
    const exo = block?.exercises[exerciseIndex]
    if (!exo) return
    const spec = parseExerciseSetSpec(exo.prescription)
    if (spec.kind !== 'time') return
    setIsoTrigger({
      blockNumber,
      tourIndex,
      exerciseIndex,
      overlayState: {
        exerciseName: exo.name,
        parentLabel: block?.name,
        durationLow: spec.durationLow,
        durationHigh: spec.durationHigh,
        perSide: spec.perSide,
        perDirection: spec.perDirection,
      },
    })
  }

  const handleIsoComplete = () => {
    if (!isoTrigger || !adaptedSession) return
    const { blockNumber, tourIndex, exerciseIndex } = isoTrigger
    const key = buildExerciseTourKey(blockNumber, tourIndex, exerciseIndex)
    if (sessionRun.restTimer) sessionRun.skipRestTimer()
    sessionRun.markExerciseDone(key)

    const rest = getRestAfterExerciseSet(
      adaptedSession,
      blockNumber,
      tourIndex,
      exerciseIndex,
    )
    if (rest) {
      const exo = adaptedSession.blocks
        .find((b) => b.number === blockNumber)
        ?.exercises[exerciseIndex]
      sessionRun.startRestTimer(
        rest.restSeconds,
        restTimerAfterSetLine({
          kind: rest.kind,
          tourOneBased: rest.tourOneBased,
          exerciseName: exo?.name,
          lang,
        }),
      )
    }

    setIsoTrigger(null)
  }

  const handleConfirmMotherSession = async (payload: {
    fatigue: 'OK' | 'FATIGUE'
    rpe: number
    durationMin: number
    notes?: string
  }) => {
    if (!surface || !activeSlot) return

    setIsSavingSession(true)
    setMsSaveError(null)

    if (payload.notes != null) setMsNotes(payload.notes)

    try {
      setFatigue(payload.fatigue)
      const noteText = (payload.notes != null ? payload.notes : msNotes).trim() || undefined

      if (adaptedSession && slotSignature) {
        await flushSessionExerciseSets({
          session: adaptedSession,
          slotSignature,
          motherSessionId: adaptedSession.metadata.id,
          weekLabel: surface.planningContext.weekLabel ?? 'unknown',
          sessionIndex: index,
          exerciseTourLoads: sessionRun.exerciseTourLoads,
          completedExercises: sessionRun.completedExercises,
          upsertSet,
        })
      }

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
      if (savedLog?.id && slotSignature) {
        await linkToSessionLog(slotSignature, savedLog.id)
      }

      // Snapshot avant stop() — stop vide exerciseTourLoads / completedExercises.
      const loadsSnapshot = { ...sessionRun.exerciseTourLoads }
      const completedSnapshot = new Set(sessionRun.completedExercises)
      const sessionIdForShare = activeSlot.session.metadata.id

      setCompletionOpen(false)
      setCelebrationOpen(false)
      setMsNotes('')
      setMsSaved(true)
      sessionRun.stop()

      const sessionLabel = formatTitleFromMotherSessionId(sessionIdForShare, lang)
      const intent = buildSessionShareIntent(sessionIdForShare, lang)
      const exerciseMaxLoads =
        isPremium && adaptedSession
          ? collectSessionExerciseMaxLoads({
              session: adaptedSession,
              exerciseTourLoads: loadsSnapshot,
              completedExercises: completedSnapshot,
              resolveName: (exerciseId) => getExerciseName(exerciseId, lang) || exerciseId,
              limit: 6,
            })
          : []

      const nextSharePayload: SessionSharePayload = {
        sessionLabel,
        durationMin: payload.durationMin,
        completedSets: celebrationStats.completedSets,
        totalSets: celebrationStats.totalSets,
        tonnageKg: isPremium ? celebrationStats.tonnageKg : null,
        rpe: payload.rpe,
        fatigue: payload.fatigue,
        prs: isPremium
          ? sessionPRs.slice(0, 3).map((pr) => ({
              exerciseName: getExerciseName(pr.exerciseId, lang) || pr.exerciseId,
              newBestKg: pr.newBest,
              previousBestKg: pr.previousBest,
            }))
          : [],
        lang,
        isPremium,
        exerciseMaxLoads,
        congratLine: intent.congratLine,
        purposeLine: intent.purposeLine,
      }
      setSharePayload(nextSharePayload)
      setShareOpen(true)
      posthog.capture('session_completed', {
        index,
        sessionId: sessionIdForShare,
        durationMin: payload.durationMin,
        rpe: payload.rpe,
        fatigue: payload.fatigue,
        prCount: sessionPRs.length,
        hasTonnage: celebrationStats.tonnageKg != null,
        isPremium,
      })
    } catch (error) {
      console.error('session_detail_complete_failed', error)
      setMsSaveError("La séance n'a pas pu être enregistrée. Réessaie dans quelques instants.")
    } finally {
      setIsSavingSession(false)
    }
  }

  // ── Title ────────────────────────────────────────────────────────────────
  const pageTitle = activeSlot
    ? formatTitleFromMotherSessionId(activeSlot.session.metadata.id, lang)
    : sessionPageTitle

  // (`adaptedSession` + `phase` + `runningCursor` + auto-scroll : déplacés au-dessus
  //  du early-return `hasHardBlock` pour respecter rules-of-hooks. Voir plus haut.)

  const elapsedLabel = (() => {
    if (!sessionRun.startedAt) return undefined
    const min = Math.max(0, Math.round((Date.now() - sessionRun.startedAt) / 60000))
    return `${min} MIN`
  })()

  const heroTags = activeSlot
    ? buildHeroTags({
        weekLabel: surface?.planningContext.weekLabel,
        targetDuration: activeSlot.session.metadata.targetDuration,
        trainingLevel: profile.trainingLevel,
        lang,
      })
    : []

  /**
   * Validate la série courante depuis le sticky CTA (même logique que ToursBlock :
   * prefill, PR live, repos, autosave incrémental).
   */
  const handleValidateFromStickyCTA = () => {
    if (!runningCursor || !adaptedSession || runningCursor.isTimedBlock) return

    const block = adaptedSession.blocks.find((b) => b.number === runningCursor.blockNumber)
    if (!block) return

    const loadPrefill = resolveExerciseSetValidatePrefill({
      block,
      blockNumber: runningCursor.blockNumber,
      tourIndex: runningCursor.tourIndex,
      exerciseIndex: runningCursor.exerciseIndex,
      exerciseTourLoads: sessionRun.exerciseTourLoads,
      premium: isPremium,
      getPreviousSessionSet,
      getLoadSuggestion,
    })

    validateExerciseSetFromBlock({
      session: adaptedSession,
      blockNumber: runningCursor.blockNumber,
      tourIndex: runningCursor.tourIndex,
      exerciseIndex: runningCursor.exerciseIndex,
      sessionRun,
      block,
      lang,
      onBlockCompleted: handleBlockCompleted,
      loadPrefill,
      onLiveSetValidated: handleLiveSetValidated,
    })
  }

  const handleStartTimedBlockFromStickyCTA = () => {
    if (!runningCursor?.isTimedBlock) return
    if (sessionRun.restTimer) sessionRun.skipRestTimer()
    if (emomBlockNumber === runningCursor.blockNumber) return
    handleStartEmomTimer(runningCursor.blockNumber)
  }

  const timedBlockStickyEyebrow = (blockName: string, format: string): string => {
    const fmt = parseBlockFormat(format)
    const name = localizeBlockName(blockName, lang)
    if (fmt.type === 'emom') return `${name} · EMOM`
    if (fmt.type === 'tabata') return `${name} · Tabata`
    if (fmt.type === 'amrap') return `${name} · AMRAP`
    return `${name} · Chrono`
  }

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-64 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title={pageTitle}
        backTo="/week"
        suppressProfileLink={phase === 'running'}
        right={
          phase === 'running' ? (
            <button
              type="button"
              onClick={handleQuitRunningSession}
              className="p-2 -mr-1 rounded-xl transition-colors hover:bg-white/20 text-shell-text-muted hover:text-shell-text rf-focus-ring"
              aria-label={tr('session_quit_workout_aria', lang)}
            >
              <X className="w-5 h-5" strokeWidth={2.25} aria-hidden />
            </button>
          ) : undefined
        }
      />

      {phase === 'running' && (
        <div className="bg-brand text-app px-[18px] py-3.5">
          <div className="max-w-md mx-auto">
            <SessionRunProgressBar
              currentBlockIdx={Math.max(0, runProgress.activeBlockIndex - 1)}
              totalBlocks={runProgress.totalBlocks}
              label={
                runProgress.activeBlockName
                  ? `${runProgress.activeBlockName}${
                      runProgress.activeTourIndex && runProgress.activeBlockTourCount
                        ? ` · ${runProgress.activeBlockUnitLabel} ${runProgress.activeTourIndex}/${runProgress.activeBlockTourCount}`
                        : ''
                    }`
                  : undefined
              }
              elapsedLabel={elapsedLabel}
            />
          </div>
        </div>
      )}

      {phase === 'idle' && activeSlot && (
        <div className="max-w-md mx-auto pt-5 pb-3 space-y-3 px-[18px]">
          {showBodyweightMorphoWarning ? (
            <BodyweightMorphologyBanner lang={lang} compact />
          ) : null}
          <HeroIdle
            eyebrow={`Séance du jour · ${formatShortDateUpper(today)}`}
            title={pageTitle}
            tags={heroTags}
          />
        </div>
      )}

      {/* HeroCompleted retiré : le récap "Séance bouclée" + stats est désormais
          intégré directement dans la SessionFinishedSheet pour n'avoir qu'une
          seule étape de récap (le sticky CTA "Voir le récap" ouvre la sheet
          enrichie). Évite la double-page récap avant la saisie RPE. */}

      <main className="px-4 pt-4 pb-3 space-y-4 max-w-md mx-auto relative">
        {isUnavailable && (
          <section className="rounded-[24px] border border-warn-bd bg-warn-bg-muted p-5 space-y-3">
            <p className="text-sm font-bold text-warn">Séance introuvable</p>
            <p className="text-xs text-fg-soft">
              Le plan annuel n'a pas pu être résolu pour cette semaine. Vérifie ton profil ou
              réessaie après une mise à jour.
            </p>
            <Link to="/week" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              <ChevronLeft className="w-4 h-4" />
              Retour à ma semaine
            </Link>
          </section>
        )}

        {!isUnavailable && !activeSlot && (
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

        {!isUnavailable && activeSlot && phase === 'idle' && (
          <>
            {prehabs.length > 0 && (
              <div className="bg-paper-soft border border-paper-deep rounded-[20px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPrehabbOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rf-focus-ring"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-win-soft text-win">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div className="text-left">
                      <p className="text-[13px] font-extrabold text-fg">Échauffement ciblé</p>
                      <p className="text-[11px] text-fg-muted mt-0.5">
                        {prehabs.length} exercices ·{' '}
                        {profile.injuries.map((i) => CONTRA_LABELS[i]).join(', ')}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-fg-faint transition-transform flex-shrink-0 ${
                      prehabbOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {prehabbOpen && (
                  <div className="border-t border-paper-deep">
                    <div className="px-4 py-3 bg-win-soft border-b border-win/30">
                      <p className="text-[11px] text-win leading-relaxed">
                        À faire <strong>avant</strong> la séance principale (~10 min). Adapté à tes
                        zones sensibles.
                      </p>
                    </div>
                    <div className="divide-y divide-paper-deep">
                      {prehabs.map((ex) => (
                        <div key={ex.id} className="px-4 py-3 space-y-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold text-fg leading-snug">{ex.nameFr}</p>
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-paper-deep text-[10px] font-extrabold text-fg-soft">
                              {ex.sets}×{ex.reps}
                            </span>
                          </div>
                          <p className="text-xs text-fg-muted leading-snug">{ex.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blocs typés (Warmup/Tours/Emom/Prehab) — design éditorial v4-pro. */}
            {adaptedSession && (
              <div data-testid="mother-session-detail">
                <SessionBlocks
                  session={adaptedSession}
                  phase="idle"
                  isPremium={isPremium}
                  onBlockCompleted={handleBlockCompleted}
                  onStartEmomTimer={handleStartEmomTimer}
                  onStartIsoTimer={handleStartIsoTimer}
                  onPlayDemo={handlePlayDemo}
                  getLoadSuggestion={getLoadSuggestion}
                  getPreviousSessionSet={getPreviousSessionSet}
                  historyLogs={historyLogs}
                  slotSignature={slotSignature ?? undefined}
                  lang={lang}
                />
              </div>
            )}

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
        )}

        {/* Mode running : blocs typés pilotés par sessionRun + overlays timer. */}
        {!isUnavailable && activeSlot && phase === 'running' && adaptedSession && (
          <div data-testid="mother-session-detail">
            <SessionBlocks
              session={adaptedSession}
              phase="running"
              isPremium={isPremium}
              onBlockCompleted={handleBlockCompleted}
              onStartEmomTimer={handleStartEmomTimer}
              onStartIsoTimer={handleStartIsoTimer}
              onPlayDemo={handlePlayDemo}
              getLoadSuggestion={getLoadSuggestion}
              getPreviousSessionSet={getPreviousSessionSet}
              onLiveSetValidated={handleLiveSetValidated}
              activeEmomBlockNumber={emomBlockNumber}
              historyLogs={historyLogs}
              slotSignature={slotSignature ?? undefined}
              lang={lang}
            />
          </div>
        )}

        {/* Phase completed : la sheet s'auto-ouvre par-dessus, mais on garde
            les blocs validés visibles en arrière-plan (toutes les coches
            vertes — satisfaction visuelle + référence si l'utilisateur ferme
            la sheet). Évite l'écran blanc derrière la sheet. */}
        {!isUnavailable && activeSlot && phase === 'completed' && adaptedSession && (
          <div data-testid="mother-session-detail">
            <SessionBlocks
              session={adaptedSession}
              phase="completed"
              isPremium={isPremium}
              onPlayDemo={handlePlayDemo}
              lang={lang}
            />
          </div>
        )}
      </main>

      {/* Sticky CTA contextuel selon phase. */}
      {!isUnavailable && activeSlot && phase === 'idle' && (
        <div className="fixed left-0 right-0 z-40 bottom-0 max-w-md mx-auto">
          <SessionStickyCTA
            variant={{
              kind: 'start',
              onStart: handleStartSession,
              onMarkDone: handleMarkAsDone,
              premiumHint: !isPremium,
            }}
          />
        </div>
      )}

      {/* Overlays timer en mode running — lecture du sessionRun pour Rest,
          états locaux pour EMOM et Iso. Empilés au-dessus du sticky CTA. */}
      {!isUnavailable && activeSlot && phase === 'running' && (
        <div className="fixed left-0 right-0 z-40 bottom-[88px] max-w-md mx-auto">
          <RestOverlay />
          {emomBlockNumber != null && adaptedSession && (
            <EmomOverlay
              block={adaptedSession.blocks.find((b) => b.number === emomBlockNumber) ?? null}
              onComplete={handleEmomComplete}
              onClose={() => setEmomBlockNumber(null)}
              lang={lang}
            />
          )}
          <IsoOverlay
            state={isoTrigger?.overlayState ?? null}
            onComplete={handleIsoComplete}
            onClose={() => setIsoTrigger(null)}
            lang={lang}
          />
        </div>
      )}

      {/* Sticky CTA running contextuel (D6).
          - `validate-exo` tant que findCurrentPending retourne un cursor
          - `finish` quand toute la séance est validée → ouvre la célébration */}
      {!isUnavailable && activeSlot && phase === 'running' && (
        <div className="fixed left-0 right-0 z-30 bottom-0 max-w-md mx-auto">
          {runningCursor ? (
            runningCursor.isTimedBlock ? (
              <SessionStickyCTA
                variant={{
                  kind: 'validate-exo',
                  eyebrow: timedBlockStickyEyebrow(
                    runningCursor.blockName,
                    adaptedSession?.blocks.find((b) => b.number === runningCursor.blockNumber)?.format ?? '',
                  ),
                  label:
                    emomBlockNumber === runningCursor.blockNumber
                      ? tr('emom_chrono_active', lang)
                      : tr('emom_start_chrono', lang),
                  onValidate: handleStartTimedBlockFromStickyCTA,
                }}
              />
            ) : (
              <SessionStickyCTA
                variant={{
                  kind: 'validate-exo',
                  eyebrow: `${runningCursor.blockName} · Tour ${runningCursor.tourIndex + 1}`,
                  label: `Valider · ${localizeMotherSessionExerciseName(runningCursor.exerciseName, lang)}`,
                  onValidate: handleValidateFromStickyCTA,
                }}
              />
            )
          ) : (
            <SessionStickyCTA
              variant={{
                kind: 'finish',
                onFinish: () => {
                  setMsSaved(false)
                  setMsSaveError(null)
                  setCelebrationOpen(true)
                },
              }}
            />
          )}
        </div>
      )}

      {/* En phase=completed la sheet s'ouvre automatiquement (voir useEffect
          autoOpenedRef ci-dessus). Si l'utilisateur la ferme volontairement,
          ce FAB discret permet de la rouvrir sans réintroduire l'étape phantom
          "Voir le récap" précédente. */}
      {!isUnavailable && activeSlot && phase === 'completed' && !completionOpen && !msSaved && (
        <button
          type="button"
          onClick={() => setCompletionOpen(true)}
          data-testid="finish-reopen-fab"
          className="fixed bottom-6 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-[11px] font-extrabold uppercase italic tracking-wide text-on-brand shadow-lg shadow-brand-glow rf-focus-ring"
        >
          <CheckCircle2 className="h-4 w-4" />
          Enregistrer
        </button>
      )}

      {/* Bottom sheet de finalisation : récap auto (durée chrono, sets,
          tonnage Premium, sRPE) + slider RPE + fatigue + insight contextuel.
          Remplace l'ancienne RPEModal qui demandait la durée à la main. */}
      <SessionFinishedSheet
        open={completionOpen}
        sessionLabel={pageTitle}
        durationMin={celebrationStats.durationMin}
        completedSets={celebrationStats.completedSets}
        totalSets={celebrationStats.totalSets}
        tonnageKg={celebrationStats.tonnageKg}
        prs={sessionPRs}
        isPremium={isPremium}
        initialFatigue={fatigue}
        isSubmitting={isSavingSession}
        onClose={() => {
          if (isSavingSession) return
          setCompletionOpen(false)
        }}
        onConfirm={handleConfirmMotherSession}
      />

      <SessionShareSheet
        open={shareOpen}
        payload={sharePayload}
        lang={lang}
        onContinue={() => {
          setShareOpen(false)
          navigate('/week')
        }}
      />

      {/* B3 — exercise demo sheet (bouton œil). Rendu à la racine pour overlay plein écran. */}
      <SessionPRToast
        data={livePRToast}
        onDismiss={() => setLivePRToast(null)}
        stackAboveRest={Boolean(livePRToast)}
      />
      <ExerciseDemoSheet
        exerciseId={demoExerciseId}
        lang={lang}
        onClose={() => setDemoExerciseId(null)}
      />
    </div>
  )
}

// (SessionBlockPreview retiré — Phase C garde MotherSessionView pour préserver
//  les adaptations niveau Fondations/Avancé. Les composants Warmup/Tours/Emom/
//  Prehab restent disponibles dans `src/components/session/blocks/` pour une
//  itération future avec adaptations niveau câblées.)
