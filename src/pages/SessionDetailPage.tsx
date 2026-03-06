import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { posthog } from '../services/analytics/posthog'
import { ChevronLeft, ShieldCheck, ChevronDown } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR } from '../hooks/useACWR'
import { buildWeekProgram, validateSession } from '../services/program'
import { applyDeloadToSessions } from '../services/ui/applyDeload'
import { SessionView } from '../components/SessionView'
import { RPEModal } from '../components/modals/RPEModal'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { getPrehab, CONTRA_LABELS } from '../services/ui/getPrehab'
import type { SessionType } from '../types/training'

const getSessionType = (recipeId: string): SessionType => {
  if (recipeId === 'UPPER_V1' || recipeId === 'UPPER_HYPER_V1' || recipeId === 'UPPER_BUILDER_V1') return 'UPPER'
  if (recipeId === 'LOWER_V1' || recipeId === 'LOWER_HYPER_V1' || recipeId === 'LOWER_BUILDER_V1') return 'LOWER'
  if (recipeId === 'COND_OFF_V1' || recipeId === 'COND_PRE_V1') return 'CONDITIONING'
  return 'FULL'
}

export function SessionDetailPage() {
  const { sessionIndex } = useParams<{ sessionIndex: string }>()
  const index = Number(sessionIndex ?? '0')
  const { profile } = useProfile()
  const { week, lastNonDeloadWeek } = useWeek()
  const { fatigue } = useFatigue()
  const { addLog, logs } = useHistory()
  const { events } = useCalendar()
  const navigate = useNavigate()
  const [showRPE, setShowRPE] = useState(false)
  const [saved, setSaved] = useState(false)
  const [prehabbOpen, setPrehabbOpen] = useState(true)

  useEffect(() => { posthog.capture('session_viewed', { index }) }, [index])

  const isDeloadWeek = week === 'DELOAD'
  const effectiveWeek = isDeloadWeek ? lastNonDeloadWeek : week
  const { zone: acwrZone } = useACWR(logs, events)

  const builtProgram = buildWeekProgram(profile, effectiveWeek, {
    fatigueLevel: acwrZone ?? undefined,
  })
  const rawSessions = builtProgram.sessions
  const sessions = isDeloadWeek ? applyDeloadToSessions(rawSessions) : rawSessions

  const session = sessions[index] ?? null
  const validation = session ? validateSession(session) : null
  const sessionType = session ? getSessionType(session.recipeId) : 'UPPER'

  const sessionLabel =
    sessionType === 'UPPER' ? 'Haut du corps'
    : sessionType === 'LOWER' ? 'Bas du corps'
    : sessionType === 'CONDITIONING' ? 'Conditionnement'
    : 'Corps complet'

  const prehabs = getPrehab(profile.injuries)

  return (
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={session?.title ?? 'Séance'} backTo="/week" titleSuffix={week} />

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">


        {/* Session saved confirmation */}
        {saved && (
          <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-3">
            <p className="text-xs text-emerald-400 font-bold">Séance enregistrée ✓</p>
            <span className="text-[10px] text-emerald-400/70">Retour dans 2s…</span>
          </div>
        )}

        {/* Prehab — s'affiche si l'athlète a des inconforts déclarés */}
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
                  <p className="text-sm font-black text-white">Prehab — Prévention</p>
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
                    À faire <strong>avant</strong> la séance principale (~10 min). Ces exercices sont adaptés à tes inconforts déclarés.
                    <span className="opacity-70"> Pas un avis médical — consulte un professionnel si la douleur persiste.</span>
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

        {/* Session view */}
        {session ? (
          <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
            <SessionView
              session={session}
              availableEquipment={profile.equipment}
              sessionType={sessionType}
              viewMode="compact"
              isDeload={isDeloadWeek}
              isValid={validation?.isValid}
              onMarkComplete={() => setShowRPE(true)}
              statusLabel={validation?.isValid ? 'Valide' : 'À vérifier'}
            />
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-white/40">Séance introuvable.</p>
            <Link
              to="/week"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#ff6b35]"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour au plan semaine
            </Link>
          </div>
        )}

      </main>

      <RPEModal
        isOpen={showRPE}
        sessionLabel={sessionLabel}
        onClose={() => setShowRPE(false)}
        onConfirm={(rpe, durationMin) => {
          addLog({
            dateISO: new Date().toISOString(),
            week,
            sessionType,
            fatigue,
            rpe,
            durationMin,
          })
          setShowRPE(false)
          setSaved(true)
          setTimeout(() => navigate('/week'), 2000)
        }}
      />

      <BottomNav />
    </div>
  )
}
