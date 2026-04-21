import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { ClubAvatar } from './ClubAvatar'
import ffrClubs from '../../data/ffrClubs.v2021.json'

interface FfrClub {
  ligue: string
  departmentCode: string
  code: string
  name: string
}

const ALL_CLUBS = ffrClubs as FfrClub[]

const normalize = (s: string) =>
  s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// eslint-disable-next-line react-refresh/only-export-components -- helper colocated with the component
export function searchClubs(query: string): FfrClub[] {
  if (!query || query.length < 2) return []
  const q = normalize(query)
  return ALL_CLUBS.filter((c) => normalize(`${c.name} ${c.code} ${c.ligue}`).includes(q)).slice(0, 8)
}

interface ClubSearchInputProps {
  value: string
  clubCode?: string
  onChange: (name: string, code?: string) => void
  placeholder?: string
}

/** Input autocomplete club FFR — réutilisé dans AddMatchModal + section Mon club. */
export function ClubSearchInput({ value, clubCode, onChange, placeholder }: ClubSearchInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<FfrClub[]>([])
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    onChange(q, undefined)
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
          placeholder={placeholder ?? 'Rechercher un club FFR...'}
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
            aria-label="Effacer"
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
