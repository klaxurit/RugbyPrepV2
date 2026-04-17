import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { posthog } from '../services/analytics/posthog'
import { ChevronLeft, ShieldCheck, ChevronDown, CheckCircle2, FileText, Play } from 'lucide-react'
import { useSessionRun } from '../contexts/SessionRunContext'
import { SessionRunProgress } from '../components/motherSession/SessionRunProgress'
import { RestTimerOverlay } from '../components/motherSession/RestTimerOverlay'
import { SessionCelebration } from '../components/motherSession/SessionCelebration'
import { isDirectiveText } from '../services/motherSession/motherSessionExerciseMap'
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

  if (hasHardBlock) {
    return (
      <div className="min-h-screen bg-app font-sans text-fg pb-24">
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

  // ── Session Run Mode ─────────────────────────────────────────────────────
  const sessionRunKey = activeSlot ? `${activeSlot.session.metadata.id}_${today}` : null
  const isRunning = sessionRunKey != null && sessionRun.isRunningFor(sessionRunKey)
  const totalExercises = useMemo(() => {
    if (!activeSlot) return 0
    return activeSlot.session.blocks.reduce(
      (sum, b) => sum + b.exercises.filter((e) => !isDirectiveText(e.name)).length,
      0,
    )
  }, [activeSlot])

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

  // Keep the screen awake while a session is running. Released on unmount / stop.
  useWakeLock(isRunning)

  // ── Stats for the celebration screen ─────────────────────────────────────
  const celebrationStats = useMemo(() => {
    const startedAt = sessionRun.startedAt
    const durationMin = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : 0
    let totalSets = 0
    let tonnageKg = 0
    let hasAnyLoad = false
    Object.values(sessionRun.perExerciseSets).forEach((sets) => {
      sets.forEach((s) => {
        if (s.done) {
          totalSets += 1
          if (s.loadKg != null && s.reps != null) {
            tonnageKg += s.loadKg * s.reps
            hasAnyLoad = true
          }
        }
      })
    })
    return {
      durationMin,
      totalSets,
      tonnageKg: hasAnyLoad ? Math.round(tonnageKg) : null,
    }
  }, [sessionRun.perExerciseSets, sessionRun.startedAt])

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
        slot: activeSlot,
        planningContext: surface.planningContext,
      })

      await addLog(log)
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
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={pageTitle} backTo="/week" titleSuffix={pageSuffix} />

      {isRunning && sessionRun.startedAt != null && (
        <SessionRunProgress
          totalExercises={totalExercises}
          completedExercises={sessionRun.completedExercises.size}
          startedAt={sessionRun.startedAt}
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
                    getLastEntryForExercise={getLastEntryForExercise}
                    getBestForExercise={getBestForExercise}
                    isPremium={isPremium}
                    acwr={acwrHasData ? acwr : null}
                    isRehabActive={false}
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

                {/* Complétion mother-session — bi-mode : Aperçu (Commencer) ou En cours (Terminer) */}
                <section
                  className="bg-layer-5 border border-border-app rounded-[2rem] p-5 space-y-4"
                  data-testid="ms-completion-section"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-brand-soft text-brand">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-black text-fg">
                      {isRunning ? 'Séance en cours' : 'Prêt à démarrer ?'}
                    </h2>
                  </div>

                  <p className="text-xs text-fg-soft">
                    {formatTitleFromMotherSessionId(activeSlot.session.metadata.id, lang)}
                  </p>

                  {isRunning && (
                    <div>
                      <label className="text-xs font-bold text-fg-muted uppercase tracking-wider block mb-2">
                        Notes (optionnel)
                      </label>
                      <textarea
                        value={msNotes}
                        onChange={(e) => setMsNotes(e.target.value)}
                        rows={2}
                        placeholder="Comment s'est passée la séance ?"
                        className="w-full px-4 py-3 rounded-2xl border border-border-app bg-layer-5 text-sm text-fg-secondary placeholder:text-fg-ghost resize-none rf-focus-ring transition-all"
                      />
                    </div>
                  )}

                  {!isRunning ? (
                    <div className="space-y-2">
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
                        className="w-full py-3 rounded-2xl border border-border-app text-fg-muted font-bold text-sm transition-colors hover:border-brand-border-strong hover:text-brand-tint"
                      >
                        Marquer comme faite (sans la lancer)
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid="ms-complete-btn"
                      onClick={() => {
                        setMsSaved(false)
                        setMsSaveError(null)
                        setCelebrationOpen(true)
                      }}
                      className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover text-on-brand font-black uppercase italic tracking-wide transition-all shadow-lg shadow-brand-float flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Terminer la séance
                    </button>
                  )}

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

                  {/* Unique CTA Premium — discret, en bas de l'aperçu séance uniquement. */}
                  {!isPremium && (
                    <Link
                      to="/profile#premium"
                      className="block mt-2 text-center text-[11px] font-bold text-fg-muted hover:text-brand-tint transition-colors"
                    >
                      Débloque le suivi de charge set-par-set — <span className="underline underline-offset-2">Découvrir Premium</span>
                    </Link>
                  )}
                </section>
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
      {isRunning && <RestTimerOverlay />}
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
