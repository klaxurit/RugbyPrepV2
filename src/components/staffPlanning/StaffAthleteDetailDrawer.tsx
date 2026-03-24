import { useEffect, useRef } from 'react'
import { X, Activity, Dumbbell, TrendingUp } from 'lucide-react'
import type { AthleteStaffWeeklyView } from '../../types/staffPlanning'
import { AthleteWeeklyCard } from './AthleteWeeklyCard'

const ORANGE = '#ff6b35'
const BG = '#0b0e14'
const SURFACE_HIGH = '#1c2028'

export interface StaffAthleteDetailDrawerProps {
  open: boolean
  athlete: AthleteStaffWeeklyView | null
  displayName?: string
  onClose: () => void
}

export function StaffAthleteDetailDrawer({
  open,
  athlete,
  displayName,
  onClose,
}: StaffAthleteDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !athlete) return null

  const name = displayName ?? athlete.identity.athleteId ?? 'Athlète'
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Fermer la fiche joueur"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className="relative z-10 flex h-full w-full max-w-lg flex-col border-l shadow-2xl font-['Lexend']"
        style={{ backgroundColor: BG, borderColor: `${SURFACE_HIGH}` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-athlete-drawer-title"
        data-testid="staff-athlete-drawer"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 border-b px-6 py-5"
          style={{ borderColor: `${SURFACE_HIGH}` }}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
              style={{ backgroundColor: SURFACE_HIGH }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h2
                id="staff-athlete-drawer-title"
                className="m-0 truncate text-lg font-black text-white uppercase tracking-tight"
              >
                {name}
              </h2>
              <p className="m-0 mt-0.5 truncate text-[10px] font-bold uppercase tracking-widest" style={{ color: ORANGE }}>
                {athlete.identity.athleteId}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            data-testid="staff-athlete-drawer-close"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <AthleteWeeklyCard athlete={athlete} displayName={displayName} />

          {/* Performance placeholder */}
          <section
            className="rounded-xl border border-white/[0.06] overflow-hidden"
            style={{ backgroundColor: `${SURFACE_HIGH}40` }}
            aria-label="Données performance"
          >
            <div
              className="px-5 py-4 border-b flex items-center gap-2"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: ORANGE }} />
              <h3 className="m-0 text-xs font-black text-white uppercase tracking-widest">
                Perf & Historique
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <div
                className="rounded-lg px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: `${BG}` }}
              >
                <Dumbbell className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dernières séances</dt>
                  <dd className="m-0 text-xs text-slate-400 mt-0.5">Non disponible (Staff V1)</dd>
                </div>
              </div>
              <div
                className="rounded-lg px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: `${BG}` }}
              >
                <Activity className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Records estimés</dt>
                  <dd className="m-0 text-xs text-slate-400 mt-0.5">Squat · Bench · —</dd>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
