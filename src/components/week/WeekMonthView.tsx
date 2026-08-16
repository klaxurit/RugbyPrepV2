import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CalendarEvent, SessionLog, DayOfWeek } from '../../types/training'
import type { MonthPhaseMarker, MonthPlannedSession, MonthWeekBand } from '../../services/scheduling/resolveMonthProgramGrid'
import { startOfIsoWeek } from '../../services/weeklyBilan/computeWeeklyBilan'
import type { Lang } from '../../i18n/appLabels'
import { Icon, SectionLabel } from '../ui'
import { ClubAvatar } from '../match/ClubAvatar'
import { formatTonnage } from '../../services/home/formatTonnage'
import { getClubLogoUrl, getClubMonogram } from '../../services/ui/clubLogos'

const CREST_OPACITY = 0.42
const CREST_MONO_OPACITY = 0.5

type CellEvent = 'match' | 'gym' | 'recovery' | 'planned' | 'planned_done' | 'planned_missed' | 'club'

interface WeekMonthViewProps {
  events: readonly CalendarEvent[]
  logs: readonly SessionLog[]
  clubDays?: readonly DayOfWeek[]
  scDays?: readonly DayOfWeek[]
  todayISO: string
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
  plannedSessionsByDate?: ReadonlyMap<string, readonly MonthPlannedSession[]>
  phaseMarkers?: readonly MonthPhaseMarker[]
  phaseBandByMonday?: ReadonlyMap<string, MonthWeekBand>
  lang?: Lang
  monthlyTonnageKg?: number | null
  isPremium?: boolean
  onSelectMatch?: (event: CalendarEvent) => void
  onSelectSessionLog?: (log: SessionLog) => void
  onAddForDate?: (dateISO: string) => void
}

const DOWS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const DOWS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

function dayOfWeekFromIso(iso: string): DayOfWeek {
  return new Date(`${iso}T12:00:00`).getDay() as DayOfWeek
}

export function WeekMonthView({
  events,
  logs,
  clubDays = [],
  todayISO,
  year,
  month,
  onMonthChange,
  plannedSessionsByDate,
  phaseMarkers = [],
  phaseBandByMonday,
  lang = 'fr',
  monthlyTonnageKg,
  isPremium = false,
  onSelectMatch,
  onSelectSessionLog,
  onAddForDate,
}: WeekMonthViewProps) {
  const todayDate = useMemo(() => new Date(`${todayISO}T12:00:00`), [todayISO])
  const monthNames = lang === 'fr' ? MONTHS_FR : MONTHS_EN
  const dowLabels = lang === 'fr' ? DOWS_FR : DOWS_EN

  const firstDow = useMemo(() => {
    const d = new Date(year, month, 1).getDay()
    return d === 0 ? 6 : d - 1
  }, [year, month])
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])

  const clubDaySet = useMemo(() => new Set(clubDays), [clubDays])

  const cellTypes = useMemo(() => {
    const map = new Map<number, Set<CellEvent>>()
    const add = (day: number, type: CellEvent) => {
      const set = map.get(day) ?? new Set<CellEvent>()
      set.add(type)
      map.set(day, set)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = ymd(year, month, d)
      if (clubDaySet.has(dayOfWeekFromIso(iso))) add(d, 'club')
      const planned = plannedSessionsByDate?.get(iso) ?? []
      if (planned.some((s) => s.status === 'completed')) add(d, 'planned_done')
      else if (planned.some((s) => s.status === 'missed')) add(d, 'planned_missed')
      else if (planned.some((s) => s.status === 'pending' || s.status === 'skipped')) add(d, 'planned')
    }
    for (const e of events) {
      const [y, m, day] = e.date.split('-').map(Number)
      if (y === year && m - 1 === month && e.type === 'match') add(day, 'match')
    }
    for (const log of logs) {
      const dateOnly = log.dateISO.slice(0, 10)
      const [y, m, day] = dateOnly.split('-').map(Number)
      if (y === year && m - 1 === month) {
        if (log.sessionType === 'ACTIVE_RECOVERY' || log.sessionType === 'RECOVERY') {
          add(day, 'recovery')
        } else {
          add(day, 'gym')
        }
      }
    }
    return map
  }, [events, logs, year, month, daysInMonth, clubDaySet, plannedSessionsByDate])

  const matchByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent>()
    for (const e of events) {
      const [y, m, d] = e.date.split('-').map(Number)
      if (y === year && m - 1 === month && e.type === 'match') map.set(d, e)
    }
    return map
  }, [events, year, month])

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

  const sessionDayCount = useMemo(() => {
    const days = new Set<number>()
    for (const [day, types] of cellTypes) {
      if (types.has('gym') || types.has('recovery') || types.has('planned') || types.has('planned_done') || types.has('planned_missed')) {
        days.add(day)
      }
    }
    return days.size
  }, [cellTypes])

  const matchCount = matchByDay.size
  const volumeMin = useMemo(() => {
    let total = 0
    for (const log of logs) {
      const [y, m] = log.dateISO.slice(0, 10).split('-').map(Number)
      if (y === year && m - 1 === month) total += log.durationMin ?? 0
    }
    return total
  }, [logs, year, month])

  const cells = useMemo(() => {
    const grid: Array<number | null> = []
    for (let i = 0; i < firstDow; i++) grid.push(null)
    for (let d = 1; d <= daysInMonth; d++) grid.push(d)
    while (grid.length % 7 !== 0) grid.push(null)
    return grid
  }, [firstDow, daysInMonth])

  const todayDayNum =
    todayDate.getFullYear() === year && todayDate.getMonth() === month
      ? todayDate.getDate()
      : null

  const calendarRows = useMemo(() => {
    const rows: Array<Array<number | null>> = []
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7))
    }
    return rows
  }, [cells])

  const monthFirst = ymd(year, month, 1)
  const monthLast = ymd(year, month, daysInMonth)

  const resolveWeekBand = (row: Array<number | null>): MonthWeekBand | null => {
    const firstInMonth = row.find((d) => d !== null)
    if (firstInMonth == null) return null
    const mondayIso = startOfIsoWeek(ymd(year, month, firstInMonth))
    return phaseBandByMonday?.get(mondayIso) ?? null
  }

  const upcomingMatches = useMemo(() => {
    return events
      .filter((e) => e.type === 'match' && e.date >= monthFirst && e.date <= monthLast)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6)
  }, [events, monthFirst, monthLast])

  const phaseMarkersInMonth = useMemo(
    () =>
      phaseMarkers.filter(
        (m) => m.effectiveDateISO >= monthFirst && m.effectiveDateISO <= monthLast,
      ),
    [phaseMarkers, monthFirst, monthLast],
  )

  const goPrev = () => {
    if (month === 0) onMonthChange(year - 1, 11)
    else onMonthChange(year, month - 1)
  }
  const goNext = () => {
    if (month === 11) onMonthChange(year + 1, 0)
    else onMonthChange(year, month + 1)
  }

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
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label={lang === 'fr' ? 'Mois précédent' : 'Previous month'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-paper-deep bg-transparent transition-colors hover:bg-paper-soft rf-focus-ring"
        >
          <Icon name="chevron-left" size={16} color="var(--color-text-primary)" />
        </button>
        <h2
          className="font-serif italic font-extrabold text-fg"
          style={{ fontSize: 22, letterSpacing: '-0.6px' }}
        >
          {monthNames[month]} {year}
        </h2>
        <button
          type="button"
          onClick={goNext}
          aria-label={lang === 'fr' ? 'Mois suivant' : 'Next month'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-paper-deep bg-transparent transition-colors hover:bg-paper-soft rf-focus-ring"
        >
          <Icon name="chevron-right" size={16} color="var(--color-text-primary)" />
        </button>
      </div>

      {phaseMarkersInMonth.length > 0 && (
        <section className="rounded-2xl border border-brand-border bg-brand-soft/40 p-3 space-y-2">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-brand-muted">
            {lang === 'fr' ? 'Évolution du programme' : 'Program evolution'}
          </p>
          <ul className="space-y-1.5">
            {phaseMarkersInMonth.map((marker) => (
              <li
                key={`${marker.effectiveDateISO}-${marker.kind}`}
                className="flex items-baseline gap-2 text-xs"
              >
                <span className="shrink-0 font-bold tabular-nums text-fg-muted">
                  {formatShortDay(marker.effectiveDateISO, lang)}
                </span>
                <span className="font-bold text-brand-tint">{marker.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-4 gap-0 border-y border-paper-deep py-3.5">
        <MStat n={pad2(sessionDayCount)} l={lang === 'fr' ? 'Séances' : 'Sessions'} />
        <MStat n={pad2(matchCount)} l={lang === 'fr' ? 'Matchs' : 'Matches'} divider />
        <MStat n={`${volumeMin}'`} l="Volume" divider />
        <TonnageStat tonnageKg={monthlyTonnageKg ?? 0} isPremium={isPremium} lang={lang} />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dowLabels.map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-extrabold tracking-[0.1em] text-fg/50"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {calendarRows.map((row, rowIdx) => {
          const band = resolveWeekBand(row)
          return (
            <div key={rowIdx}>
              {band && (
                <div className="mb-1 flex items-baseline justify-between gap-2 rounded-lg bg-paper-deep/60 px-2.5 py-1.5">
                  <span className="min-w-0 text-[11px] font-bold leading-snug text-brand-tint">
                    {band.fullLabel}
                  </span>
                  <span className="shrink-0 text-[9px] font-semibold tabular-nums text-fg-muted">
                    {formatShortDay(band.mondayISO, lang)} – {formatShortDay(band.sundayISO, lang)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-7 gap-1">
                {row.map((d, i) => {
                  if (d === null) return <div key={i} className="min-h-[5.5rem]" />

                  const iso = ymd(year, month, d)
                  const types = cellTypes.get(d)
                  const isToday = d === todayDayNum
                  const hasMatch = types?.has('match') ?? false
                  const hasRecovery = types?.has('recovery') ?? false
                  const hasClub = types?.has('club') ?? false
                  const match = matchByDay.get(d)
                  const planned = plannedSessionsByDate?.get(iso) ?? []
                  const venueLabel = match
                    ? match.is_neutral
                      ? lang === 'fr' ? 'neutre' : 'neutral'
                      : match.is_home
                        ? lang === 'fr' ? 'domicile' : 'home'
                        : lang === 'fr' ? 'extérieur' : 'away'
                    : null
                  const kickoff = match?.kickoff_time?.slice(0, 5)
                  const gymChipCap = match ? 1 : hasClub ? 1 : 2

                  const extras: string[] = []
                  if (hasMatch && match) {
                    extras.push(`match ${venueLabel}${match.opponent ? ` vs ${match.opponent}` : ''}${kickoff ? ` ${kickoff}` : ''}`)
                  }
                  if (hasClub) extras.push(lang === 'fr' ? 'club' : 'club')
                  if (planned.length) extras.push(planned.map((p) => p.title).join(', '))

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleCellClick(d)}
                      aria-label={`${d} ${monthNames[month]}${extras.length ? ` — ${extras.join(' · ')}` : ''}`}
                      data-testid={
                        hasMatch ? `month-cell-match-${d}` : hasClub ? `month-cell-club-${d}` : undefined
                      }
                      className="relative flex min-h-[5.25rem] flex-col items-stretch overflow-hidden rounded-[9px] text-left transition-transform hover:scale-[1.02] active:scale-95 rf-focus-ring"
                      style={{
                        background: hasMatch ? 'var(--color-cream-soft)' : 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        border: isToday
                          ? '1.5px solid var(--color-accent)'
                          : '1px solid var(--color-cream-deep)',
                      }}
                    >
                      {match && (
                        <>
                          <MatchCrestWatermark code={match.opponent_code} name={match.opponent} />
                          <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 rounded-[9px]"
                            style={{
                              background:
                                'linear-gradient(110deg, color-mix(in srgb, var(--color-cream-soft) 78%, transparent) 22%, color-mix(in srgb, var(--color-cream-soft) 8%, transparent) 78%)',
                            }}
                          />
                        </>
                      )}

                      <div className="relative flex min-h-[5.25rem] flex-1 flex-col px-1.5 pb-1 pt-1.5">
                        <div className="flex items-start justify-between gap-0.5">
                          <span
                            className="font-serif text-[16px] leading-none tabular-nums"
                            style={{
                              color: isToday ? 'var(--color-accent)' : 'var(--color-text-primary)',
                            }}
                          >
                            {d}
                          </span>
                          {match ? <VenueTag match={match} lang={lang} /> : null}
                        </div>

                        <div className="mt-auto flex flex-col gap-0.5">
                          {hasClub && <StackChip label="Club" tone="club" />}
                          {planned.slice(0, gymChipCap).map((session, idx) => (
                            <SessionChip
                              key={`${session.shortLabel}-${idx}`}
                              session={session}
                              lang={lang}
                            />
                          ))}
                          {planned.length > gymChipCap && (
                            <span className="text-[6px] font-bold opacity-60">+{planned.length - gymChipCap}</span>
                          )}
                          {!planned.length && hasRecovery && !match && (
                            <StackChip label={lang === 'fr' ? 'Récup' : 'Rec'} tone="rec" />
                          )}
                          {match && (
                            <>
                              {kickoff && (
                                <span className="text-[11px] font-semibold tabular-nums leading-none tracking-tight text-brand">
                                  {kickoff}
                                </span>
                              )}
                              {match.opponent && (
                                <span className="truncate text-[8px] leading-tight text-fg-muted">
                                  {match.opponent}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Legend label={lang === 'fr' ? 'À faire' : 'Todo'} tone="brand" dashed />
        <Legend label={lang === 'fr' ? 'Fait' : 'Done'} tone="ok" filled />
        <Legend label={lang === 'fr' ? 'Manqué' : 'Missed'} tone="warn" dashed />
        <Legend label="Match" tone="ink" square />
        <Legend label="Club" tone="ink" filled />
        <Legend label={lang === 'fr' ? 'Récup' : 'Rec'} tone="brand" faded />
      </div>

      {upcomingMatches.length > 0 && (
        <section>
          <SectionLabel label={lang === 'fr' ? 'Matchs du mois' : 'Matches this month'} />
          <ul className="mt-2.5">
            {upcomingMatches.map((m, idx) => (
              <li
                key={m.id ?? `${m.date}-${idx}`}
                className={idx < upcomingMatches.length - 1 ? 'border-b border-paper-deep' : ''}
              >
                <button
                  type="button"
                  onClick={() => onSelectMatch?.(m)}
                  className="flex w-full items-center gap-3.5 py-3 text-left rf-focus-ring"
                >
                  <div className="flex h-10 w-10 flex-col items-center justify-center rounded-[10px] bg-fg text-app flex-shrink-0">
                    <span className="text-[8px] font-extrabold tracking-[0.06em] opacity-60">
                      {formatDow(m.date, lang)}
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
                      vs. · {(m.is_neutral ? (lang === 'fr' ? 'Neutre' : 'Neutral') : m.is_home ? (lang === 'fr' ? 'Domicile' : 'Home') : (lang === 'fr' ? 'Extérieur' : 'Away')).toUpperCase()}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[14px] font-bold text-fg"
                      style={{ letterSpacing: '-0.2px' }}
                    >
                      {m.opponent ?? (lang === 'fr' ? 'Adversaire à confirmer' : 'TBC opponent')}
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

function MatchCrestWatermark({ code, name }: { code?: string; name?: string }) {
  const logoUrl = code ? getClubLogoUrl(code) : null
  const monogram = getClubMonogram(name)
  const [failed, setFailed] = useState(false)
  const showLogo = Boolean(logoUrl) && !failed

  return (
    <div
      aria-hidden
      data-testid="month-cell-crest"
      className="pointer-events-none absolute -bottom-2 -right-1 flex h-[80px] w-[72px] items-end justify-end"
      style={{
        maskImage: 'linear-gradient(to left top, transparent 0%, black 38%)',
        WebkitMaskImage: 'linear-gradient(to left top, transparent 0%, black 38%)',
      }}
    >
      {showLogo ? (
        <img
          src={logoUrl ?? undefined}
          alt=""
          className="h-full w-full object-contain object-bottom"
          style={{ opacity: CREST_OPACITY }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="pr-0.5 font-serif text-[28px] font-medium leading-none text-fg"
          style={{ opacity: CREST_MONO_OPACITY }}
        >
          {monogram}
        </span>
      )}
    </div>
  )
}

function VenueTag({ match, lang }: { match: CalendarEvent; lang: Lang }) {
  if (match.is_neutral) {
    return (
      <span className="rounded-[3px] border border-paper-deep px-0.5 text-[7px] font-bold tracking-[0.06em] text-fg-muted">
        N
      </span>
    )
  }
  if (match.is_home) {
    return (
      <span className="rounded-[3px] bg-brand px-0.5 text-[7px] font-bold tracking-[0.06em] text-app">
        {lang === 'fr' ? 'DOM' : 'HOM'}
      </span>
    )
  }
  return (
    <span
      className="rounded-[3px] px-0.5 text-[7px] font-bold tracking-[0.06em] text-brand"
      style={{ border: '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)' }}
    >
      {lang === 'fr' ? 'EXT' : 'AWY'}
    </span>
  )
}

function StackChip({
  label,
  tone,
}: {
  label: string
  tone: 'club' | 'rec'
}) {
  return (
    <span
      className="block truncate rounded-[3px] px-0.5 py-0.5 text-center text-[7.5px] font-bold uppercase tracking-[0.04em] leading-none"
      style={{
        background: tone === 'club' ? 'var(--color-cream-deep)' : 'var(--color-accent-soft)',
        color: tone === 'club' ? 'var(--color-text-secondary)' : 'var(--color-accent)',
      }}
    >
      {label}
    </span>
  )
}

function SessionChip({
  session,
  lang,
}: {
  session: MonthPlannedSession
  lang: Lang
}) {
  const status = session.status ?? (session.completionStatus === 'completed' ? 'completed' : 'pending')
  const palette =
    status === 'completed'
      ? { bg: 'var(--color-ok-bg)', ink: 'var(--color-ok-strong)', border: '1px solid transparent' }
      : status === 'missed'
        ? { bg: 'var(--color-warn-bg)', ink: 'var(--color-warn-strong)', border: '1px solid transparent' }
        : status === 'skipped'
          ? { bg: 'transparent', ink: 'var(--color-text-muted)', border: 'none' }
          : {
              bg: 'transparent',
              ink: 'var(--color-accent)',
              border: '1px dashed color-mix(in srgb, var(--color-accent) 55%, transparent)',
            }

  return (
    <span
      className={`block truncate rounded-[3px] px-0.5 py-0.5 text-center text-[7.5px] font-bold uppercase tracking-[0.04em] leading-none ${
        status === 'skipped' ? 'opacity-40 line-through' : ''
      }`}
      style={{
        background: palette.bg,
        color: palette.ink,
        border: palette.border,
      }}
      title={
        status === 'missed'
          ? `${session.title} — ${lang === 'fr' ? 'non réalisée' : 'not completed'}`
          : session.title
      }
    >
      {session.shortLabel}
    </span>
  )
}

function formatShortDay(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })
}

function formatDow(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T12:00:00`)
  return d
    .toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'short' })
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
    <div className={`text-center px-1 ${divider ? 'border-l border-fg/8' : ''}`}>
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
  lang: Lang
}

function TonnageStat({ tonnageKg, isPremium, lang }: TonnageStatProps) {
  const formatted = formatTonnage(tonnageKg)

  if (!isPremium) {
    return (
      <Link
        to="/profile#premium"
        aria-label={lang === 'fr' ? 'Charge — débloquer Pro' : 'Load — unlock Pro'}
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
          {lang === 'fr' ? 'Charge' : 'Load'}
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
        {lang === 'fr' ? 'Charge' : 'Load'}
      </div>
    </div>
  )
}

interface LegendProps {
  label: string
  tone: 'brand' | 'ink' | 'muted' | 'ok' | 'warn'
  square?: boolean
  faded?: boolean
  dashed?: boolean
  filled?: boolean
  labelOnly?: boolean
}

function Legend({ label, tone, square = false, faded = false, dashed = false, filled = false, labelOnly = false }: LegendProps) {
  if (labelOnly) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-extrabold text-fg-muted">C</span>
        <span className="text-[10px] font-semibold text-fg/75">{label}</span>
      </div>
    )
  }
  const dotColor =
    tone === 'brand'
      ? 'var(--color-accent)'
      : tone === 'ink'
        ? 'var(--color-text-primary)'
        : tone === 'ok'
          ? 'var(--color-ok-strong)'
          : tone === 'warn'
            ? 'var(--color-warn-strong)'
            : 'var(--color-text-muted)'
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`block ${square ? 'rounded-sm' : 'rounded-full'}`}
        style={{
          width: 8,
          height: 8,
          background: filled ? dotColor : 'transparent',
          border: dashed
            ? `1px dashed ${dotColor}`
            : filled
              ? 'none'
              : `1.5px solid ${dotColor}`,
          opacity: faded ? 0.4 : 1,
        }}
      />
      <span className="text-[10px] font-semibold text-fg/75">{label}</span>
    </div>
  )
}
