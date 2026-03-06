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
  CheckCircle2,
  Activity,
  Dumbbell,
} from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { useCalendar } from '../hooks/useCalendar'
import { useProfile } from '../hooks/useProfile'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import ffrClubs from '../data/ffrClubs.v2021.json'
import type { CalendarEventType, CalendarEvent, SeasonPhase, DayOfWeek, ClubSchedule } from '../types/training'
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
  'off-season': { label: 'Hors-saison', color: 'text-white/60', bg: 'bg-white/10' },
  'pre-season': { label: 'Pré-saison', color: 'text-amber-400', bg: 'bg-amber-900/20' },
  'in-season': { label: 'En saison', color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
  'playoffs': { label: 'Playoffs', color: 'text-rose-400', bg: 'bg-rose-900/20' },
}

const eventTypeConfig: Record<CalendarEventType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  match: { label: 'Match', icon: Trophy, color: 'text-rose-400', bg: 'bg-rose-900/20' },
  rest: { label: 'Repos', icon: Bed, color: 'text-blue-400', bg: 'bg-blue-900/20' },
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
    <div className={`${sizeClass} rounded-xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name ?? ''}
          className="w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <span className="font-black text-white/50">{monogram}</span>
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
        focused ? 'border-[#ff6b35] ring-2 ring-[#ff6b35]/20' : 'border-white/10'
      }`}>
        {clubCode ? (
          <ClubAvatar code={clubCode} name={query} size="sm" />
        ) : (
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
        )}
        <input
          type="text"
          placeholder="Rechercher un club FFR..."
          value={query}
          onChange={handleInput}
          onFocus={() => { setFocused(true); if (query.length >= 2) setResults(searchClubs(query)) }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="flex-1 text-sm text-white placeholder-white/30 bg-transparent focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange('', undefined); setResults([]) }}
            className="text-white/30 hover:text-white/60 transition-colors"
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
            className="absolute top-full left-0 right-0 mt-2 bg-[#23140f] border border-white/10 rounded-2xl shadow-xl shadow-black/50 z-50 overflow-hidden"
          >
            {results.map((club) => (
              <button
                key={club.code}
                type="button"
                onMouseDown={() => handleSelect(club)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/10 last:border-0"
              >
                <ClubAvatar code={club.code} name={club.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{club.name}</div>
                  <div className="text-[10px] text-white/40">{club.ligue} · {club.departmentCode}</div>
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
    <div className="relative overflow-hidden rounded-[2rem] bg-[#23140f] border border-white/10 shadow-xl shadow-black/50 p-6 space-y-3">
      <div className="absolute top-0 right-0 w-28 h-28 bg-rose-600 opacity-20 blur-3xl -mr-6 -mt-6" />
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 bg-rose-600 px-3 py-1 rounded-full">
          <Trophy className="w-3 h-3 text-white fill-current" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Prochain match</span>
        </div>
        {event.is_home !== undefined && (
          <div className="flex items-center gap-1 text-white/40">
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
        <div className="text-sm text-white/40 mt-1 capitalize">{formatDateFR(event.date)}</div>
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

function EventRow({
  event,
  onRemove,
  onUpdateLoad,
}: {
  event: CalendarEvent
  onRemove: (id: string) => void
  onUpdateLoad?: (eventId: string, rpe: number, durationMin: number) => Promise<void>
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
            <span className="text-sm font-bold text-white">{cfg.label}</span>
            {event.opponent && (
              <span className="text-xs text-white/50 truncate">vs {event.opponent}</span>
            )}
          </div>
          <div className="text-xs text-white/40 capitalize">{formatDateFR(event.date)}</div>
          {event.kickoff_time && (
            <div className="text-[10px] text-white/40">{event.kickoff_time}</div>
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
          <button
            type="button"
            onClick={() => onRemove(event.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-900/20 transition-colors"
            aria-label="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Charge match — matchs passés uniquement */}
      {showLoadForm && onUpdateLoad && (
        <div className="px-3 pb-3">
          {!loadOpen && !event.rpe ? (
            <button
              type="button"
              onClick={() => setLoadOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#ff6b35] bg-[#ff6b35]/10 hover:bg-[#ff6b35]/20 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Activity className="w-3 h-3" />
              Enregistrer la charge match
            </button>
          ) : loadOpen ? (
            <div className="bg-white/5 rounded-2xl p-3 space-y-3">
              <p className="text-[11px] font-black text-white/50 uppercase tracking-wide">Charge match</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wide">RPE perçu</label>
                    <span className="text-xs font-black text-white/70">{rpeInput}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={rpeInput}
                    onChange={(e) => setRpeInput(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wide block mb-1">Durée (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationInput}
                    onChange={(e) => setDurationInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] transition-all [color-scheme:dark]"
                  />
                </div>
                <p className="text-[10px] text-white/40">
                  Charge ≈ {rpeInput * durationInput} UA · impact ACWR automatique
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveLoad}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-[#ff6b35] hover:bg-[#e55a2b] disabled:opacity-50 text-white text-xs font-black transition-colors"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => setLoadOpen(false)}
                  className="px-3 py-2 rounded-xl border border-white/10 text-xs font-bold text-white/50 hover:border-white/25 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}
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
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5">
      {/* Legend */}
      {(clubDays.length > 0 || scDays.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-3 pb-3 border-b border-white/10">
          {clubDays.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold text-white/40">Club</span>
            </div>
          )}
          {scDays.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[10px] font-bold text-white/40">Muscu</span>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES_FR.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-black text-white/40 uppercase">{d}</div>
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

          const isBothDay = isClubDay && isScDay
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-colors overflow-hidden
                ${isToday ? 'bg-[#ff6b35] text-white' : 'hover:bg-white/10 text-white/70'}
                ${isClubDay && !isToday && !isBothDay ? 'bg-emerald-900/20' : ''}
                ${isScDay && !isClubDay && !isToday ? 'bg-rose-900/20' : ''}
                ${isBothDay && !isToday ? 'bg-gradient-to-b from-rose-900/20 to-emerald-900/20' : ''}
                ${eventType ? 'ring-1 ring-inset ' + (eventType === 'match' ? 'ring-rose-500/40' : eventType === 'rest' ? 'ring-blue-500/40' : 'ring-orange-500/40') : ''}
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
  clubSchedule?: { clubDays: { day: DayOfWeek; time?: string }[] }
  clubDays: DayOfWeek[]
  scDays: DayOfWeek[]
  eventsOnDate: CalendarEvent[]
  onClose: () => void
  onAddEvent: () => void
  onRemoveEvent: (id: string) => void
  onUpdateMatchLoad: (id: string, rpe: number, durationMin?: number) => void
}

function DayDetailModal({
  dateStr,
  clubSchedule,
  clubDays,
  scDays,
  eventsOnDate,
  onClose,
  onAddEvent,
  onRemoveEvent,
  onUpdateMatchLoad,
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
        className="w-full max-w-md bg-[#1a100c] border border-white/10 rounded-[2rem] p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white capitalize">{formatDateFR(dateStr)}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Programme récurrent — journée coupée en deux */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Programmé</p>
          <div className="space-y-2">
            {isScDay && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-900/20 border border-rose-500/20">
                <Dumbbell className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-400">Muscu</p>
                  <p className="text-[11px] text-white/60 mt-0.5">
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
                    <p className="text-[11px] text-white/60 mt-0.5">{clubDayInfo.time}</p>
                  ) : (
                    <p className="text-[11px] text-white/60 mt-0.5">Collectif club</p>
                  )}
                </div>
              </div>
            )}
            {!isScDay && !isClubDay && (
              <p className="text-xs text-white/40 py-2">Aucune séance planifiée ce jour.</p>
            )}
          </div>
        </div>

        {/* Événements du jour */}
        {eventsOnDate.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Événements</p>
            <div className="space-y-2">
              {eventsOnDate.map((event) => (
                <EventRow key={event.id} event={event} onRemove={onRemoveEvent} onUpdateLoad={onUpdateMatchLoad} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAddEvent}
            className="flex-1 py-3 rounded-2xl border-2 border-[#ff6b35] text-[#ff6b35] font-black uppercase tracking-wide hover:bg-[#ff6b35]/10 transition-colors"
          >
            Ajouter un événement
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-bold hover:bg-white/10 transition-colors"
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
        className="w-full max-w-md bg-[#1a100c] border border-white/10 rounded-[2rem] p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white">Ajouter un événement</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-black text-white/40 uppercase tracking-wide mb-2 block">Type</label>
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
                      : 'border-white/10 text-white/40 hover:border-white/25'
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
          <label className="text-xs font-black text-white/40 uppercase tracking-wide mb-2 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-white/10 bg-white/5 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
          />
        </div>

        {/* Match-specific fields */}
        {type === 'match' && (
          <>
            <div>
              <label className="text-xs font-black text-white/40 uppercase tracking-wide mb-2 block">Coup d'envoi</label>
              <input
                type="time"
                value={kickoffTime}
                onChange={(e) => setKickoffTime(e.target.value)}
                className="w-full border border-white/10 bg-white/5 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="text-xs font-black text-white/40 uppercase tracking-wide mb-2 block">Adversaire (optionnel)</label>
              <ClubSearchInput
                value={opponent}
                clubCode={opponentCode}
                onChange={handleOpponentChange}
              />
            </div>

            <div>
              <label className="text-xs font-black text-white/40 uppercase tracking-wide mb-2 block">Lieu</label>
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
                        ? 'border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10'
                        : 'border-white/10 text-white/40 hover:border-white/25'
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
  const { events, nextMatch, seasonPhase, addEvent, removeEvent, updateMatchLoad, loading } = useCalendar()
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
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* ── Header ── */}
      <PageHeader title="Calendrier" backTo="/" right={<SeasonBadge phase={seasonPhase} />} />

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto relative">

        {/* ── Next Match Card ── */}
        {nextMatch && <NextMatchCard event={nextMatch} />}

        {!nextMatch && !loading && (
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-center space-y-2">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">Aucun match planifié</p>
            <p className="text-xs text-white/40">Ajoute tes matchs pour activer le mode in-season et adapter ton programme.</p>
          </div>
        )}

        {/* ── Calendar Grid ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-9 h-9 rounded-2xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-black uppercase tracking-wider text-white/70">
              {MONTH_NAMES_FR[calMonth]} {calYear}
            </h2>
            <button type="button" onClick={nextMonth} className="w-9 h-9 rounded-2xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25 transition-colors">
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
            <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">À venir</h2>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-3 divide-y divide-white/10">
              {upcomingEvents.map((event) => (
                <EventRow key={event.id} event={event} onRemove={removeEvent} onUpdateLoad={updateMatchLoad} />
              ))}
            </div>
          </section>
        )}

        {/* ── Past Events (collapsed) ── */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">Passés</h2>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-3 divide-y divide-white/10">
              {pastEvents.slice(-5).reverse().map((event) => (
                <EventRow key={event.id} event={event} onRemove={removeEvent} onUpdateLoad={updateMatchLoad} />
              ))}
            </div>
          </section>
        )}

        {/* ── Season Info ── */}
        <section>
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 space-y-3">
            <h3 className="text-sm font-black text-white">Phase de saison</h3>
            <div className="flex items-center gap-3">
              <SeasonBadge phase={seasonPhase} />
              <p className="text-xs text-white/50 flex-1">
                {seasonPhase === 'off-season' && 'Période de récupération et hypertrophie. Charge réduite.'}
                {seasonPhase === 'pre-season' && 'Reprise progressive. Construire la base de force.'}
                {seasonPhase === 'in-season' && 'Mode compétition actif. Volume −30%, intensité maintenue.'}
                {seasonPhase === 'playoffs' && 'Phase finale. Tapering en cours. Volume minimal.'}
              </p>
            </div>
            <p className="text-[10px] text-white/40">Détecté automatiquement via ton calendrier de matchs.</p>
          </div>
        </section>

      </main>

      {/* ── FAB ── */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => { setSelectedDate(undefined); setShowDayDetail(false); setShowModal(true) }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#ff6b35] rounded-2xl shadow-lg shadow-[#ff6b35]/30 flex items-center justify-center z-40"
        aria-label="Ajouter un événement"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* ── Day Detail Modal (S&C + rugby, journée coupée en deux) ── */}
      <AnimatePresence>
        {showDayDetail && selectedDate && (
          <DayDetailModal
            dateStr={selectedDate}
            clubSchedule={profile.clubSchedule}
            clubDays={clubDays}
            scDays={scDays}
            eventsOnDate={events.filter((e) => e.date === selectedDate)}
            onClose={() => setShowDayDetail(false)}
            onAddEvent={() => { setShowDayDetail(false); setShowModal(true) }}
            onRemoveEvent={removeEvent}
            onUpdateMatchLoad={updateMatchLoad}
          />
        )}
      </AnimatePresence>

      {/* ── Add Event Modal ── */}
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
