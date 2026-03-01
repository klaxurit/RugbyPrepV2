import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft, AlertTriangle, ShieldCheck, ChevronDown } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useViewMode } from '../hooks/useViewMode'
import { buildWeekProgram, validateSession } from '../services/program'
import { applyDeloadToSessions } from '../services/ui/applyDeload'
import { SessionView } from '../components/SessionView'
import { RPEModal } from '../components/modals/RPEModal'
import { BottomNav } from '../components/BottomNav'
import { getPrehab, CONTRA_LABELS } from '../services/ui/getPrehab'
import type { SessionType } from '../types/training'

const getSessionType = (recipeId: string): SessionType => {
  if (recipeId === 'UPPER_V1' || recipeId === 'UPPER_HYPER_V1' || recipeId === 'UPPER_BUILDER_V1') return 'UPPER'
  if (recipeId === 'LOWER_V1' || recipeId === 'LOWER_HYPER_V1' || recipeId === 'LOWER_BUILDER_V1') return 'LOWER'
  return 'FULL'
}

export function SessionDetailPage() {
  const { sessionIndex } = useParams<{ sessionIndex: string }>()
  const index = Number(sessionIndex ?? '0')
  const { profile } = useProfile()
  const { week, lastNonDeloadWeek } = useWeek()
  const { viewMode, setViewMode } = useViewMode()
  const { fatigue } = useFatigue()
  const { addLog } = useHistory()
  const navigate = useNavigate()
  const [showRPE, setShowRPE] = useState(false)
  const [saved, setSaved] = useState(false)
  const [prehabbOpen, setPrehabbOpen] = useState(true)

  const isDeloadWeek = week === 'DELOAD'
  const effectiveWeek = isDeloadWeek ? lastNonDeloadWeek : week
  const hasEquipment = profile.equipment.length > 0

  const builtProgram = hasEquipment ? buildWeekProgram(profile, effectiveWeek) : null
  const rawSessions = builtProgram?.sessions ?? []
  const sessions = isDeloadWeek ? applyDeloadToSessions(rawSessions) : rawSessions

  const session = sessions[index] ?? null
  const validation = session ? validateSession(session) : null
  const sessionType = session ? getSessionType(session.recipeId) : 'UPPER'

  const sessionLabel =
    sessionType === 'UPPER' ? 'Haut du corps'
    : sessionType === 'LOWER' ? 'Bas du corps'
    : 'Corps complet'

  const prehabs = getPrehab(profile.injuries)

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-24">

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/week" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              {session?.title ?? 'Séance'}
              <span className="ml-2 text-sm font-bold text-slate-400">{week}</span>
            </h1>
          </div>
        </div>
        <div className="flex gap-1.5">
          {(['compact', 'detail'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                viewMode === mode
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-gray-100 text-slate-500 hover:border-slate-300'
              }`}
            >
              {mode === 'compact' ? 'Compact' : 'Détail'}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto">

        {/* No equipment warning */}
        {!hasEquipment && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">
              Ajoute au moins un équipement dans ton{' '}
              <Link to="/profile" className="font-bold underline">profil</Link> pour générer la séance.
            </p>
          </div>
        )}

        {/* Session saved confirmation */}
        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3">
            <p className="text-xs text-emerald-700 font-bold">Séance enregistrée ✓</p>
            <span className="text-[10px] text-emerald-500">Retour dans 2s…</span>
          </div>
        )}

        {/* Prehab — s'affiche si l'athlète a des inconforts déclarés */}
        {prehabs.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setPrehabbOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900">Prehab — Prévention</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {prehabs.length} exercices · {profile.injuries.map(i => CONTRA_LABELS[i]).join(', ')}
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform flex-shrink-0 ${prehabbOpen ? 'rotate-180' : ''}`} />
            </button>

            {prehabbOpen && (
              <div className="border-t border-gray-50">
                <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    À faire <strong>avant</strong> la séance principale (~10 min). Ces exercices sont adaptés à tes inconforts déclarés.
                    <span className="text-emerald-600 opacity-70"> Pas un avis médical — consulte un professionnel si la douleur persiste.</span>
                  </p>
                </div>

                <div className="divide-y divide-gray-50">
                  {prehabs.map((ex) => (
                    <div key={ex.id} className="px-5 py-4 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900 leading-snug">{ex.nameFr}</p>
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                          {ex.sets}×{ex.reps}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">{ex.notes}</p>
                      {ex.equipment.length > 0 && (
                        <p className="text-[10px] text-slate-300 font-medium">
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
          <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
            <SessionView
              session={session}
              availableEquipment={profile.equipment}
              sessionType={sessionType}
              viewMode={viewMode}
              isDeload={isDeloadWeek}
              isValid={validation?.isValid}
              onMarkComplete={() => setShowRPE(true)}
              statusLabel={validation?.isValid ? 'Valide' : 'À vérifier'}
            />
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-slate-400">Séance introuvable.</p>
            <Link
              to="/week"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600"
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
