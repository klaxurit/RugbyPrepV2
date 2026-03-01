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
    next.has(day) ? next.delete(day) : next.add(day)
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
        <p className="text-xs font-black text-slate-500 uppercase tracking-wide">
          Jours de séances muscu
        </p>
        <span className={`text-xs font-bold tabular-nums ${count === weeklySessions ? 'text-emerald-600' : 'text-slate-400'}`}>
          {count}/{weeklySessions}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_DAYS.map((day) => {
          const info = getDayInfo(day, clubSchedule)
          const selected = selectedDays.has(day)

          // Styles selon sélection + risk
          let btnClass = ''
          if (selected) {
            if (info.risk === 'match') btnClass = 'bg-red-50 border-red-400 text-red-800'
            else if (info.risk === 'near_match') btnClass = 'bg-orange-50 border-orange-400 text-orange-800'
            else if (info.risk === 'recovery') btnClass = 'bg-amber-50 border-amber-300 text-amber-800'
            else if (info.risk === 'club') btnClass = 'bg-violet-50 border-violet-400 text-violet-800'
            else btnClass = 'bg-rose-50 border-rose-500 text-rose-800'
          } else {
            if (info.risk === 'match') btnClass = 'bg-white border-red-100 text-slate-500 hover:border-red-200'
            else if (info.risk === 'near_match') btnClass = 'bg-white border-orange-100 text-slate-500 hover:border-orange-200'
            else if (info.risk === 'club') btnClass = 'bg-white border-violet-100 text-slate-500 hover:border-violet-200'
            else btnClass = 'bg-white border-gray-100 text-slate-600 hover:border-rose-300'
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
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black bg-violet-100 text-violet-600 px-1 py-px rounded-full whitespace-nowrap leading-tight">
                  club
                </span>
              )}
              {info.risk === 'match' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black bg-red-100 text-red-600 px-1 py-px rounded-full whitespace-nowrap leading-tight">
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
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : info.risk === 'near_match'
                    ? 'bg-orange-50 text-orange-700 border border-orange-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
          <span className="font-black">⚠</span>
          <span>Deux séances consécutives — laisse au moins 1 jour de récup entre chaque.</span>
        </div>
      )}

      {count < weeklySessions && (
        <p className="text-xs text-slate-400 text-center">
          {weeklySessions - count} jour{weeklySessions - count > 1 ? 's' : ''} restant{weeklySessions - count > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
