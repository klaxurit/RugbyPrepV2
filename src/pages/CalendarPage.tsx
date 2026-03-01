import { useRef, useState } from 'react'
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
} from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { useCalendar } from '../hooks/useCalendar'
import { useProfile } from '../hooks/useProfile'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import ffrClubs from '../data/ffrClubs.v2021.json'
import type { CalendarEventType, CalendarEvent, SeasonPhase, DayOfWeek } from '../types/training'
import { TRAINING_DAYS_DEFAULT } from '../services/program/scheduleOptimizer'

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
  'off-season': { label: 'Hors-saison', color: 'text-slate-600', bg: 'bg-slate-100' },
  'pre-season': { label: 'Pré-saison', color: 'text-amber-700', bg: 'bg-amber-50' },
  'in-season': { label: 'En saison', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  'playoffs': { label: 'Playoffs', color: 'text-rose-700', bg: 'bg-rose-50' },
}

const eventTypeConfig: Record<CalendarEventType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  match: { label: 'Match', icon: Trophy, color: 'text-rose-600', bg: 'bg-rose-50' },
  rest: { label: 'Repos', icon: Bed, color: 'text-blue-600', bg: 'bg-blue-50' },
  unavailable: { label: 'Indisponible', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
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
    <div className={`${sizeClass} rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name ?? ''}
          className="w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <span className="font-black text-slate-500">{monogram}</span>
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
        focused ? 'border-rose-400 ring-2 ring-rose-100' : 'border-gray-200'
      }`}>
        {clubCode ? (
          <ClubAvatar code={clubCode} name={query} size="sm" />
        ) : (
          <Search className="w-4 h-4 text-slate-300 flex-shrink-0" />
        )}
        <input
          type="text"
          placeholder="Rechercher un club FFR..."
          value={query}
          onChange={handleInput}
          onFocus={() => { setFocused(true); if (query.length >= 2) setResults(searchClubs(query)) }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="flex-1 text-sm text-slate-900 placeholder-slate-300 bg-transparent focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange('', undefined); setResults([]) }}
            className="text-slate-300 hover:text-slate-500 transition-colors"
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
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-slate-100 z-50 overflow-hidden"
          >
            {results.map((club) => (
              <button
                key={club.code}
                type="button"
                onMouseDown={() => handleSelect(club)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <ClubAvatar code={club.code} name={club.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{club.name}</div>
                  <div className="text-[10px] text-slate-400">{club.ligue} · {club.departmentCode}</div>
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
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-xl shadow-slate-200 p-6 space-y-3">
      <div className="absolute top-0 right-0 w-28 h-28 bg-rose-600 opacity-20 blur-3xl -mr-6 -mt-6" />
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 bg-rose-600 px-3 py-1 rounded-full">
          <Trophy className="w-3 h-3 text-white fill-current" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Prochain match</span>
        </div>
        {event.is_home !== undefined && (
          <div className="flex items-center gap-1 text-slate-400">
            {event.is_home
              ? <><Home className="w-3 h-3" /><span className="text-[10px] font-bold">Domicile</span></>
              : <><MapPin className="w-3 h-3" /><span className="text-[10px] font-bold">Extérieur</span></>
            }
          </div>
        )}
      </div>

      <div>
        <div className="text-4xl font-black text-white leading-none">
          {days === 0 ? "Aujourd'hui !" : days === 1 ? 'Demain' : `J−${days}`}
        </div>
        <div className="text-sm text-slate-400 mt-1 capitalize">{formatDateFR(event.date)}</div>
        {event.kickoff_time && (
          <div className="text-xs text-rose-400 font-bold mt-0.5">Coup d'envoi {event.kickoff_time}</div>
        )}
      </div>

      {event.opponent && (
        <div className="flex items-center gap-2 text-white">
          <ClubAvatar code={event.opponent_code} name={event.opponent} size="md" />
          <span className="font-bold">vs {event.opponent}</span>
        </div>
      )}
    </div>
  )
}

function EventRow({ event, onRemove }: { event: CalendarEvent; onRemove: (id: string) => void }) {
  const cfg = eventTypeConfig[event.type]
  const Icon = cfg.icon
  const days = diffDays(event.date)
  const isPast = days < 0

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl ${isPast ? 'opacity-50' : ''}`}>
      {event.type === 'match' && event.opponent_code ? (
        <ClubAvatar code={event.opponent_code} name={event.opponent} size="md" />
      ) : (
        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{cfg.label}</span>
          {event.opponent && (
            <span className="text-xs text-slate-500 truncate">vs {event.opponent}</span>
          )}
        </div>
        <div className="text-xs text-slate-400 capitalize">{formatDateFR(event.date)}</div>
        {event.kickoff_time && (
          <div className="text-[10px] text-slate-400">{event.kickoff_time}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isPast && days <= 7 && (
          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
            {days === 0 ? "Auj." : `J−${days}`}
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(event.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
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
    <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
      {/* Legend */}
      {(clubDays.length > 0 || scDays.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-3 pb-3 border-b border-gray-50">
          {clubDays.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold text-slate-400">Club</span>
            </div>
          )}
          {scDays.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[10px] font-bold text-slate-400">Muscu</span>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES_FR.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>
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
          else if (eventType === 'rest') dotColor = 'bg-blue-400'
          else if (eventType === 'unavailable') dotColor = 'bg-orange-400'

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-colors
                ${isToday ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}
                ${isClubDay && !isToday ? 'bg-emerald-50' : ''}
                ${isScDay && !isClubDay && !isToday ? 'bg-rose-50' : ''}
                ${eventType ? 'ring-1 ring-inset ' + (eventType === 'match' ? 'ring-rose-200' : eventType === 'rest' ? 'ring-blue-200' : 'ring-orange-200') : ''}
              `}
            >
              {day}
              <div className="absolute bottom-1 flex gap-0.5">
                {isClubDay && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                {isScDay && !isClubDay && <span className="w-1 h-1 rounded-full bg-rose-400" />}
                {dotColor && !isClubDay && !isScDay && <span className={`w-1 h-1 rounded-full ${dotColor}`} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Add Event Modal ──────────────────────────────────────────

interface AddEventModalProps {
  initialDate?: string
  onClose: () => void
  onSave: (payload: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>
}

function AddEventModal({ initialDate, onClose, onSave }: AddEventModalProps) {
  const [type, setType] = useState<CalendarEventType>('match')
  const [date, setDate] = useState(initialDate ?? toDateStr(new Date()))
  const [kickoffTime, setKickoffTime] = useState('15:00')
  const [opponent, setOpponent] = useState('')
  const [opponentCode, setOpponentCode] = useState<string | undefined>()
  const [isHome, setIsHome] = useState<boolean | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  const handleOpponentChange = (name: string, code?: string) => {
    setOpponent(name)
    setOpponentCode(code)
  }

  const handleSave = async () => {
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
        className="w-full max-w-md bg-white rounded-[2rem] p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Ajouter un événement</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl border border-gray-200 flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2 block">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(eventTypeConfig) as CalendarEventType[]).map((t) => {
              const cfg = eventTypeConfig[t]
              const Icon = cfg.icon
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                    type === t
                      ? `border-current ${cfg.color} ${cfg.bg}`
                      : 'border-gray-100 text-slate-400 hover:border-gray-200'
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
          <label className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Match-specific fields */}
        {type === 'match' && (
          <>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2 block">Coup d'envoi</label>
              <input
                type="time"
                value={kickoffTime}
                onChange={(e) => setKickoffTime(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2 block">Adversaire (optionnel)</label>
              <ClubSearchInput
                value={opponent}
                clubCode={opponentCode}
                onChange={handleOpponentChange}
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2 block">Lieu</label>
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
                        ? 'border-slate-900 text-slate-900 bg-slate-50'
                        : 'border-gray-100 text-slate-400 hover:border-gray-200'
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

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black uppercase tracking-wide transition-colors"
        >
          {saving ? 'Enregistrement...' : 'Ajouter'}
        </button>
      </motion.div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export function CalendarPage() {
  const { events, nextMatch, seasonPhase, addEvent, removeEvent, loading } = useCalendar()
  const { profile } = useProfile()
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

  // Recurring club and S&C days from profile
  const clubDays: DayOfWeek[] = profile.clubSchedule?.clubDays.map((d) => d.day) ?? []
  const scDays: DayOfWeek[] =
    profile.scSchedule?.sessions.map((s) => s.day) ??
    TRAINING_DAYS_DEFAULT[profile.weeklySessions]

  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const upcomingEvents = events.filter((e) => e.date >= toDateStr(today))
  const pastEvents = events.filter((e) => e.date < toDateStr(today))

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setShowModal(true)
  }

  const handleAddEvent = async (payload: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    await addEvent(payload)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-24">

      {/* ── Header ── */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-40">
        <div>
          <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Calendrier</h1>
        </div>
        <SeasonBadge phase={seasonPhase} />
      </header>

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto">

        {/* ── Next Match Card ── */}
        {nextMatch && <NextMatchCard event={nextMatch} />}

        {!nextMatch && !loading && (
          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">Aucun match planifié</p>
            <p className="text-xs text-slate-400">Ajoute tes matchs pour activer le mode in-season et adapter ton programme.</p>
          </div>
        )}

        {/* ── Calendar Grid ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-9 h-9 rounded-2xl border border-gray-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
              {MONTH_NAMES_FR[calMonth]} {calYear}
            </h2>
            <button type="button" onClick={nextMonth} className="w-9 h-9 rounded-2xl border border-gray-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <MiniCalendar
            year={calYear}
            month={calMonth}
            events={events}
            clubDays={clubDays}
            scDays={scDays}
            onSelectDate={handleSelectDate}
          />
        </section>

        {/* ── Upcoming Events ── */}
        {upcomingEvents.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">À venir</h2>
            <div className="bg-white border border-gray-100 rounded-[2rem] p-3 shadow-sm divide-y divide-gray-50">
              {upcomingEvents.map((event) => (
                <EventRow key={event.id} event={event} onRemove={removeEvent} />
              ))}
            </div>
          </section>
        )}

        {/* ── Past Events (collapsed) ── */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Passés</h2>
            <div className="bg-white border border-gray-100 rounded-[2rem] p-3 shadow-sm divide-y divide-gray-50">
              {pastEvents.slice(-5).reverse().map((event) => (
                <EventRow key={event.id} event={event} onRemove={removeEvent} />
              ))}
            </div>
          </section>
        )}

        {/* ── Season Info ── */}
        <section>
          <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900">Phase de saison</h3>
            <div className="flex items-center gap-3">
              <SeasonBadge phase={seasonPhase} />
              <p className="text-xs text-slate-500 flex-1">
                {seasonPhase === 'off-season' && 'Période de récupération et hypertrophie. Charge réduite.'}
                {seasonPhase === 'pre-season' && 'Reprise progressive. Construire la base de force.'}
                {seasonPhase === 'in-season' && 'Mode compétition actif. Volume −30%, intensité maintenue.'}
                {seasonPhase === 'playoffs' && 'Phase finale. Tapering en cours. Volume minimal.'}
              </p>
            </div>
            <p className="text-[10px] text-slate-400">Détecté automatiquement via ton calendrier de matchs.</p>
          </div>
        </section>

      </main>

      {/* ── FAB ── */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => { setSelectedDate(undefined); setShowModal(true) }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200 flex items-center justify-center z-40"
        aria-label="Ajouter un événement"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* ── Add Modal ── */}
      <AnimatePresence>
        {showModal && (
          <AddEventModal
            initialDate={selectedDate}
            onClose={() => setShowModal(false)}
            onSave={handleAddEvent}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
