import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Trophy,
  Bed,
  AlertCircle,
  Home,
  MapPin,
  Search,
  CheckCircle2,
  Activity,
  Dumbbell,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { useCalendar } from '../hooks/useCalendar'
import { useProfile } from '../hooks/useProfile'
import { useAdaptiveSchedule } from '../hooks/useAdaptiveSchedule'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import ffrClubs from '../data/ffrClubs.v2021.json'
import type { CalendarEventType, CalendarEvent, SeasonPhase, DayOfWeek } from '../types/training'
import { TRAINING_DAYS_DEFAULT } from '../services/program/scheduleOptimizer'
import { buildAthletePlanningInputs } from '../services/annualPlanning/buildAthletePlanningInputs'
import { detectAnnualPlanningContext } from '../services/season/detectAnnualPlanningContext'
import { cycleToSeasonPhase } from '../services/season/cycleToSeasonPhase'

// ─── Club Search Types ────────────────────────────────────────

interface FfrClub {
  ligue: string
  departmentCode: string
  code: string
  name: string
}

const ALL_CLUBS = ffrClubs as FfrClub[]

const normalize = (s: string) =>
  s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const searchClubs = (query: string): FfrClub[] => {
  if (!query || query.length < 2) return []
  const q = normalize(query)
  return ALL_CLUBS.filter((c) => normalize(c.name).includes(q)).slice(0, 8)
}

// ─── Constants ───────────────────────────────────────────────

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DAY_NAMES_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const seasonPhaseConfig: Record<SeasonPhase, { label: string; color: string; bg: string }> = {
  'off-season': { label: 'Hors-saison', color: 'text-fg-muted', bg: 'bg-layer-10' },
  'pre-season': { label: 'Pré-saison', color: 'text-amber-400', bg: 'bg-amber-900/20' },
  'in-season': { label: 'En saison', color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
  'playoffs': { label: 'Playoffs', color: 'text-rose-400', bg: 'bg-rose-900/20' },
}

const eventTypeConfig: Record<CalendarEventType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  match: { label: 'Match', icon: Trophy, color: 'text-rose-400', bg: 'bg-rose-900/20' },
  rest: { label: 'Repos', icon: Bed, color: 'text-info', bg: 'bg-info-bg' },
  unavailable: { label: 'Indisponible', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-900/20' },
}

// ─── Helpers ─────────────────────────────────────────────────

const toDateStr = (d: Date): string => d.toISOString().split('T')[0]

const formatDateFR = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00') // avoid TZ shift
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const diffDays = (dateStr: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Club Logo Avatar ─────────────────────────────────────────

function ClubAvatar({ code, name, size = 'md' }: { code?: string; name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const logoUrl = code ? getClubLogoUrl(code) : null
  const monogram = getClubMonogram(name)
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[8px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-8 h-8 text-[10px]'

  return (
    <div className={`${sizeClass} rounded-xl bg-layer-10 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name ?? ''}
          className="w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <span className="font-black text-fg-soft">{monogram}</span>
      )}
    </div>
  )
}

// ─── Club Search Input ────────────────────────────────────────

interface ClubSearchInputProps {
  value: string
  clubCode?: string
  onChange: (name: string, code?: string) => void
}

function ClubSearchInput({ value, clubCode, onChange }: ClubSearchInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<FfrClub[]>([])
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    onChange(q, undefined) // reset code when typing manually
    setResults(searchClubs(q))
  }

  const handleSelect = (club: FfrClub) => {
    setQuery(club.name)
    onChange(club.name, club.code)
    setResults([])
    setFocused(false)
  }

  const showDropdown = focused && results.length > 0

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 transition-all ${
        focused ? 'border-brand ring-2 ring-brand-glow/30' : 'border-border-app'
      }`}>
        {clubCode ? (
          <ClubAvatar code={clubCode} name={query} size="sm" />
        ) : (
          <Search className="w-4 h-4 text-fg-faint flex-shrink-0" />
        )}
        <input
          type="text"
          placeholder="Rechercher un club FFR..."
          value={query}
          onChange={handleInput}
          onFocus={() => { setFocused(true); if (query.length >= 2) setResults(searchClubs(query)) }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="flex-1 text-sm text-fg placeholder:text-fg-faint bg-transparent focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange('', undefined); setResults([]) }}
            className="text-fg-faint hover:text-fg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-2 bg-panel border border-border-app rounded-2xl shadow-elevated z-50 overflow-hidden"
          >
            {results.map((club) => (
              <button
                key={club.code}
                type="button"
                onMouseDown={() => handleSelect(club)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-layer-5 transition-colors text-left border-b border-border-app last:border-0"
              >
                <ClubAvatar code={club.code} name={club.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-fg truncate">{club.name}</div>
                  <div className="text-[10px] text-fg-muted">{club.ligue} · {club.departmentCode}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function SeasonBadge({ phase }: { phase: SeasonPhase }) {
  const cfg = seasonPhaseConfig[phase]
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  )
}

function NextMatchCard({ event }: { event: CalendarEvent }) {
  const days = diffDays(event.date)
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-panel border border-border-app shadow-elevated p-6 space-y-3">
      <div className="absolute top-0 right-0 w-28 h-28 bg-rose-600 opacity-20 blur-3xl -mr-6 -mt-6" />
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 bg-rose-600 px-3 py-1 rounded-full">
          <Trophy className="w-3 h-3 text-paper fill-current" />
          <span className="text-[10px] font-black text-paper uppercase tracking-widest">Prochain match</span>
        </div>
        {event.is_home !== undefined && (
          <div className="flex items-center gap-1 text-fg-muted">
            {event.is_home
              ? <><Home className="w-3 h-3" /><span className="text-[10px] font-bold">Domicile</span></>
              : <><MapPin className="w-3 h-3" /><span className="text-[10px] font-bold">Extérieur</span></>
            }
          </div>
        )}
      </div>

      <div>
        <div className="text-4xl font-black text-fg leading-none">
          {days === 0 ? "Aujourd'hui !" : days === 1 ? 'Demain' : `J−${days}`}
        </div>
        <div className="text-sm text-fg-muted mt-1 capitalize">{formatDateFR(event.date)}</div>
        {event.kickoff_time && (
          <div className="text-xs text-rose-400 font-bold mt-0.5">Coup d'envoi {event.kickoff_time}</div>
        )}
      </div>

      {event.opponent && (
        <div className="flex items-center gap-2 text-fg">
          <ClubAvatar code={event.opponent_code} name={event.opponent} size="md" />
          <span className="font-bold">vs {event.opponent}</span>
        </div>
      )}
    </div>
  )
}

function EventRow({
  event,
  now,
  onRemove,
  onHide,
  onUpdateLoad,
  isPremium,
}: {
  event: CalendarEvent
  now: number
  onRemove: (id: string) => void
  onHide?: (id: string) => void
  onUpdateLoad?: (eventId: string, rpe: number, durationMin: number) => Promise<void>
  isPremium?: boolean
}) {
  const cfg = eventTypeConfig[event.type]
  const Icon = cfg.icon
  const days = diffDays(event.date)
  const isPast = days < 0
  const showLoadForm = isPast && event.type === 'match'

  const [loadOpen, setLoadOpen] = useState(false)
  const [rpeInput, setRpeInput] = useState(event.rpe ?? 7)
  const [durationInput, setDurationInput] = useState(event.duration_min ?? 80)
  const [saving, setSaving] = useState(false)

  const handleSaveLoad = async () => {
    if (!onUpdateLoad) return
    setSaving(true)
    await onUpdateLoad(event.id, rpeInput, durationInput)
    setSaving(false)
    setLoadOpen(false)
  }

  const isFFR = event.source === 'ffr_import'
  const hasOverride = !!event.user_override
  return (
    <div className={`rounded-2xl ${isPast && !showLoadForm ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 p-3">
        {event.type === 'match' && event.opponent_code ? (
          <ClubAvatar code={event.opponent_code} name={event.opponent} size="md" />
        ) : (
          <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-fg">{cfg.label}</span>
            {event.opponent && (
              <span className="text-xs text-fg-soft truncate">vs {event.opponent}</span>
            )}
            {isFFR && (
              <span className="text-[9px] font-black text-info bg-info-bg px-1.5 py-0.5 rounded-full">FFR</span>
            )}
          </div>
          <div className="text-xs text-fg-muted capitalize">
            {formatDateFR(event.date)}
            {hasOverride && <span className="text-amber-400 ml-1">(modifié)</span>}
          </div>
          {event.kickoff_time && (
            <div className="text-[10px] text-fg-muted">{event.kickoff_time}</div>
          )}
          {isFFR && event.match_day && event.competition_name && (
            <div className="text-[10px] text-info/70">J{event.match_day} · {event.competition_name}</div>
          )}
          {event.venue && (
            <div className="text-[10px] text-fg-faint flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />{event.venue}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isPast && days <= 7 && (
            <span className="text-[10px] font-black text-rose-400 bg-rose-900/20 px-2 py-0.5 rounded-full">
              {days === 0 ? "Auj." : `J−${days}`}
            </span>
          )}
          {showLoadForm && event.rpe && event.duration_min && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Charge ✓
            </span>
          )}
          {isFFR && onHide ? (
            <button
              type="button"
              onClick={() => onHide(event.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-fg-faint hover:text-warn-strong hover:bg-warn-bg-muted transition-colors"
              aria-label="Masquer"
              title="Masquer ce match"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRemove(event.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-fg-faint hover:text-danger hover:bg-danger-bg transition-colors"
              aria-label="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Charge match — matchs passés uniquement */}
      {showLoadForm && onUpdateLoad && (
        <div className="px-3 pb-3">
          {!loadOpen && !event.rpe ? (
            <button
              type="button"
              onClick={() => setLoadOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-brand bg-brand-soft hover:bg-brand-medium px-3 py-1.5 rounded-xl transition-colors rf-focus-ring"
            >
              <Activity className="w-3 h-3" />
              Enregistrer la charge match
            </button>
          ) : loadOpen ? (
            <div className="bg-layer-5 rounded-2xl p-3 space-y-3">
              <p className="text-[11px] font-black text-fg-soft uppercase tracking-wide">Charge match</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wide">RPE perçu</label>
                    <span className="text-xs font-black text-fg-emphasis">{rpeInput}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={rpeInput}
                    onChange={(e) => setRpeInput(Number(e.target.value))}
                    className="w-full accent-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wide block mb-1">Durée (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationInput}
                    onChange={(e) => setDurationInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border-app bg-layer-5 text-sm text-fg-secondary focus:outline-none focus:border-brand rf-focus-ring transition-all"
                  />
                </div>
                <p className="text-[10px] text-fg-muted">
                  Charge ≈ {rpeInput * durationInput} UA · impact ACWR automatique
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveLoad}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-on-brand text-xs font-black transition-colors rf-focus-ring"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => setLoadOpen(false)}
                  className="px-3 py-2 rounded-xl border border-border-app text-xs font-bold text-fg-soft hover:border-layer-15 transition-colors rf-focus-ring"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          {/* Premium: Recovery timeline (T2.4) */}
          {isPremium && event.rpe && event.duration_min && (() => {
            const isHigh = event.rpe >= 7 && event.duration_min >= 60
            const recoveryRange = isHigh ? '72-96h' : '48-72h'
            const recoveryHours = isHigh ? 84 : 60
            const matchDate = new Date(event.date + 'T00:00:00')
            const hoursElapsed = Math.max(0, (now - matchDate.getTime()) / (1000 * 60 * 60))
            const pct = Math.min(100, (hoursElapsed / recoveryHours) * 100)
            const isRecovered = hoursElapsed >= recoveryHours

            return (
              <div className="mt-2 bg-layer-5 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-fg-soft uppercase tracking-wide">Récupération</p>
                  <p className={`text-[10px] font-black ${isRecovered ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isRecovered ? 'Récupéré' : recoveryRange}
                  </p>
                </div>
                <div className="h-1.5 bg-layer-10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isRecovered ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ─── Mini Calendar ───────────────────────────────────────────

function MiniCalendar({
  year,
  month,
  events,
  clubDays,
  scDays,
  onSelectDate,
}: {
  year: number
  month: number
  events: CalendarEvent[]
  clubDays: DayOfWeek[]
  scDays: DayOfWeek[]
  onSelectDate: (date: string) => void
}) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const todayStr = toDateStr(new Date())

  // Day of week for first day (Mon=0 display)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ]

  const eventDates = new Map<string, CalendarEventType>()
  events.forEach((e) => {
    const [y, m] = e.date.split('-').map(Number)
    if (y === year && m - 1 === month) {
      eventDates.set(e.date, e.type)
    }
  })

  return (
    <div className="bg-layer-5 border border-border-app rounded-[2rem] p-5">
      {/* Legend */}
      {(clubDays.length > 0 || scDays.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-3 pb-3 border-b border-border-app">
          {clubDays.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold text-fg-muted">Club</span>
            </div>
          )}
          {scDays.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[10px] font-bold text-fg-muted">Muscu</span>
            </div>
          )}
        </div>
      )}
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
          const eventType = eventDates.get(dateStr)

          // Day-of-week for this cell (0=Sun)
          const cellDate = new Date(year, month, day)
          const cellDow = cellDate.getDay() as DayOfWeek
          const isClubDay = clubDays.includes(cellDow)
          const isScDay = scDays.includes(cellDow)

          let dotColor = ''
          if (eventType === 'match') dotColor = 'bg-rose-500'
          else if (eventType === 'rest') dotColor = 'bg-info'
          else if (eventType === 'unavailable') dotColor = 'bg-orange-400'

          const isBothDay = isClubDay && isScDay
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-colors overflow-hidden
                ${isToday ? 'bg-brand text-on-brand' : 'hover:bg-layer-10 text-fg-emphasis'}
                ${isClubDay && !isToday && !isBothDay ? 'bg-emerald-900/20' : ''}
                ${isScDay && !isClubDay && !isToday ? 'bg-rose-900/20' : ''}
                ${isBothDay && !isToday ? 'bg-gradient-to-b from-rose-900/20 to-emerald-900/20' : ''}
                ${eventType ? 'ring-1 ring-inset ' + (eventType === 'match' ? 'ring-danger-bd' : eventType === 'rest' ? 'ring-info-bd' : 'ring-tone-orange-bd') : ''}
              `}
            >
              {day}
              <div className="absolute bottom-1 flex gap-0.5">
                {isClubDay && <span className="w-1 h-1 rounded-full bg-emerald-400" aria-hidden />}
                {isScDay && <span className="w-1 h-1 rounded-full bg-rose-400" aria-hidden />}
                {dotColor && !isClubDay && !isScDay && <span className={`w-1 h-1 rounded-full ${dotColor}`} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day Detail Modal (journée coupée en deux : S&C + rugby) ───

interface DayDetailModalProps {
  dateStr: string
  now: number
  clubSchedule?: { clubDays: { day: DayOfWeek; time?: string }[] }
  clubDays: DayOfWeek[]
  scDays: DayOfWeek[]
  eventsOnDate: CalendarEvent[]
  onClose: () => void
  onAddEvent: () => void
  onRemoveEvent: (id: string) => void
  onUpdateMatchLoad: (id: string, rpe: number, durationMin: number) => Promise<void>
  isPremium?: boolean
}

function DayDetailModal({
  dateStr,
  now: modalNow,
  clubSchedule,
  clubDays,
  scDays,
  eventsOnDate,
  onClose,
  onAddEvent,
  onRemoveEvent,
  onUpdateMatchLoad,
  isPremium: modalIsPremium,
}: DayDetailModalProps) {
  const dow = new Date(dateStr + 'T12:00:00').getDay() as DayOfWeek
  const isScDay = scDays.includes(dow)
  const isClubDay = clubDays.includes(dow)
  const clubDayInfo = clubSchedule?.clubDays.find((d) => d.day === dow)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end justify-center p-4">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-app border border-border-app rounded-[2rem] p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-fg capitalize">{formatDateFR(dateStr)}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:border-layer-15 rf-focus-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Programme récurrent — journée coupée en deux */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-fg-muted">Programmé</p>
          <div className="space-y-2">
            {isScDay && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-900/20 border border-rose-500/20">
                <Dumbbell className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-400">Muscu</p>
                  <p className="text-[11px] text-fg-emphasis mt-0.5">
                    {isClubDay
                      ? 'Matin recommandé · Séance adaptée (−20–30% volume) si rugby en intensité réduite'
                      : 'Séance S&C prévue'}
                  </p>
                </div>
              </div>
            )}
            {isClubDay && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-900/20 border border-emerald-500/20">
                <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-400">Entraînement rugby</p>
                  {clubDayInfo?.time ? (
                    <p className="text-[11px] text-fg-emphasis mt-0.5">{clubDayInfo.time}</p>
                  ) : (
                    <p className="text-[11px] text-fg-emphasis mt-0.5">Collectif club</p>
                  )}
                </div>
              </div>
            )}
            {!isScDay && !isClubDay && (
              <p className="text-xs text-fg-muted py-2">Aucune séance planifiée ce jour.</p>
            )}
          </div>
        </div>

        {/* Événements du jour */}
        {eventsOnDate.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-fg-muted">Événements</p>
            <div className="space-y-2">
              {eventsOnDate.map((event) => (
                <EventRow key={event.id} event={event} now={modalNow} onRemove={onRemoveEvent} onUpdateLoad={onUpdateMatchLoad} isPremium={modalIsPremium} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAddEvent}
            className="flex-1 py-3 rounded-2xl border-2 border-brand text-brand font-black uppercase tracking-wide hover:bg-brand-soft transition-colors rf-focus-ring"
          >
            Ajouter un événement
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-layer-5 border border-border-app text-fg-emphasis font-bold hover:bg-layer-10 transition-colors rf-focus-ring"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Add Event Modal ──────────────────────────────────────────

interface AddEventModalProps {
  initialDate?: string
  existingEvents?: CalendarEvent[]
  onClose: () => void
  onSave: (payload: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>
}

function AddEventModal({ initialDate, existingEvents, onClose, onSave }: AddEventModalProps) {
  const [type, setType] = useState<CalendarEventType>('match')
  const [date, setDate] = useState(initialDate ?? toDateStr(new Date()))
  const [kickoffTime, setKickoffTime] = useState('15:00')
  const [opponent, setOpponent] = useState('')
  const [opponentCode, setOpponentCode] = useState<string | undefined>()
  const [isHome, setIsHome] = useState<boolean | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [confirmDuplicate, setConfirmDuplicate] = useState(false)

  const handleOpponentChange = (name: string, code?: string) => {
    setOpponent(name)
    setOpponentCode(code)
  }

  // Check for duplicate FFR match
  const duplicateFFR = useMemo(() => {
    if (type !== 'match' || !existingEvents) return null
    return existingEvents.find(e =>
      e.source === 'ffr_import' &&
      e.type === 'match' &&
      Math.abs(diffDays(e.date) - diffDays(date)) <= 1 &&
      opponentCode && e.opponent_code === opponentCode
    ) ?? null
  }, [type, date, opponentCode, existingEvents])

  const handleSave = async () => {
    // Show warning if duplicate exists and not yet confirmed
    if (duplicateFFR && !confirmDuplicate) {
      setConfirmDuplicate(true)
      return
    }
    setSaving(true)
    await onSave({
      type,
      date,
      ...(type === 'match' && kickoffTime ? { kickoff_time: kickoffTime } : {}),
      ...(type === 'match' && opponent ? { opponent } : {}),
      ...(type === 'match' && opponentCode ? { opponent_code: opponentCode } : {}),
      ...(type === 'match' && isHome !== undefined ? { is_home: isHome } : {}),
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end justify-center p-4">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-app border border-border-app rounded-[2rem] p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-fg">Ajouter un événement</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:border-layer-15 rf-focus-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(eventTypeConfig) as CalendarEventType[]).map((t) => {
              const cfg = eventTypeConfig[t]
              const Icon = cfg.icon
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all rf-focus-ring ${
                    type === t
                      ? `border-current ${cfg.color} ${cfg.bg}`
                      : 'border-border-app text-fg-muted hover:border-layer-15'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-border-app bg-layer-5 rounded-2xl px-4 py-3 text-sm font-bold text-fg focus:outline-none focus:border-brand rf-focus-ring"
          />
        </div>

        {/* Match-specific fields */}
        {type === 'match' && (
          <>
            <div>
              <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Coup d'envoi</label>
              <input
                type="time"
                value={kickoffTime}
                onChange={(e) => setKickoffTime(e.target.value)}
                className="w-full border border-border-app bg-layer-5 rounded-2xl px-4 py-3 text-sm font-bold text-fg focus:outline-none focus:border-brand rf-focus-ring"
              />
            </div>

            <div>
              <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Adversaire (optionnel)</label>
              <ClubSearchInput
                value={opponent}
                clubCode={opponentCode}
                onChange={handleOpponentChange}
              />
            </div>

            <div>
              <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Lieu</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: true, label: 'Domicile', icon: Home },
                  { value: false, label: 'Extérieur', icon: MapPin },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setIsHome(value)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      isHome === value
                        ? 'border-brand text-brand bg-brand-soft'
                        : 'border-border-app text-fg-muted hover:border-layer-15'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {confirmDuplicate && duplicateFFR && (
          <div className="p-3 rounded-2xl border border-warn-bd-strong bg-warn-bg-muted space-y-2">
            <p className="text-xs text-warn-strong font-bold">Un match similaire existe déjà (import FFR)</p>
            <p className="text-[11px] text-fg-soft">
              vs {duplicateFFR.opponent} — {formatDateFR(duplicateFFR.date)}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-2xl disabled:opacity-50 text-on-brand font-black uppercase tracking-wide transition-colors rf-focus-ring ${confirmDuplicate ? 'bg-warn-button hover:bg-warn-button-hover' : 'bg-critical-strong hover:bg-critical'}`}
        >
          {saving ? 'Enregistrement...' : confirmDuplicate ? 'Ajouter quand même' : 'Ajouter'}
        </button>
      </motion.div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export function CalendarPage() {
  const {
    visibleEvents, events, nextMatch, addEvent, removeEvent, updateMatchLoad,
    hideImportedEvent, unhideImportedEvent, refreshFromFFR, hiddenCount, ffrCount, manualCount, loading,
  } = useCalendar()
  const { profile, updateProfile } = useProfile()
  const adaptiveSchedule = useAdaptiveSchedule(profile, events)
  const { isPremium: calendarIsPremium } = useFeatureAccess()
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [showHidden, setShowHidden] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)
  const [showPlayoffExitModal, setShowPlayoffExitModal] = useState(false)

  // Season phase from the single source of truth (planning context)
  const seasonPhase = useMemo(() => {
    const todayIso = toDateStr(new Date())
    const { inputs } = buildAthletePlanningInputs({
      profile, events, logs: [], today: todayIso, fatigue: 'OK',
    })
    const ctx = detectAnnualPlanningContext(inputs)
    return cycleToSeasonPhase(ctx.cycle)
  }, [profile, events])

  // Recurring club and S&C days from profile
  const clubDays: DayOfWeek[] = profile.clubSchedule?.clubDays.map((d) => d.day) ?? []
  const scDays: DayOfWeek[] =
    adaptiveSchedule?.sessions.map((s) => s.day) ??
    TRAINING_DAYS_DEFAULT[profile.weeklySessions]

  const today = new Date()
  const [nowMs] = useState(() => Date.now())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const upcomingEvents = visibleEvents.filter((e) => e.date >= toDateStr(today))
  const pastEvents = visibleEvents.filter((e) => e.date < toDateStr(today))
  const hiddenEvents = events.filter((e) => e.user_hidden)

  const handleRefreshFFR = async () => {
    if (!profile.ffrCompetitionId || !profile.clubCode) return
    setRefreshing(true)
    setRefreshMsg(null)
    const result = await refreshFromFFR(profile.ffrCompetitionId, profile.clubCode)
    setRefreshing(false)
    if (result.error) {
      setRefreshMsg(`Erreur : ${result.error}`)
    } else {
      setRefreshMsg(`${result.imported} match${result.imported > 1 ? 's' : ''} mis à jour`)
      setTimeout(() => setRefreshMsg(null), 3000)
    }
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const [showDayDetail, setShowDayDetail] = useState(false)

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setShowDayDetail(true)
    setShowModal(false)
  }

  const handleAddEvent = async (payload: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    await addEvent(payload)
  }

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* ── Header ── */}
      <PageHeader title="Calendrier" backTo="/home" right={<SeasonBadge phase={seasonPhase} />} />

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto relative">

        {/* ── Next Match Card ── */}
        {nextMatch && <NextMatchCard event={nextMatch} />}

        {!nextMatch && !loading && (
          <div className="bg-layer-5 border border-border-app rounded-[2rem] p-6 text-center space-y-2">
            <div className="w-12 h-12 bg-layer-5 rounded-2xl flex items-center justify-center text-fg-ghost mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-fg">Aucun match planifié</p>
            <p className="text-xs text-fg-muted">Ajoute tes matchs pour activer le mode in-season et adapter ton programme.</p>
          </div>
        )}

        {/* ── Calendar Grid ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:border-layer-15 transition-colors rf-focus-ring">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-black uppercase tracking-wider text-fg-emphasis">
              {MONTH_NAMES_FR[calMonth]} {calYear}
            </h2>
            <button type="button" onClick={nextMonth} className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:border-layer-15 transition-colors rf-focus-ring">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <MiniCalendar
            year={calYear}
            month={calMonth}
            events={visibleEvents}
            clubDays={clubDays}
            scDays={scDays}
            onSelectDate={handleSelectDate}
          />
        </section>

        {/* ── FFR Sync Bar ── */}
        {(ffrCount > 0 || profile.ffrCompetitionId) && (
          <section className="flex items-center justify-between bg-info-bg/80 border border-info-bd rounded-2xl px-4 py-2.5">
            <div className="text-xs text-fg-soft">
              {ffrCount > 0 && <span className="text-info font-bold">{ffrCount} FFR</span>}
              {ffrCount > 0 && manualCount > 0 && <span> · </span>}
              {manualCount > 0 && <span>{manualCount} manuel{manualCount > 1 ? 's' : ''}</span>}
            </div>
            <button
              type="button"
              onClick={handleRefreshFFR}
              disabled={refreshing || !profile.ffrCompetitionId}
              className="flex items-center gap-1.5 text-[11px] font-bold text-info hover:text-info/80 disabled:opacity-50 transition-colors rf-focus-ring"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser FFR
            </button>
          </section>
        )}

        {refreshMsg && (
          <div className={`text-xs text-center py-1.5 rounded-xl ${refreshMsg.startsWith('Erreur') ? 'bg-danger-bg text-danger' : 'bg-ok-bg text-ok-strong'}`}>
            {refreshMsg}
          </div>
        )}

        {/* ── Upcoming Events ── */}
        {upcomingEvents.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">À venir</h2>
            <div className="bg-layer-5 border border-border-app rounded-[2rem] p-3 divide-y divide-border-app">
              {upcomingEvents.map((event) => (
                <EventRow key={event.id} event={event} now={nowMs} onRemove={removeEvent} onHide={hideImportedEvent} onUpdateLoad={updateMatchLoad} isPremium={calendarIsPremium} />
              ))}
            </div>
          </section>
        )}

        {/* ── Past Events (collapsed) ── */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">Passés</h2>
            <div className="bg-layer-5 border border-border-app rounded-[2rem] p-3 divide-y divide-border-app">
              {pastEvents.slice(-5).reverse().map((event) => (
                <EventRow key={event.id} event={event} now={nowMs} onRemove={removeEvent} onHide={hideImportedEvent} onUpdateLoad={updateMatchLoad} isPremium={calendarIsPremium} />
              ))}
            </div>
          </section>
        )}

        {/* ── Hidden Events ── */}
        {hiddenCount > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setShowHidden(!showHidden)}
              className="flex items-center gap-2 text-xs font-bold text-fg-faint hover:text-fg-soft transition-colors mb-2 rf-focus-ring"
            >
              <Eye className="w-3.5 h-3.5" />
              {showHidden ? 'Masquer' : `Voir ${hiddenCount} match${hiddenCount > 1 ? 's' : ''} masqué${hiddenCount > 1 ? 's' : ''}`}
            </button>
            {showHidden && (
              <div className="bg-layer-5 border border-border-app rounded-[2rem] p-3 divide-y divide-border-app opacity-60">
                {hiddenEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3">
                    <div>
                      <span className="text-sm font-bold text-fg-emphasis">{event.opponent ?? 'Match'}</span>
                      <span className="text-xs text-fg-faint ml-2">{formatDateFR(event.date)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => unhideImportedEvent(event.id)}
                      className="text-[11px] font-bold text-info hover:text-info/80 transition-colors rf-focus-ring"
                    >
                      Réafficher
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Season Info ── */}
        <section>
          <div className="bg-layer-5 border border-border-app rounded-[2rem] p-5 space-y-3">
            <h3 className="text-sm font-black text-fg">Phase de saison</h3>
            <div className="flex items-center gap-3">
              <SeasonBadge phase={seasonPhase} />
              <p className="text-xs text-fg-soft flex-1">
                {seasonPhase === 'off-season' && 'Période de récupération et hypertrophie. Charge réduite.'}
                {seasonPhase === 'pre-season' && 'Reprise progressive. Construire la base de force.'}
                {seasonPhase === 'in-season' && 'Mode compétition actif. Volume −30%, intensité maintenue.'}
                {seasonPhase === 'playoffs' && 'Phase finale. Tapering en cours. Volume minimal.'}
              </p>
            </div>
            <p className="text-[10px] text-fg-muted">Détecté automatiquement via ton calendrier de matchs.</p>
            {profile.planningAnchors?.manualPlayoffs && (
              <button
                type="button"
                onClick={() => setShowPlayoffExitModal(true)}
                className="mt-1 text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2"
              >
                Désactiver le mode Playoffs
              </button>
            )}
          </div>
        </section>

      </main>

      {/* ── FAB ── */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => { setSelectedDate(undefined); setShowDayDetail(false); setShowModal(true) }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-brand rounded-2xl shadow-brand-float flex items-center justify-center z-40 rf-focus-ring"
        aria-label="Ajouter un événement"
      >
        <Plus className="w-6 h-6 text-on-brand" />
      </motion.button>

      {/* ── Day Detail Modal (S&C + rugby, journée coupée en deux) ── */}
      <AnimatePresence>
        {showDayDetail && selectedDate && (
          <DayDetailModal
            dateStr={selectedDate}
            now={nowMs}
            clubSchedule={profile.clubSchedule}
            clubDays={clubDays}
            scDays={scDays}
            eventsOnDate={events.filter((e) => e.date === selectedDate)}
            onClose={() => setShowDayDetail(false)}
            onAddEvent={() => { setShowDayDetail(false); setShowModal(true) }}
            onRemoveEvent={removeEvent}
            onUpdateMatchLoad={updateMatchLoad}
            isPremium={calendarIsPremium}
          />
        )}
      </AnimatePresence>

      {/* ── Add Event Modal ── */}
      <AnimatePresence>
        {showModal && (
          <AddEventModal
            initialDate={selectedDate}
            existingEvents={visibleEvents}
            onClose={() => setShowModal(false)}
            onSave={handleAddEvent}
          />
        )}
      </AnimatePresence>

      {/* ── Playoff Exit Modal ── */}
      <AnimatePresence>
        {showPlayoffExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
            onClick={() => setShowPlayoffExitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-panel border border-border-app rounded-[2rem] p-6 space-y-5"
            >
              <h3 className="text-base font-black text-fg">Désactiver les Playoffs</h3>
              <p className="text-sm text-fg-emphasis leading-relaxed">
                Pourquoi souhaites-tu quitter le mode Playoffs ?
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const anchors = { ...profile.planningAnchors }
                    delete anchors.manualPlayoffs
                    updateProfile({ planningAnchors: anchors })
                    setShowPlayoffExitModal(false)
                  }}
                  className="w-full text-left px-4 py-3.5 bg-ok-bg-muted border border-ok-bd rounded-2xl hover:border-ok-strong/50 transition-colors rf-focus-ring"
                >
                  <p className="text-sm font-bold text-ok-strong">La compétition continue</p>
                  <p className="text-xs text-fg-soft mt-0.5">Retour au programme en saison (3 séances, volume normal)</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const anchors2 = { ...profile.planningAnchors }
                    delete anchors2.manualPlayoffs
                    const todayIso = toDateStr(new Date())
                    updateProfile({
                      seasonMode: 'off_season',
                      planningAnchors: { ...anchors2, seasonEndedAt: todayIso },
                    })
                    setShowPlayoffExitModal(false)
                  }}
                  className="w-full text-left px-4 py-3.5 bg-info-bg border border-info-bd rounded-2xl hover:border-info/60 transition-colors rf-focus-ring"
                >
                  <p className="text-sm font-bold text-info">Ma saison est terminée</p>
                  <p className="text-xs text-fg-soft mt-0.5">Passage en hors-saison (récupération puis hypertrophie)</p>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPlayoffExitModal(false)}
                className="w-full text-center text-xs text-fg-muted hover:text-fg-emphasis pt-1 rf-focus-ring"
              >
                Annuler
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
