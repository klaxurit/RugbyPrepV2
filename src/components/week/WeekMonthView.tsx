import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CalendarEvent, SessionLog, DayOfWeek } from '../../types/training'
import { Icon, SectionLabel } from '../ui'
import { ClubAvatar } from '../match/ClubAvatar'
import { formatTonnage } from '../../services/home/formatTonnage'

type CellEvent = 'match' | 'gym' | 'recovery'

interface WeekMonthViewProps {
  events: readonly CalendarEvent[]
  logs: readonly SessionLog[]
  /** Jours club hebdo (du profil). Affichage indicatif uniquement. */
  clubDays?: readonly DayOfWeek[]
  /** Jours muscu prévisionnels (du profil). Affichage indicatif uniquement. */
  scDays?: readonly DayOfWeek[]
  /** ISO YYYY-MM-DD du jour courant. */
  todayISO: string
  /**
   * Charge totale soulevée du mois courant (kg). Calculée par le caller via
   * `computeMonthlyTonnage(sets, yearMonth, bodyweightKg)`. `null` quand
   * pas de data exploitable (notamment free users sans set tracking).
   */
  monthlyTonnageKg?: number | null
  /** Si false, la stat Charge est floutée + tease Premium. */
  isPremium?: boolean
  onSelectMatch?: (event: CalendarEvent) => void
  /** Ouvre la consultation d'une séance gym déjà loguée ce jour-là. */
  onSelectSessionLog?: (log: SessionLog) => void
  onAddForDate?: (dateISO: string) => void
}

const DOWS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

/**
 * Vue mensuelle éditoriale (refonte UI mai 2026, design v4-pro.jsx) — remplace
 * `MonthlyMatchGrid`. Stats 3-up + grille `aspect-square` minimaliste avec dots
 * indicateurs sous chaque numéro + légende + liste des matchs à venir.
 */
export function WeekMonthView({
  events,
  logs,
  todayISO,
  monthlyTonnageKg,
  isPremium = false,
  onSelectMatch,
  onSelectSessionLog,
  onAddForDate,
}: WeekMonthViewProps) {
  const todayDate = useMemo(() => new Date(`${todayISO}T12:00:00`), [todayISO])
  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth())

  const firstDow = useMemo(() => {
    // JS getDay() : 0=Dim..6=Sam ; on veut 0=Lun..6=Dim.
    const d = new Date(year, month, 1).getDay()
    return d === 0 ? 6 : d - 1
  }, [year, month])
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])

  // ─── Indexation des events par jour ──
  const cellTypes = useMemo(() => {
    const map = new Map<number, Set<CellEvent>>()
    const add = (day: number, type: CellEvent) => {
      const set = map.get(day) ?? new Set<CellEvent>()
      set.add(type)
      map.set(day, set)
    }
    for (const e of events) {
      const [y, m, d] = e.date.split('-').map(Number)
      if (y === year && m - 1 === month && e.type === 'match') add(d, 'match')
    }
    for (const log of logs) {
      const dateOnly = log.dateISO.slice(0, 10)
      const [y, m, d] = dateOnly.split('-').map(Number)
      if (y === year && m - 1 === month) {
        if (log.sessionType === 'ACTIVE_RECOVERY' || log.sessionType === 'RECOVERY') {
          add(d, 'recovery')
        } else {
          add(d, 'gym')
        }
      }
    }
    return map
  }, [events, logs, year, month])

  // Match par jour (pour onSelectMatch).
  const matchByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent>()
    for (const e of events) {
      const [y, m, d] = e.date.split('-').map(Number)
      if (y === year && m - 1 === month && e.type === 'match') map.set(d, e)
    }
    return map
  }, [events, year, month])

  // ─── Stats du mois ──
  const matchCount = useMemo(() => matchByDay.size, [matchByDay])
  const sessionCount = useMemo(() => {
    let n = 0
    for (const set of cellTypes.values()) {
      if (set.has('gym') || set.has('recovery')) n += 1
    }
    return n
  }, [cellTypes])
  const volumeMin = useMemo(() => {
    let total = 0
    for (const log of logs) {
      const [y, m] = log.dateISO.slice(0, 10).split('-').map(Number)
      if (y === year && m - 1 === month) total += log.durationMin ?? 0
    }
    return total
  }, [logs, year, month])

  // ─── Cellules (vide pour offset, puis 1..N) ──
  const cells: Array<number | null> = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayDayNum =
    todayDate.getFullYear() === year && todayDate.getMonth() === month
      ? todayDate.getDate()
      : null

  // ─── Matchs à venir (≤ 4, à partir de today) ──
  const upcomingMatches = useMemo(() => {
    return events
      .filter((e) => e.type === 'match' && e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
  }, [events, todayISO])

  const monthName = `${MONTHS_FR[month]} ${year}`

  const goPrev = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }
  const goNext = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const gymLogByDay = useMemo(() => {
    const map = new Map<number, SessionLog>()
    for (const log of logs) {
      if (log.sessionType === 'ACTIVE_RECOVERY' || log.sessionType === 'RECOVERY') continue
      const dateOnly = log.dateISO.slice(0, 10)
      const [y, m, d] = dateOnly.split('-').map(Number)
      if (y === year && m - 1 === month) map.set(d, log)
    }
    return map
  }, [logs, year, month])

  const handleCellClick = (day: number) => {
    const match = matchByDay.get(day)
    if (match && onSelectMatch) {
      onSelectMatch(match)
      return
    }
    const gymLog = gymLogByDay.get(day)
    if (gymLog && onSelectSessionLog) {
      onSelectSessionLog(gymLog)
      return
    }
    if (onAddForDate) onAddForDate(ymd(year, month, day))
  }

  return (
    <div className="space-y-5">
      {/* ── Nav mois (chevrons + titre Playfair italic) ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Mois précédent"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-paper-deep bg-transparent transition-colors hover:bg-paper-soft rf-focus-ring"
        >
          <Icon name="chevron-left" size={16} color="var(--color-text-primary)" />
        </button>
        <h2
          className="font-serif italic font-extrabold text-fg"
          style={{ fontSize: 22, letterSpacing: '-0.6px' }}
        >
          {monthName}
        </h2>
        <button
          type="button"
          onClick={goNext}
          aria-label="Mois suivant"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-paper-deep bg-transparent transition-colors hover:bg-paper-soft rf-focus-ring"
        >
          <Icon name="chevron-right" size={16} color="var(--color-text-primary)" />
        </button>
      </div>

      {/* ── Stats 4-up (Séances / Matchs / Volume / Charge Premium) ── */}
      <div className="grid grid-cols-4 gap-0 border-y border-paper-deep py-3.5">
        <MStat n={pad2(sessionCount)} l="Séances" />
        <MStat n={pad2(matchCount)} l="Matchs" divider />
        <MStat n={`${volumeMin}'`} l="Volume" divider />
        <TonnageStat tonnageKg={monthlyTonnageKg ?? 0} isPremium={isPremium} />
      </div>

      {/* ── En-tête jours L M M J V S D ── */}
      <div className="grid grid-cols-7 gap-1">
        {DOWS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-extrabold tracking-[0.1em] text-fg/50"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Grille mensuelle ── */}
      <div className="grid grid-cols-7 gap-1 -mt-3">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="aspect-square" />
          const types = cellTypes.get(d)
          const isToday = d === todayDayNum
          const hasMatch = types?.has('match') ?? false
          const hasGym = types?.has('gym') ?? false
          const hasRecovery = types?.has('recovery') ?? false

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleCellClick(d)}
              aria-label={`${d} ${MONTHS_FR[month]}${hasMatch ? ' — match' : ''}`}
              className="relative flex aspect-square flex-col items-center justify-center rounded-[10px] transition-transform hover:scale-105 active:scale-95 rf-focus-ring"
              style={{
                background: isToday
                  ? 'var(--color-accent)'
                  : hasMatch
                    ? 'var(--color-text-primary)'
                    : 'transparent',
                color: isToday || hasMatch ? 'var(--color-bg-app)' : 'var(--color-text-primary)',
              }}
            >
              <div
                className="text-[14px] font-extrabold tabular-nums"
                style={{ letterSpacing: '-0.3px' }}
              >
                {d}
              </div>
              {/* Indicateurs sous le numéro (max 1 dot pertinent) */}
              <div className="mt-1 flex h-1 gap-0.5">
                {hasMatch && (
                  <span
                    aria-hidden
                    className="h-1 w-1 rounded-sm"
                    style={{ background: 'var(--color-bg-app)' }}
                  />
                )}
                {!hasMatch && hasGym && (
                  <span
                    aria-hidden
                    className="h-1 w-1 rounded-sm"
                    style={{
                      background: isToday ? 'var(--color-bg-app)' : 'var(--color-accent)',
                    }}
                  />
                )}
                {!hasMatch && !hasGym && hasRecovery && (
                  <span
                    aria-hidden
                    className="h-1 w-1 rounded-sm"
                    style={{
                      background: isToday ? 'var(--color-bg-app)' : 'var(--color-accent)',
                      opacity: 0.4,
                    }}
                  />
                )}
              </div>
              {hasMatch && (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 text-[8px] font-extrabold tracking-wider opacity-85"
                  style={{ color: 'var(--color-bg-app)' }}
                >
                  M
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Légende ── */}
      <div className="flex justify-center gap-3.5">
        <Legend label="Gym" tone="brand" />
        <Legend label="Match" tone="ink" square />
        <Legend label="Récup" tone="brand" faded />
      </div>

      {/* ── Matchs à venir ── */}
      {upcomingMatches.length > 0 && (
        <section>
          <SectionLabel label="Matchs à venir" />
          <ul className="mt-2.5">
            {upcomingMatches.map((m, i) => (
              <li
                key={m.id ?? `${m.date}-${i}`}
                className={i < upcomingMatches.length - 1 ? 'border-b border-paper-deep' : ''}
              >
                <button
                  type="button"
                  onClick={() => onSelectMatch?.(m)}
                  className="flex w-full items-center gap-3.5 py-3 text-left rf-focus-ring"
                >
                  <div className="flex h-10 w-10 flex-col items-center justify-center rounded-[10px] bg-fg text-app flex-shrink-0">
                    <span className="text-[8px] font-extrabold tracking-[0.06em] opacity-60">
                      {formatDow(m.date)}
                    </span>
                    <span
                      className="text-[14px] font-extrabold tabular-nums"
                      style={{ letterSpacing: '-0.3px' }}
                    >
                      {m.date.slice(8, 10)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-brand">
                      vs. · {(m.is_neutral ? 'Neutre' : m.is_home ? 'Domicile' : 'Extérieur').toUpperCase()}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[14px] font-bold text-fg"
                      style={{ letterSpacing: '-0.2px' }}
                    >
                      {m.opponent ?? 'Adversaire à confirmer'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {m.kickoff_time && (
                      <span className="text-[13px] font-bold tabular-nums text-fg">
                        {m.kickoff_time.slice(0, 5)}
                      </span>
                    )}
                    <ClubAvatar code={m.opponent_code} name={m.opponent} size="sm" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

function formatDow(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d
    .toLocaleDateString('fr-FR', { weekday: 'short' })
    .slice(0, 3)
    .toUpperCase()
    .replace('.', '')
}

interface MStatProps {
  n: string
  l: string
  divider?: boolean
}

function MStat({ n, l, divider = false }: MStatProps) {
  return (
    <div
      className={`text-center px-1 ${divider ? 'border-l border-fg/8' : ''}`}
    >
      <div
        className="text-[22px] font-extrabold tabular-nums text-brand"
        style={{ letterSpacing: '-0.6px' }}
      >
        {n}
      </div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-fg/55">
        {l}
      </div>
    </div>
  )
}

interface TonnageStatProps {
  tonnageKg: number
  isPremium: boolean
}

/**
 * Stat "Charge" — Premium uniquement. Affiche le tonnage formaté pour Premium,
 * sinon un teaser flouté + lock vers `/profile#premium`.
 */
function TonnageStat({ tonnageKg, isPremium }: TonnageStatProps) {
  const formatted = formatTonnage(tonnageKg)

  if (!isPremium) {
    return (
      <Link
        to="/profile#premium"
        aria-label="Charge — débloquer Pro"
        className="relative block text-center px-1 border-l border-fg/8 rf-focus-ring"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none text-[22px] font-extrabold tabular-nums text-brand"
          style={{ letterSpacing: '-0.6px', filter: 'blur(4px)', opacity: 0.6 }}
        >
          12K kg
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-app text-brand shadow-md">
            <Icon name="lock" size={11} color="var(--color-accent)" strokeWidth={2.4} />
          </span>
        </div>
        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-fg/55">
          Charge
        </div>
      </Link>
    )
  }

  return (
    <div className="text-center px-1 border-l border-fg/8">
      <div
        className="text-[22px] font-extrabold tabular-nums text-brand"
        style={{ letterSpacing: '-0.6px' }}
      >
        {formatted}
      </div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-fg/55">
        Charge
      </div>
    </div>
  )
}

interface LegendProps {
  label: string
  tone: 'brand' | 'ink'
  square?: boolean
  faded?: boolean
}

function Legend({ label, tone, square = false, faded = false }: LegendProps) {
  const dotColor = tone === 'brand' ? 'var(--color-accent)' : 'var(--color-text-primary)'
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`block ${square ? 'rounded-sm' : 'rounded-full'}`}
        style={{
          width: 8,
          height: 8,
          background: dotColor,
          opacity: faded ? 0.4 : 1,
        }}
      />
      <span className="text-[10px] font-semibold text-fg/75">{label}</span>
    </div>
  )
}
