import { useEffect, useRef } from 'react'
import { X, Activity, Dumbbell, TrendingUp } from 'lucide-react'
import type { AthleteStaffWeeklyView } from '../../types/staffPlanning'
import { AthleteWeeklyCard } from './AthleteWeeklyCard'
import { StaffAthleteAvatar } from './StaffAthleteAvatar'
import type { StaffRosterTheme } from './StaffRosterTable'

export interface StaffAthleteDetailDrawerProps {
  open: boolean
  athlete: AthleteStaffWeeklyView | null
  displayName?: string
  onClose: () => void
  theme?: StaffRosterTheme
}

export function StaffAthleteDetailDrawer({
  open,
  athlete,
  displayName,
  onClose,
  theme = 'app',
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

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !athlete) return null

  const isDark = theme === 'dark'
  const name = displayName ?? athlete.displayName ?? athlete.identity.athleteId ?? 'Athlète'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-stretch sm:justify-end" role="presentation">
      <button
        type="button"
        aria-label="Fermer la fiche joueur"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className={`relative z-10 flex w-full flex-col shadow-2xl sm:max-w-lg sm:border-l ${
          isDark
            ? "font-['Lexend'] bg-[#0b0e14] text-white border-[#1c2028]"
            : 'bg-app text-fg border-brand-border'
        } max-h-[min(92dvh,100dvh)] sm:max-h-[100dvh] rounded-t-2xl sm:rounded-none`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-athlete-drawer-title"
        data-testid="staff-athlete-drawer"
      >
        {/* Handle mobile */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className={`h-1 w-10 rounded-full ${isDark ? 'bg-white/20' : 'bg-fg-muted/30'}`} />
        </div>

        {/* Header */}
        <div
          className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-4 sm:px-6 ${
            isDark ? 'border-[#1c2028]' : 'border-brand-border'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <StaffAthleteAvatar
              name={name}
              avatarUrl={athlete.avatarUrl}
              size="md"
              theme={theme}
            />
            <div className="min-w-0">
              <h2
                id="staff-athlete-drawer-title"
                className={`m-0 truncate text-lg font-bold leading-tight ${
                  isDark ? 'uppercase tracking-tight text-white' : 'text-fg'
                }`}
              >
                {name}
              </h2>
              <p
                className={`m-0 mt-0.5 truncate text-xs ${
                  isDark ? 'font-bold uppercase tracking-widest text-[#ff6b35]' : 'text-fg-muted font-mono'
                }`}
              >
                {athlete.identity.athleteId}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={`shrink-0 rounded-lg p-2 transition-colors ${
              isDark
                ? 'text-slate-500 hover:bg-white/10 hover:text-white'
                : 'text-fg-muted hover:bg-layer-10 hover:text-fg'
            }`}
            data-testid="staff-athlete-drawer-close"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-8 sm:px-6 sm:py-6 sm:pb-10 space-y-5">
          <AthleteWeeklyCard athlete={athlete} displayName={displayName} theme={theme} />

          <section
            className={`overflow-hidden rounded-xl border ${
              isDark ? 'border-white/[0.06] bg-[#1c2028]/40' : 'border-brand-border bg-layer-5'
            }`}
            aria-label="Données performance"
          >
            <div
              className={`flex items-center gap-2 border-b px-4 py-3 ${
                isDark ? 'border-white/[0.04]' : 'border-brand-border'
              }`}
            >
              <TrendingUp className={`h-4 w-4 ${isDark ? 'text-[#ff6b35]' : 'text-brand'}`} />
              <h3
                className={`m-0 text-xs font-bold uppercase tracking-widest ${
                  isDark ? 'text-white' : 'text-fg'
                }`}
              >
                Perf & Historique
              </h3>
            </div>
            <div className="space-y-2 p-4">
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                  isDark ? 'bg-[#0b0e14]' : 'bg-layer-10'
                }`}
              >
                <Dumbbell className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-fg-muted'}`} />
                <div>
                  <dt className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-fg-muted'}`}>
                    Dernières séances
                  </dt>
                  <dd className={`m-0 mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-fg-muted'}`}>
                    Non disponible (Staff V1)
                  </dd>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                  isDark ? 'bg-[#0b0e14]' : 'bg-layer-10'
                }`}
              >
                <Activity className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-fg-muted'}`} />
                <div>
                  <dt className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-fg-muted'}`}>
                    Records estimés
                  </dt>
                  <dd className={`m-0 mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-fg-muted'}`}>
                    Squat · Bench · —
                  </dd>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
