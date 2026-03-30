import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Bell,
  Calendar,
  AlertTriangle,
  TrendingDown,
  Zap,
  FileDown,
  Radio,
  Users,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react'
import { StaffAthleteDetailDrawer } from '../components/staffPlanning/StaffAthleteDetailDrawer'
import { StaffRosterTable } from '../components/staffPlanning/StaffRosterTable'
import { StaffRosterToolbar } from '../components/staffPlanning/StaffRosterToolbar'
import {
  filterStaffRosterRows,
  sortStaffRosterRows,
  type SortKey,
  type StaffRosterFilters,
} from '../components/staffPlanning/staffRosterModel'
import { useSquadWeeklyOverview } from '../hooks/useSquadWeeklyOverview'
import {
  SANDBOX_CLUB_ID,
  SANDBOX_REFERENCE_DATE,
  SANDBOX_ROSTER,
  SANDBOX_SQUAD_ID,
} from '../services/staffPlanning/__fixtures__/staffPlanningFixtures'
import {
  getStaffPlanningRepositoryForSource,
  parseStaffSandboxRepositorySource,
  type StaffSandboxRepositorySource,
} from '../services/staffPlanning/staffSandboxRepositorySource'

// ── Design tokens ────────────────────────────────────────────────────
const ORANGE = '#ff6b35'
const GREEN = '#1a5f3f'
const BG = '#0b0e14'
const SURFACE_LOW = '#10131a'
const SURFACE_HIGH = '#1c2028'

// ── Nav items (4 pertinents) ─────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard, href: '/staff-sandbox' },
  { key: 'programs', label: 'Programmes', icon: ClipboardList, href: '#' },
  { key: 'alerts', label: 'Alertes', icon: ShieldAlert, href: '#' },
  { key: 'calendar', label: 'Calendrier', icon: Calendar, href: '#' },
] as const

const ACTIVE_KEY = 'dashboard'

const defaultStaffFilters: StaffRosterFilters = {
  search: '',
  fatigue: 'all',
  adherence: 'all',
  position: 'all',
  matchWeek: 'all',
}

// ── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  borderColor = ORANGE,
  subtitleColor,
}: {
  label: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  borderColor?: string
  subtitleColor?: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 lg:p-6 group transition-colors"
      style={{ backgroundColor: SURFACE_LOW, borderLeft: `4px solid ${borderColor}40` }}
    >
      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-12 h-12 lg:w-16 lg:h-16" />
      </div>
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-3 font-['Lexend']"
        style={{ color: borderColor }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl lg:text-5xl font-black text-white tabular-nums font-['Lexend'] leading-none">
          {value}
        </h2>
        <span
          className="text-[10px] lg:text-xs font-['Lexend']"
          style={{ color: subtitleColor ?? '#a9abb3' }}
        >
          {subtitle}
        </span>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
export function StaffPlanningSandboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const source = useMemo(
    () => parseStaffSandboxRepositorySource(searchParams.get('source')),
    [searchParams]
  )

  const repository = useMemo(() => getStaffPlanningRepositoryForSource(source), [source])

  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of SANDBOX_ROSTER) {
      if (r.displayName) m.set(r.athleteId, r.displayName)
    }
    return m
  }, [])

  const [staffFilters, setStaffFilters] = useState<StaffRosterFilters>(defaultStaffFilters)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null)

  const { loading, error, overview } = useSquadWeeklyOverview({
    clubId: SANDBOX_CLUB_ID,
    squadId: SANDBOX_SQUAD_ID,
    today: SANDBOX_REFERENCE_DATE,
    repository,
  })

  const setSandboxSource = (next: StaffSandboxRepositorySource) => {
    setSearchParams(
      next === 'memory'
        ? (prev) => {
            const p = new URLSearchParams(prev)
            p.delete('source')
            return p
          }
        : { source: 'supabase' },
      { replace: true }
    )
  }

  const showSupabaseEmpty =
    source === 'supabase' &&
    !loading &&
    !error &&
    overview !== null &&
    overview.athletes.length === 0

  const rosterBaseRows = useMemo(() => {
    if (!overview) return []
    return overview.athletes.map((a) => {
      const id = a.identity.athleteId ?? ''
      const displayName = id ? (nameById.get(id) ?? id) : '—'
      return { athlete: a, displayName }
    })
  }, [overview, nameById])

  const rosterRowsFilteredSorted = useMemo(() => {
    const filtered = filterStaffRosterRows(rosterBaseRows, staffFilters)
    return sortStaffRosterRows(filtered, sortKey, sortDir)
  }, [rosterBaseRows, staffFilters, sortKey, sortDir])

  const effectiveSelectedAthleteId = selectedAthleteId && rosterRowsFilteredSorted.some(
    (r) => r.athlete.identity.athleteId === selectedAthleteId
  ) ? selectedAthleteId : null

  const selectedAthlete = useMemo(() => {
    if (!effectiveSelectedAthleteId || !overview) return null
    return overview.athletes.find((a) => a.identity.athleteId === effectiveSelectedAthleteId) ?? null
  }, [effectiveSelectedAthleteId, overview])

  const selectedDisplayName = effectiveSelectedAthleteId
    ? (nameById.get(effectiveSelectedAthleteId) ?? effectiveSelectedAthleteId)
    : undefined

  const toggleSortDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))

  // Derive KPIs
  const summary = overview?.summary ?? null
  const totalPlayers = summary?.totalAthletes ?? 0
  const fatigueAlertCount = (summary?.highFatigueCount ?? 0) + (summary?.veryHighFatigueCount ?? 0)
  const lowAdherence = summary?.lowAdherenceCount ?? 0
  const matchReadiness = totalPlayers > 0
    ? Math.round(((totalPlayers - fatigueAlertCount) / totalPlayers) * 100)
    : 0

  return (
    <div className="flex min-h-screen font-['Lexend'] overflow-x-hidden" style={{ backgroundColor: BG }}>
      {/* ── Sidebar (desktop only) ───────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 h-full w-56 flex-col border-r z-50 hidden lg:flex"
        style={{
          backgroundColor: BG,
          borderColor: SURFACE_HIGH,
          boxShadow: '40px 0 40px rgba(255,144,106,0.04)',
        }}
      >
        {/* Brand */}
        <div className="px-6 pt-7 pb-4 flex flex-col gap-1">
          <span className="text-xl font-black tracking-tighter" style={{ color: ORANGE }}>
            RUGBYFORGE
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Staff Dashboard
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const active = item.key === ACTIVE_KEY
            return (
              <Link
                key={item.key}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${
                  active
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}
                style={
                  active
                    ? { color: ORANGE, backgroundColor: `${ORANGE}12` }
                    : undefined
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Source toggle (sidebar bottom) */}
        <div className="px-4 pb-6">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2 px-1">
            Source
          </div>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setSandboxSource('memory')}
              className={`flex-1 px-2 py-2 text-[10px] font-bold uppercase tracking-tight transition-colors ${
                source === 'memory' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={source === 'memory' ? { backgroundColor: `${ORANGE}20`, color: ORANGE } : undefined}
            >
              Memory
            </button>
            <button
              onClick={() => setSandboxSource('supabase')}
              className={`flex-1 px-2 py-2 text-[10px] font-bold uppercase tracking-tight transition-colors ${
                source === 'supabase' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={source === 'supabase' ? { backgroundColor: `${ORANGE}20`, color: ORANGE } : undefined}
            >
              Supabase
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="lg:ml-56 flex-1 min-h-screen flex flex-col min-w-0">
        {/* ── Top Bar ──────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 h-14 lg:h-16 backdrop-blur-xl border-b"
          style={{
            backgroundColor: `${BG}cc`,
            borderColor: `${SURFACE_HIGH}80`,
          }}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Mobile brand */}
            <span className="lg:hidden text-sm font-black tracking-tighter shrink-0" style={{ color: ORANGE }}>
              RUGBYFORGE
            </span>
            {/* Search */}
            <div className="relative flex-1 max-w-sm hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher joueurs…"
                className="w-full rounded-full py-2 pl-10 pr-4 text-xs border-none focus:ring-1 transition-all text-white placeholder:text-slate-600"
                style={{ backgroundColor: SURFACE_HIGH, outline: 'none' }}
              />
            </div>
            {/* Date */}
            <div className="hidden md:flex items-center gap-2 text-[10px] tabular-nums text-slate-500 whitespace-nowrap shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span className="uppercase font-bold tracking-tight">
                {SANDBOX_REFERENCE_DATE} • Pré-Saison
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile source toggle */}
            <div className="sm:hidden flex rounded-md overflow-hidden border border-white/10">
              <button
                onClick={() => setSandboxSource('memory')}
                className="px-2 py-1 text-[9px] font-bold uppercase"
                style={source === 'memory' ? { backgroundColor: `${ORANGE}20`, color: ORANGE } : { color: '#64748b' }}
              >
                Mem
              </button>
              <button
                onClick={() => setSandboxSource('supabase')}
                className="px-2 py-1 text-[9px] font-bold uppercase"
                style={source === 'supabase' ? { backgroundColor: `${ORANGE}20`, color: ORANGE } : { color: '#64748b' }}
              >
                Sup
              </button>
            </div>

            {/* Notification */}
            <button className="relative text-slate-500 hover:text-white transition-colors p-1">
              <Bell className="w-5 h-5" />
              <span
                className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full border-2"
                style={{ backgroundColor: ORANGE, borderColor: BG }}
              />
            </button>

            {/* Profile */}
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-bold text-white uppercase leading-none">Coach S&C</p>
                <p className="text-[9px] uppercase" style={{ color: ORANGE }}>Head Coach</p>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs border"
                style={{ backgroundColor: GREEN, borderColor: `${ORANGE}30` }}
              >
                SC
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Canvas ──────────────────────────────────────── */}
        <main className="p-4 lg:p-8 space-y-6 lg:space-y-8 pb-24 lg:pb-8 max-w-[1600px]">
          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl lg:text-4xl font-black uppercase tracking-tighter text-white leading-none">
                Vue d'ensemble
              </h1>
              <p className="text-slate-500 mt-1 lg:mt-2 text-xs lg:text-sm max-w-md">
                Analytics temps réel du groupe. Monitoring fatigue et seuils de readiness.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-white/10 rounded-lg text-[10px] lg:text-xs font-bold uppercase tracking-tight text-slate-300 hover:bg-white/5 transition-all flex items-center gap-1.5">
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span> PDF
              </button>
              <button
                className="px-3 py-2 rounded-lg text-[10px] lg:text-xs font-bold uppercase tracking-tight transition-all flex items-center gap-1.5"
                style={{ backgroundColor: ORANGE, color: '#451000' }}
              >
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Session</span> Live
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100" role="alert">
              {error}
            </div>
          )}

          {/* KPI Row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <KpiCard
              label="Total Joueurs"
              value={loading ? '—' : String(totalPlayers).padStart(2, '0')}
              subtitle={loading ? '' : `${summary?.byCycle.in_season ?? 0} en saison`}
              icon={Users}
              borderColor={ORANGE}
            />
            <KpiCard
              label="Alertes Fatigue"
              value={loading ? '—' : String(fatigueAlertCount).padStart(2, '0')}
              subtitle={loading ? '' : `${summary?.veryHighFatigueCount ?? 0} critique`}
              icon={AlertTriangle}
              borderColor="#ff716c"
              subtitleColor="#ff716c"
            />
            <KpiCard
              label="Adhérence Faible"
              value={loading ? '—' : String(lowAdherence).padStart(2, '0')}
              subtitle={loading ? '' : 'Logs incomplets'}
              icon={TrendingDown}
              borderColor="#fc7d75"
            />
            <KpiCard
              label="Readiness"
              value={loading ? '—' : `${matchReadiness}%`}
              subtitle={loading ? '' : 'Moy. groupe'}
              icon={Zap}
              borderColor={ORANGE}
              subtitleColor={ORANGE}
            />
          </section>

          {/* Supabase empty warning */}
          {showSupabaseEmpty && (
            <div
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-50"
              role="status"
              data-testid="sandbox-supabase-empty"
            >
              <p className="m-0 font-medium text-amber-100">
                Aucun athlète visible pour ce club/groupe avec la configuration actuelle.
              </p>
              <p className="mt-2 mb-0 text-xs text-amber-100/90">
                Vérifiez qu'au moins une ligne{' '}
                <span className="font-mono">club_staff_memberships</span> <strong>active</strong>{' '}
                existe pour le compte connecté, et que des{' '}
                <span className="font-mono">club_athlete_memberships</span> <strong>actives</strong>{' '}
                existent pour le même club / groupe.
              </p>
            </div>
          )}

          {/* Squad Roster Section */}
          {!loading &&
            overview &&
            (overview.athletes.length > 0 || source === 'memory') && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: SURFACE_LOW }}
              >
                {/* Roster header */}
                <div
                  className="px-4 py-4 lg:px-8 lg:py-6 flex items-center justify-between border-b"
                  style={{ borderColor: `${SURFACE_HIGH}60` }}
                >
                  <h3 className="text-base lg:text-xl font-bold text-white uppercase tracking-tight">
                    Effectif
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {rosterRowsFilteredSorted.length} joueurs
                  </span>
                </div>

                {/* Toolbar + Table */}
                {overview.athletes.length > 0 && (
                  <div className="p-4 lg:p-8 space-y-4">
                    <StaffRosterToolbar
                      filters={staffFilters}
                      onFiltersChange={setStaffFilters}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSortKeyChange={setSortKey}
                      onSortDirToggle={toggleSortDir}
                      resultCount={rosterRowsFilteredSorted.length}
                      totalCount={rosterBaseRows.length}
                    />
                    <StaffRosterTable
                      rows={rosterRowsFilteredSorted}
                      selectedAthleteId={effectiveSelectedAthleteId}
                      onSelectRow={setSelectedAthleteId}
                      loading={false}
                    />
                  </div>
                )}
              </section>
            )}
        </main>
      </div>

      {/* ── Bottom Nav (mobile only) ─────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 backdrop-blur-xl border-t flex items-center justify-around px-4 z-50 lg:hidden"
        style={{
          backgroundColor: `${BG}ee`,
          borderColor: `${SURFACE_HIGH}60`,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.key === ACTIVE_KEY
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                active ? '' : 'text-slate-500'
              }`}
              style={active ? { color: ORANGE } : undefined}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Athlete Detail Drawer */}
      <StaffAthleteDetailDrawer
        open={Boolean(selectedAthlete)}
        athlete={selectedAthlete}
        displayName={selectedDisplayName}
        onClose={() => setSelectedAthleteId(null)}
      />
    </div>
  )
}
