// src/components/GymDaySelector.tsx

import type { ClubSchedule, DayOfWeek } from '../types/training'
import { getDayInfo } from '../services/program/scheduleOptimizer'

// Lun → Dim
const WEEK_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]
const LABELS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const LABELS_FULL  = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

interface Props {
  clubSchedule: ClubSchedule
  selectedDays: Set<DayOfWeek>
  weeklySessions: 2 | 3
  onChange: (days: Set<DayOfWeek>) => void
}

export function GymDaySelector({ clubSchedule, selectedDays, weeklySessions, onChange }: Props) {
  const toggle = (day: DayOfWeek) => {
    const next = new Set(selectedDays)
    if (next.has(day)) { next.delete(day) } else { next.add(day) }
    onChange(next)
  }

  // Alertes actives uniquement pour les jours autour du match
  const matchAlerts = Array.from(selectedDays)
    .map((d) => ({ day: d, info: getDayInfo(d, clubSchedule) }))
    .filter(({ info }) => info.risk === 'match' || info.risk === 'near_match' || info.risk === 'recovery')

  // Alerte séances trop rapprochées (< 2 jours d'intervalle)
  const sorted = [...selectedDays].sort((a, b) => a - b)
  const hasCloseSessions = sorted.some((d, i) => {
    if (i === 0) return false
    const gap = Math.min(Math.abs(d - sorted[i - 1]), 7 - Math.abs(d - sorted[i - 1]))
    return gap < 2
  })

  const count = selectedDays.size

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-white/40 uppercase tracking-wide">
          Jours de séances muscu
        </p>
        <span className={`text-xs font-bold tabular-nums ${count === weeklySessions ? 'text-[#ff6b35]' : 'text-white/40'}`}>
          {count}/{weeklySessions}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_DAYS.map((day) => {
          const info = getDayInfo(day, clubSchedule)
          const selected = selectedDays.has(day)

          // Styles selon sélection + risk (dark theme)
          let btnClass = ''
          if (selected) {
            if (info.risk === 'match') btnClass = 'bg-red-900/20 border-red-400/60 text-red-300'
            else if (info.risk === 'near_match') btnClass = 'bg-orange-900/20 border-orange-400/60 text-orange-300'
            else if (info.risk === 'recovery') btnClass = 'bg-amber-900/20 border-amber-400/60 text-amber-300'
            else if (info.risk === 'club') btnClass = 'bg-violet-900/20 border-violet-400/60 text-violet-300'
            else btnClass = 'bg-[#ff6b35]/10 border-[#ff6b35] text-[#ff6b35]'
          } else {
            if (info.risk === 'match') btnClass = 'bg-white/5 border-red-900/40 text-white/50 hover:border-red-500/40'
            else if (info.risk === 'near_match') btnClass = 'bg-white/5 border-orange-900/40 text-white/50 hover:border-orange-500/40'
            else if (info.risk === 'club') btnClass = 'bg-white/5 border-violet-900/40 text-white/50 hover:border-violet-500/40'
            else btnClass = 'bg-white/5 border-white/10 text-white/60 hover:border-white/25'
          }

          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={`relative flex flex-col items-center justify-center py-2.5 rounded-2xl border-2 text-xs font-black transition-all ${btnClass}`}
            >
              <span>{LABELS_SHORT[day]}</span>
              <span className="text-[8px] font-bold mt-0.5 opacity-70">{LABELS_FULL[day]}</span>

              {/* Badge informatif sous le bouton */}
              {info.risk === 'club' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black bg-violet-900/60 text-violet-300 px-1 py-px rounded-full whitespace-nowrap leading-tight">
                  club
                </span>
              )}
              {info.risk === 'match' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black bg-red-900/60 text-red-300 px-1 py-px rounded-full whitespace-nowrap leading-tight">
                  match
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Alertes match uniquement — concises */}
      {matchAlerts.length > 0 && (
        <div className="space-y-1.5 mt-1">
          {matchAlerts.map(({ day, info }) => (
            <div
              key={day}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                info.risk === 'match'
                  ? 'bg-red-900/20 text-red-300 border border-red-500/20'
                  : info.risk === 'near_match'
                    ? 'bg-orange-900/20 text-orange-300 border border-orange-500/20'
                    : 'bg-amber-900/20 text-amber-300 border border-amber-500/20'
              }`}
            >
              <span className="font-black">{LABELS_FULL[day]} —</span>
              <span>{info.reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alerte séances trop rapprochées */}
      {hasCloseSessions && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-900/20 border border-amber-500/20 text-xs text-amber-300">
          <span className="font-black">⚠</span>
          <span>Deux séances consécutives — laisse au moins 1 jour de récup entre chaque.</span>
        </div>
      )}

      {count < weeklySessions && (
        <p className="text-xs text-white/40 text-center">
          {weeklySessions - count} jour{weeklySessions - count > 1 ? 's' : ''} restant{weeklySessions - count > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
