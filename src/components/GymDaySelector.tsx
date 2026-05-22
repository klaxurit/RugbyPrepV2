// src/components/GymDaySelector.tsx

import type { ClubSchedule, DayOfWeek } from '../types/training'
import { getDayInfo, primerSlotDay } from '../services/program/scheduleOptimizer'

// Lun → Dim
const WEEK_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]
const LABELS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const LABELS_FULL = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

interface Props {
  clubSchedule: ClubSchedule
  selectedDays: Set<DayOfWeek>
  weeklySessions: 2 | 3
  onChange: (days: Set<DayOfWeek>) => void
}

function circularGap(a: DayOfWeek, b: DayOfWeek): number {
  return Math.min(Math.abs(a - b), 7 - Math.abs(a - b))
}

/** Vrai seulement si deux séances sont sur des jours voisins (écart = 1), hors veille de match gérée par le programme. */
function hasAdjacentSessionsWithoutPrimer(
  selectedDays: Set<DayOfWeek>,
  primerDay: DayOfWeek | null,
): boolean {
  const sorted = [...selectedDays].sort((a, b) => a - b)
  return sorted.some((day, i) => {
    if (i === 0) return false
    const prev = sorted[i - 1]
    if (circularGap(day, prev) !== 1) return false
    if (primerDay !== null && (day === primerDay || prev === primerDay)) return false
    return true
  })
}

export function GymDaySelector({ clubSchedule, selectedDays, weeklySessions, onChange }: Props) {
  const count = selectedDays.size
  const atLimit = count >= weeklySessions
  const primerDay = primerSlotDay(clubSchedule.matchDay)
  const hasMatchDay = clubSchedule.matchDay !== undefined

  const toggle = (day: DayOfWeek) => {
    const isSelected = selectedDays.has(day)
    if (!isSelected && atLimit) return
    const next = new Set(selectedDays)
    if (isSelected) next.delete(day)
    else next.add(day)
    onChange(next)
  }

  // Seuls match + lendemain méritent une alerte visible (pas la veille = primer).
  const hardAlerts = Array.from(selectedDays)
    .map((d) => ({ day: d, info: getDayInfo(d, clubSchedule) }))
    .filter(({ info }) => info.risk === 'match' || info.risk === 'recovery')

  const showAdjacentHint = hasAdjacentSessionsWithoutPrimer(selectedDays, primerDay)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-fg-muted uppercase tracking-wide">
          Jours de séances muscu
        </p>
        <span
          className={`text-xs font-bold tabular-nums ${count === weeklySessions ? 'text-brand-tint' : 'text-fg-muted'}`}
        >
          {count}/{weeklySessions}
        </span>
      </div>

      {hasMatchDay && weeklySessions === 3 && primerDay !== null && (
        <p className="text-[11px] text-fg-muted leading-snug">
          Avec un match le {LABELS_FULL[clubSchedule.matchDay!]}, le programme peut caler une activation légère le{' '}
          {LABELS_FULL[primerDay]} — ce n&apos;est pas une grosse séance jambes.
        </p>
      )}

      <div className="grid grid-cols-7 gap-x-1.5 gap-y-1">
        {WEEK_DAYS.map((day) => {
          const info = getDayInfo(day, clubSchedule)
          const selected = selectedDays.has(day)
          const disabled = !selected && atLimit
          const badge =
            info.risk === 'club'
              ? { label: 'club', className: 'bg-blue-100 border-blue-300 text-blue-700' }
              : info.risk === 'primer_slot'
                ? { label: 'activation', className: 'bg-layer-5 border-brand-border text-brand-tint shadow-sm' }
                : info.risk === 'match'
                  ? { label: 'match', className: 'bg-red-100 border-red-300 text-red-700' }
                  : null

          let btnClass = ''
          if (selected) {
            if (info.risk === 'match') btnClass = 'bg-danger-bg-hover border-danger-bd text-danger'
            else if (info.risk === 'recovery') btnClass = 'bg-warn-bg-strong border-warn-bd-strong text-warn-strong'
            else if (info.risk === 'primer_slot') btnClass = 'bg-brand-soft border-brand text-brand-tint'
            else if (info.risk === 'club') btnClass = 'bg-info-bg border-info-bd text-info'
            else btnClass = 'bg-brand-soft border-brand text-brand-tint'
          } else if (disabled) {
            btnClass = 'bg-layer-5 border-border-app text-fg-faint opacity-50 cursor-not-allowed'
          } else {
            if (info.risk === 'match') btnClass = 'bg-layer-5 border-danger-bd text-fg-muted hover:border-danger'
            else if (info.risk === 'primer_slot') btnClass = 'bg-layer-5 border-brand-border text-fg-muted hover:border-brand'
            else if (info.risk === 'club') btnClass = 'bg-layer-5 border-info-bd text-fg-muted hover:border-info'
            else btnClass = 'bg-layer-5 border-border-app text-fg-muted hover:border-layer-20'
          }

          return (
            <div key={day} className={`relative min-h-[3.75rem] ${badge ? 'pb-3.5' : ''}`}>
              <button
                type="button"
                onClick={() => toggle(day)}
                disabled={disabled}
                aria-disabled={disabled}
                className={`w-full flex flex-col items-center justify-center py-2.5 rounded-2xl border-2 text-xs font-black transition-all ${btnClass}`}
              >
                <span>{LABELS_SHORT[day]}</span>
                <span className="text-[8px] font-bold mt-0.5 opacity-70">{LABELS_FULL[day]}</span>
              </button>
              {badge && (
                <span
                  className={`pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 text-[7px] font-black border px-1 py-px rounded-full whitespace-nowrap leading-tight ${badge.className}`}
                >
                  {badge.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {hardAlerts.length > 0 && (
        <div className="space-y-1.5">
          {hardAlerts.map(({ day, info }) => (
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

      {showAdjacentHint && (
        <p className="text-[11px] text-fg-muted leading-snug">
          Deux séances d&apos;affilée : si tu peux, laisse un jour de récup entre elles.
        </p>
      )}

      {count < weeklySessions && (
        <p className="text-xs text-fg-muted text-center">
          Choisis encore {weeklySessions - count} jour{weeklySessions - count > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  )
}
