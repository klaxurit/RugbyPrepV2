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
  const count = selectedDays.size
  const atLimit = count >= weeklySessions

  const toggle = (day: DayOfWeek) => {
    const isSelected = selectedDays.has(day)
    // Hard-cap sur weeklySessions — l'user ne peut pas cocher plus que 2/3 jours.
    if (!isSelected && atLimit) return
    const next = new Set(selectedDays)
    if (isSelected) next.delete(day)
    else next.add(day)
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-fg-muted uppercase tracking-wide">
          Jours de séances muscu
        </p>
        <span className={`text-xs font-bold tabular-nums ${count === weeklySessions ? 'text-brand-tint' : 'text-fg-muted'}`}>
          {count}/{weeklySessions}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_DAYS.map((day) => {
          const info = getDayInfo(day, clubSchedule)
          const selected = selectedDays.has(day)
          const disabled = !selected && atLimit

          // Styles selon sélection + risk (semantic tokens, fonds opaques -strong pour contraste).
          let btnClass = ''
          if (selected) {
            if (info.risk === 'match') btnClass = 'bg-danger-bg-hover border-danger-bd text-danger'
            else if (info.risk === 'near_match') btnClass = 'bg-warn-bg-strong border-warn-bd-strong text-warn-strong'
            else if (info.risk === 'recovery') btnClass = 'bg-warn-bg-strong border-warn-bd-strong text-warn-strong'
            else if (info.risk === 'club') btnClass = 'bg-info-bg border-info-bd text-info'
            else btnClass = 'bg-brand-soft border-brand text-brand-tint'
          } else if (disabled) {
            btnClass = 'bg-layer-5 border-border-app text-fg-faint opacity-50 cursor-not-allowed'
          } else {
            if (info.risk === 'match') btnClass = 'bg-layer-5 border-danger-bd text-fg-muted hover:border-danger'
            else if (info.risk === 'near_match') btnClass = 'bg-layer-5 border-warn-bd text-fg-muted hover:border-warn'
            else if (info.risk === 'club') btnClass = 'bg-layer-5 border-info-bd text-fg-muted hover:border-info'
            else btnClass = 'bg-layer-5 border-border-app text-fg-muted hover:border-layer-20'
          }

          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              disabled={disabled}
              aria-disabled={disabled}
              className={`relative flex flex-col items-center justify-center py-2.5 rounded-2xl border-2 text-xs font-black transition-all ${btnClass}`}
            >
              <span>{LABELS_SHORT[day]}</span>
              <span className="text-[8px] font-bold mt-0.5 opacity-70">{LABELS_FULL[day]}</span>

              {/* Badge informatif sous le bouton — fonds opaques (les tokens -bg sont
                  en rgba 0.95-0.98 et laissent transparaître les contours de la card
                  derrière, ce qui donne un rendu gris/sale). */}
              {info.risk === 'club' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black bg-blue-100 border border-blue-300 text-blue-700 px-1 py-px rounded-full whitespace-nowrap leading-tight">
                  club
                </span>
              )}
              {info.risk === 'match' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black bg-red-100 border border-red-300 text-red-700 px-1 py-px rounded-full whitespace-nowrap leading-tight">
                  match
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Alertes match uniquement — concises, fonds opaques pour lisibilité */}
      {matchAlerts.length > 0 && (
        <div className="space-y-1.5 mt-1">
          {matchAlerts.map(({ day, info }) => (
            <div
              key={day}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                info.risk === 'match'
                  ? 'bg-danger-bg-hover text-danger border border-danger-bd'
                  : 'bg-warn-bg-strong text-warn-strong border border-warn-bd-strong'
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warn-bg-strong border border-warn-bd-strong text-xs text-warn-strong">
          <span className="font-black">⚠</span>
          <span>Deux séances consécutives — laisse au moins 1 jour de récup entre chaque.</span>
        </div>
      )}

      {count < weeklySessions && (
        <p className="text-xs text-fg-muted text-center">
          {weeklySessions - count} jour{weeklySessions - count > 1 ? 's' : ''} restant{weeklySessions - count > 1 ? 's' : ''}
        </p>
      )}
      {count === weeklySessions && (
        <p className="text-xs text-brand-tint text-center font-bold">
          Tu as sélectionné {weeklySessions} jour{weeklySessions > 1 ? 's' : ''} — décoche pour en changer.
        </p>
      )}
    </div>
  )
}
