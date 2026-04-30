import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { CalendarEvent, CalendarEventType, DayOfWeek } from '../../types/training'
import { getClubLogoUrl } from '../../services/ui/clubLogos'

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
 * Vue mensuelle 7 colonnes — Variant D (couleurs alignées sur la vue semaine
 * via les tokens `--color-event-*`). Affiche club (C), muscu prévisionnelle
 * (P) et matchs (J) avec glyphe typé.
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
    <div className="rounded-[20px] border border-border-app bg-layer-2 shadow-elevated p-5 space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Mois précédent"
          className="w-8 h-8 rounded-full border border-edge-hairline bg-layer-7 flex items-center justify-center text-fg-soft hover:bg-brand-soft hover:text-brand transition-colors rf-focus-ring"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-base font-bold text-fg">
          {MONTHS_FR[month]} {year}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Mois suivant"
          className="w-8 h-8 rounded-full border border-edge-hairline bg-layer-7 flex items-center justify-center text-fg-soft hover:bg-brand-soft hover:text-brand transition-colors rf-focus-ring"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {DAY_NAMES_FR.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold text-fg-faint uppercase tracking-[0.4px] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={i}
                aria-hidden
                className="aspect-square rounded-[10px] pointer-events-none"
              />
            )
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const cellDate = new Date(year, month, day)
          const cellDow = cellDate.getDay() as DayOfWeek
          const isWeekend = cellDow === 0 || cellDow === 6
          const isClubDay = clubDays.includes(cellDow)
          const entry = eventsByDate.get(dateStr)
          const isMatchDay = entry?.type === 'match'
          const isScDay = scDays.includes(cellDow)

          // Priorité : match > club > muscu (visuel dominant)
          let bgVar: string | null = null
          let glyph: 'G' | 'C' | 'M' | null = null
          let glyphColor: string | null = null
          let numColor: string | null = null
          let fontWeight: number | null = null
          let borderColor: string | null = null

          // Logo opponent (si code FFR connu) — affiché en lieu et place du
          // glyphe 'M' pour rendre le match identifiable d'un coup d'œil.
          const opponentLogoUrl = isMatchDay
            ? getClubLogoUrl(entry?.event.opponent_code)
            : null

          if (isMatchDay) {
            bgVar = 'var(--color-event-match-bg)'
            borderColor = 'var(--color-event-match-border)'
            numColor = 'var(--color-event-match-fg)'
            glyph = 'M'
            glyphColor = 'var(--color-event-match-fg)'
            fontWeight = 700
          } else if (isClubDay) {
            bgVar = 'var(--color-event-club-bg-soft)'
            glyph = 'C'
            glyphColor = 'var(--color-event-club-fg)'
          } else if (isScDay) {
            bgVar = 'var(--color-event-personal-bg-soft)'
            glyph = 'G'
            glyphColor = 'var(--color-event-personal-fg)'
          }

          // Aujourd'hui — ring bordeaux par-dessus (prime sur tout)
          const todayStyles: React.CSSProperties = isToday
            ? {
                borderColor: 'var(--color-accent)',
                boxShadow: '0 0 0 2px var(--color-accent-soft)',
              }
            : {}

          const descriptors: string[] = []
          if (isClubDay) descriptors.push('Entraînement club')
          if (isMatchDay) {
            descriptors.push(entry.event.opponent ? `Match vs ${entry.event.opponent}` : 'Match')
          } else if (entry && entry.type !== 'match') {
            descriptors.push(entry.type)
          }
          if (isScDay && !isClubDay && !isMatchDay) descriptors.push('Séance muscu prévue')
          const ariaLabel =
            descriptors.length > 0
              ? `${day} — ${descriptors.join(' · ')}${isMatchDay ? ' (toucher pour éditer)' : ''}`
              : onAddForDate
                ? `${day} — Ajouter un événement`
                : `${day}`

          const handleClick = () => {
            if (entry?.type === 'match') onSelectMatch(entry.event)
            else if (!entry && onAddForDate) onAddForDate(dateStr)
          }

          const clickable = (entry?.type === 'match') || (!entry && !!onAddForDate)

          return (
            <button
              key={i}
              type="button"
              onClick={handleClick}
              disabled={!clickable}
              aria-label={ariaLabel}
              aria-current={isToday ? 'date' : undefined}
              className="aspect-square flex flex-col items-center justify-center gap-[3px] rounded-[10px] border border-transparent transition-colors disabled:cursor-default enabled:hover:bg-layer-10 rf-focus-ring"
              style={{
                backgroundColor: bgVar ?? undefined,
                borderColor: (isToday ? todayStyles.borderColor : borderColor) ?? undefined,
                boxShadow: todayStyles.boxShadow ?? undefined,
              }}
            >
              <span
                className="text-sm leading-none"
                style={{
                  color: isToday ? 'var(--color-accent)' : (numColor ?? undefined),
                  fontWeight: isToday ? 700 : (fontWeight ?? 500),
                  opacity: !numColor && !isToday && isWeekend ? 0.55 : 1,
                }}
              >
                {day}
              </span>
              {opponentLogoUrl ? (
                <img
                  src={opponentLogoUrl}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="w-3.5 h-3.5 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : glyph ? (
                <span
                  aria-hidden
                  className="text-[9px] font-bold leading-none tracking-[0.6px]"
                  style={{ color: glyphColor ?? undefined }}
                >
                  {glyph}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3.5 justify-center pt-2 text-[11px] text-fg-soft">
        {scDays.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-[8px] font-bold"
              style={{
                backgroundColor: 'var(--color-event-personal-bg-soft)',
                color: 'var(--color-event-personal-fg)',
              }}
            >
              G
            </span>
            Gym
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-[8px] font-bold"
            style={{
              backgroundColor: 'var(--color-event-club-bg-soft)',
              color: 'var(--color-event-club-fg)',
            }}
          >
            C
          </span>
          Club
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-[8px] font-bold"
            style={{
              backgroundColor: 'var(--color-event-match-bg)',
              color: 'var(--color-event-match-fg)',
            }}
          >
            M
          </span>
          Match
        </span>
      </div>

      <p className="text-[11px] text-fg-muted italic pt-1 leading-snug">
        Planning prévisionnel — les séances muscu peuvent être adaptées autour des matchs dans Programme.
      </p>

      {onAddForDate && (
        <div className="pt-3 border-t border-edge-hairline">
          <button
            type="button"
            onClick={() => onAddForDate(todayStr)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-brand hover:bg-brand-soft hover:rounded-lg transition-colors rf-focus-ring"
          >
            <Plus className="w-4 h-4" />
            Ajouter un événement
          </button>
        </div>
      )}
    </div>
  )
}
