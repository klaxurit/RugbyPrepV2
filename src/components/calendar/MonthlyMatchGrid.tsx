import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { CalendarEvent, CalendarEventType, DayOfWeek } from '../../types/training'

const DAY_NAMES_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

interface MonthlyMatchGridProps {
  events: CalendarEvent[]
  clubDays: DayOfWeek[]
  /**
   * Jours muscu prévisionnels (profil). Peinture statique — `/week` reste
   * l'autorité pour l'adaptation réelle semaine par semaine.
   */
  scDays?: DayOfWeek[]
  /** Clic sur un jour contenant un match → édition de ce match. */
  onSelectMatch: (event: CalendarEvent) => void
  /** Clic sur un jour vide → ouvrir modal d'ajout pour cette date. */
  onAddForDate?: (dateISO: string) => void
}

/**
 * Vue mensuelle 7 colonnes — affiche les matchs sur la grille du mois courant.
 * Navigation prev/next mois locale. Extraite de l'ancienne page `/calendar`
 * pour servir en section repliable sur `/week`.
 */
export function MonthlyMatchGrid({ events, clubDays, scDays = [], onSelectMatch, onAddForDate }: MonthlyMatchGridProps) {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const todayStr = toDateStr(today)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ]

  const eventsByDate = useMemo(() => {
    const map = new Map<string, { type: CalendarEventType; event: CalendarEvent }>()
    events.forEach((e) => {
      const [y, m] = e.date.split('-').map(Number)
      if (y === year && m - 1 === month) {
        map.set(e.date, { type: e.type, event: e })
      }
    })
    return map
  }, [events, year, month])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  return (
    <div className="bg-layer-5 border border-border-app rounded-[2rem] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Mois précédent"
          className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:border-layer-15 rf-focus-ring"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-black text-fg">
          {MONTHS_FR[month]} {year}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Mois suivant"
          className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:border-layer-15 rf-focus-ring"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-fg-muted">
        <span className="flex items-center gap-1">
          <span aria-hidden className="w-2.5 h-2.5 rounded-sm bg-violet-100" />
          🏉 Club
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden className="w-2.5 h-2.5 rounded-sm bg-amber-100" />
          🏆 Match
        </span>
        {scDays.length > 0 && (
          <span className="flex items-center gap-1">
            <span aria-hidden className="w-2.5 h-2.5 rounded-sm bg-emerald-100" />
            💪 Muscu
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES_FR.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-black text-fg-muted uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const cellDate = new Date(year, month, day)
          const cellDow = cellDate.getDay() as DayOfWeek
          const isClubDay = clubDays.includes(cellDow)
          const entry = eventsByDate.get(dateStr)
          const isMatchDay = entry?.type === 'match'
          const isScDay = scDays.includes(cellDow)

          // Priorités fond : today > match > club > muscu.
          let stateClasses = 'hover:bg-layer-10 text-fg-emphasis'
          if (isToday) {
            stateClasses = 'border-2 border-brand bg-brand-soft text-brand-tint font-black'
          } else if (isMatchDay) {
            stateClasses = 'bg-amber-100 text-amber-900'
          } else if (isClubDay) {
            stateClasses = 'bg-violet-100 text-violet-900'
          } else if (isScDay) {
            stateClasses = 'bg-emerald-100 text-emerald-900'
          }

          const eventRing = entry && !isMatchDay
            ? 'ring-1 ring-inset ' +
              (entry.type === 'rest' ? 'ring-info-bd' : 'ring-tone-orange-bd')
            : ''
          const icons = [
            isClubDay ? '🏉' : null,
            isMatchDay ? '🏆' : null,
            isScDay && !isClubDay && !isMatchDay ? '💪' : null,
          ].filter(Boolean).join('')

          let eventDot = ''
          if (!isMatchDay && !isClubDay && entry) {
            if (entry.type === 'rest') eventDot = 'bg-info'
            else if (entry.type === 'unavailable') eventDot = 'bg-orange-400'
          }

          const handleClick = () => {
            if (entry?.type === 'match') {
              onSelectMatch(entry.event)
            } else if (!entry && onAddForDate) {
              onAddForDate(dateStr)
            }
          }

          const descriptors: string[] = []
          if (isClubDay) descriptors.push('Entraînement club')
          if (isMatchDay) {
            descriptors.push(
              entry.event.opponent ? `Match vs ${entry.event.opponent}` : 'Match',
            )
          } else if (entry) {
            descriptors.push(entry.type)
          }
          if (isScDay && !isClubDay && !isMatchDay) descriptors.push('Séance muscu prévue')
          const ariaLabel = descriptors.length > 0
            ? `${day} — ${descriptors.join(' · ')}${isMatchDay ? ' (toucher pour éditer)' : ''}`
            : onAddForDate
              ? `${day} — Ajouter un événement`
              : `${day}`

          return (
            <button
              key={i}
              type="button"
              onClick={handleClick}
              disabled={!entry && !onAddForDate}
              aria-label={ariaLabel}
              className={`relative aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-colors overflow-hidden ${stateClasses} ${eventRing} disabled:cursor-default`}
            >
              <span className="leading-none">{day}</span>
              {icons && (
                <span aria-hidden className="absolute bottom-1 text-[9px] leading-none tracking-tight opacity-95">
                  {icons}
                </span>
              )}
              {eventDot && !icons && (
                <span aria-hidden className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${eventDot}`} />
              )}
            </button>
          )
        })}
      </div>

      <p className="text-[10px] text-fg-faint italic pt-1">
        Planning prévisionnel — les séances muscu peuvent être adaptées autour des matchs dans Programme.
      </p>

      {onAddForDate && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onAddForDate(todayStr)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-tint hover:text-brand transition-colors rf-focus-ring"
          >
            <Plus className="w-3 h-3" />
            Ajouter un événement
          </button>
        </div>
      )}
    </div>
  )
}
