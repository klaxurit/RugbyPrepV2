import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { posthog } from '../services/analytics/posthog'
import { ChevronLeft, ShieldCheck, ChevronDown, CheckCircle2, FileText } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR } from '../hooks/useACWR'
import { useAcwrOverride } from '../hooks/useAcwrOverride'
import { useProgramFeatureFlags } from '../hooks/useProgramFeatureFlags'
import { useWeeklyProgramSurface } from '../hooks/useWeeklyProgramSurface'
import { useBlockLogs } from '../hooks/useBlockLogs'
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
    .replace(/\boff_season\b/gi, 'Hors-saison')
    .replace(/\bpre_season\b/gi, 'Pré-saison')
    .replace(/\bin_season\b/gi, 'En saison')
}

export function SessionDetailPage() {
  const { sessionIndex } = useParams<{ sessionIndex: string }>()
  const index = Number(sessionIndex ?? '0')
  const { profile } = useProfile()
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'
  const sessionPageTitle = lang === 'fr' ? 'Séance' : 'Session'
  const { week, lastNonDeloadWeek } = useWeek()
  const { fatigue, setFatigue } = useFatigue()
  const { addLog, logs } = useHistory()
  const { events } = useCalendar()
  const navigate = useNavigate()
  const { addBlockLog, getLastEntryForExercise, getBestForExercise } = useBlockLogs()
  const { isPremium } = useFeatureAccess()
  const [prehabbOpen, setPrehabbOpen] = useState(true)
  const [msNotes, setMsNotes] = useState('')
  const [msSaved, setMsSaved] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)
  const [msSaveError, setMsSaveError] = useState<string | null>(null)
  const [isSavingSession, setIsSavingSession] = useState(false)
  const handleSaveBlock = (log: Parameters<typeof addBlockLog>[0]) => { addBlockLog(log) }

  useEffect(() => { posthog.capture('session_viewed', { index }) }, [index])

  const { acwr, zone: acwrZone, hasSufficientData: acwrHasData } = useACWR(logs, events)
  const { ignoreAcwrOverload } = useAcwrOverride()
  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()

  // ── Surface unifiée ────────────────────────────────────────────────────────
  const today = useMemo(() => getToday(), [])
  const surfaceParams = useMemo(() => ({
    profile,
    events,
    logs,
    today,
    fatigue,
    acwrZone: acwrHasData ? acwrZone : null,
    week,
    lastNonDeloadWeek,
    ignoreAcwrOverload,
    hasSufficientACWRData: acwrHasData,
    featureFlags: programFeatureFlags,
  }), [profile, events, logs, today, fatigue, acwrHasData, acwrZone, week, lastNonDeloadWeek, ignoreAcwrOverload, programFeatureFlags])
  const { surface } = useWeeklyProgramSurface(surfaceParams)

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

  if (hasHardBlock) {
    return (
      <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24">
        <PageHeader title={sessionPageTitle} backTo="/week" />
        <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <p className="font-bold text-amber-400">Programme temporairement indisponible</p>
            <ul className="space-y-2">
              {hardBlockReasons.map((r) => (
                <li key={r} className="text-sm text-amber-300/80">
                  <span className="font-semibold">{BETA_ELIGIBILITY_MESSAGES[r].reason}</span>
                  <br />{BETA_ELIGIBILITY_MESSAGES[r].detail}
                </li>
              ))}
            </ul>
            <p className="text-xs text-white/40">
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

  // ── Mother-session path ──────────────────────────────────────────────────
  const msResolution = surface?.motherSession ?? null
  const msSessions = msResolution?.sessions ?? []
  const activeSlot = msSessions[index] ?? null

  const msSessionType = activeSlot?.session.metadata.sessionType
    ? MS_TYPE_TO_SESSION_TYPE[activeSlot.session.metadata.sessionType]
    : undefined

  const prehabs = getPrehab(profile.injuries)

  // ── Title ────────────────────────────────────────────────────────────────
  const pageTitle = activeSlot
    ? formatTitleFromMotherSessionId(activeSlot.session.metadata.id, lang)
    : sessionPageTitle
  const pageSuffix = localizeWeekLabel(surface?.planningContext.weekLabel ?? week, lang)

  const handleConfirmMotherSession = async (payload: {
    fatigue: 'OK' | 'FATIGUE'
    rpe: number
    durationMin: number
  }) => {
    if (!surface || !activeSlot) return

    setIsSavingSession(true)
    setMsSaveError(null)

    try {
      setFatigue(payload.fatigue)
      const log = buildMotherSessionProgramSessionLog({
        dateISO: new Date().toISOString(),
        fatigue: payload.fatigue,
        notes: msNotes.trim() || undefined,
        rpe: payload.rpe,
        durationMin: payload.durationMin,
        slot: activeSlot,
        planningContext: surface.planningContext,
      })

      await addLog(log)
      setCompletionOpen(false)
      setMsNotes('')
      setMsSaved(true)
      window.setTimeout(() => navigate('/week'), 1200)
    } catch (error) {
      console.error('session_detail_complete_failed', error)
      setMsSaveError("La séance n'a pas pu être enregistrée. Réessaie dans quelques instants.")
    } finally {
      setIsSavingSession(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={pageTitle} backTo="/week" titleSuffix={pageSuffix} />

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">

        {/* ═══════════════════════════════════════════════════════════════════
            UNAVAILABLE — plan annuel non résolu
           ═══════════════════════════════════════════════════════════════════ */}
        {isUnavailable && (
          <section className="rounded-[24px] border border-amber-500/25 bg-amber-900/10 p-5 space-y-3">
            <p className="text-sm font-bold text-amber-300">Séance introuvable</p>
            <p className="text-xs text-white/50">
              Le plan annuel n'a pas pu être résolu pour cette semaine. Vérifie ton profil ou réessaie après une mise à jour.
            </p>
            <Link
              to="/week"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#ff6b35]"
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
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPrehabbOpen((o) => !o)}
                      className="w-full flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-900/20 text-emerald-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-white">Échauffement ciblé</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            {prehabs.length} exercices · {profile.injuries.map(i => CONTRA_LABELS[i]).join(', ')}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-white/30 transition-transform flex-shrink-0 ${prehabbOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {prehabbOpen && (
                      <div className="border-t border-white/10">
                        <div className="px-5 py-3 bg-emerald-900/20 border-b border-emerald-500/20">
                          <p className="text-[11px] text-emerald-400 leading-relaxed">
                            À faire <strong>avant</strong> la séance principale (~10 min). Ces exercices sont adaptés à tes zones sensibles.
                            <span className="opacity-70"> En cas de douleur persistante, consulte un professionnel.</span>
                          </p>
                        </div>
                        <div className="divide-y divide-white/5">
                          {prehabs.map((ex) => (
                            <div key={ex.id} className="px-5 py-4 space-y-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-bold text-white leading-snug">{ex.nameFr}</p>
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-black text-white/50">
                                  {ex.sets}×{ex.reps}
                                </span>
                              </div>
                              <p className="text-xs text-white/40 leading-snug">{ex.notes}</p>
                              {ex.equipment.length > 0 && (
                                <p className="text-[10px] text-white/25 font-medium">
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

                {/* Complétion mother-session */}
                <section
                  className="bg-white/5 border border-white/10 rounded-[2rem] p-5 space-y-4"
                  data-testid="ms-completion-section"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-[#ff6b35]/20 text-[#ff6b35]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-black text-white">Séance terminée ?</h2>
                  </div>

                  <p className="text-xs text-white/50">
                    {formatTitleFromMotherSessionId(activeSlot.session.metadata.id, lang)}
                  </p>

                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={msNotes}
                      onChange={(e) => setMsNotes(e.target.value)}
                      rows={2}
                      placeholder="Comment s'est passée la séance ?"
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-[#ff6b35] transition-all [color-scheme:dark]"
                    />
                  </div>

                  <button
                    type="button"
                    data-testid="ms-complete-btn"
                    onClick={() => {
                      setMsSaved(false)
                      setMsSaveError(null)
                      setCompletionOpen(true)
                    }}
                    className="w-full py-4 rounded-2xl bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-black uppercase italic tracking-wide transition-all shadow-lg shadow-[#ff6b35]/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Marquer comme faite
                  </button>

                  {msSaveError && (
                    <div className="px-4 py-3 bg-rose-900/20 border border-rose-500/20 rounded-2xl">
                      <p className="text-xs text-rose-300 font-bold">{msSaveError}</p>
                    </div>
                  )}

                  {msSaved && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <p className="text-xs text-emerald-400 font-bold">Séance enregistrée !</p>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="p-8 text-center space-y-3" data-testid="session-not-found">
                <p className="text-sm text-white/40">Séance introuvable à cet index.</p>
                <Link
                  to="/week"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#ff6b35]"
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
      <BottomNav />
    </div>
  )
}
