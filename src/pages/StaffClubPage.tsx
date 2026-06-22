import { useMemo, useState, useEffect } from 'react'
import { StaffAthleteDetailDrawer } from '../components/staffPlanning/StaffAthleteDetailDrawer'
import { StaffRosterTable } from '../components/staffPlanning/StaffRosterTable'
import { StaffRosterToolbar } from '../components/staffPlanning/StaffRosterToolbar'
import {
  filterStaffRosterRows,
  sortStaffRosterRows,
  type SortKey,
  type StaffRosterFilters,
} from '../components/staffPlanning/staffRosterModel'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { useSquadWeeklyOverview } from '../hooks/useSquadWeeklyOverview'
import { useStaffCoachAccess } from '../hooks/useStaffCoachAccess'
import { useProfile } from '../hooks/useProfile'
import { getToday } from '../services/ui/debugDateOverride'
import { supabaseStaffPlanningRepository } from '../services/staffPlanning/supabaseStaffPlanningRepository'
import { syncMyClubMembership } from '../services/club/syncClubMembership'
import { tr, type Lang } from '../i18n/appLabels'

const defaultStaffFilters: StaffRosterFilters = {
  search: '',
  fatigue: 'all',
  adherence: 'all',
  position: 'all',
  matchWeek: 'all',
}

export function StaffClubPage() {
  const { profile } = useProfile()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')
  const { primaryMembership } = useStaffCoachAccess()

  const clubId = primaryMembership?.clubId ?? ''
  const squadId = primaryMembership?.squadId ?? undefined
  const today = getToday()

  useEffect(() => {
    if (profile?.clubCode?.trim()) {
      void syncMyClubMembership(profile.clubCode)
    }
  }, [profile?.clubCode])

  const coachClubMismatch =
    Boolean(profile?.clubCode?.trim()) &&
    Boolean(clubId) &&
    profile!.clubCode!.trim() !== clubId

  const [staffFilters, setStaffFilters] = useState<StaffRosterFilters>(defaultStaffFilters)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null)

  const { loading, error, overview } = useSquadWeeklyOverview({
    clubId,
    squadId,
    today,
    repository: supabaseStaffPlanningRepository,
  })

  const rosterBaseRows = useMemo(() => {
    if (!overview) return []
    return overview.athletes.map((a) => ({
      athlete: a,
      displayName: a.displayName,
    }))
  }, [overview])

  const rosterRowsFilteredSorted = useMemo(() => {
    const filtered = filterStaffRosterRows(rosterBaseRows, staffFilters)
    return sortStaffRosterRows(filtered, sortKey, sortDir)
  }, [rosterBaseRows, staffFilters, sortKey, sortDir])

  const effectiveSelectedAthleteId =
    selectedAthleteId &&
    rosterRowsFilteredSorted.some((r) => r.athlete.identity.athleteId === selectedAthleteId)
      ? selectedAthleteId
      : null

  const selectedAthlete = useMemo(() => {
    if (!effectiveSelectedAthleteId || !overview) return null
    return overview.athletes.find((a) => a.identity.athleteId === effectiveSelectedAthleteId) ?? null
  }, [effectiveSelectedAthleteId, overview])

  const selectedDisplayName = effectiveSelectedAthleteId
    ? rosterBaseRows.find((r) => r.athlete.identity.athleteId === effectiveSelectedAthleteId)?.displayName
    : undefined

  const summary = overview?.summary ?? null
  const clubLabel = profile?.clubName ?? clubId

  return (
    <div className="min-h-screen bg-app text-fg pb-bottom-nav">
      <PageHeader title={`${tr('nav_coach', lang)} · ${clubLabel}`} backTo="/home" />

      <main className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-danger-bd bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {!loading && !error && overview && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-brand-border bg-layer-5 p-3">
                <p className="text-fg-muted text-xs">{tr('staff_players', lang)}</p>
                <p className="text-2xl font-bold">{summary?.totalAthletes ?? 0}</p>
              </div>
              <div className="rounded-xl border border-brand-border bg-layer-5 p-3">
                <p className="text-fg-muted text-xs">{tr('staff_fatigue_alerts', lang)}</p>
                <p className="text-2xl font-bold">
                  {(summary?.highFatigueCount ?? 0) + (summary?.veryHighFatigueCount ?? 0)}
                </p>
              </div>
            </div>

            {overview.athletes.length === 0 ? (
              <div className="rounded-xl border border-brand-border bg-layer-5 p-4 text-sm space-y-2">
                <p className="text-fg-muted">{tr('staff_empty_roster', lang)}</p>
                <p className="text-xs text-fg-ghost font-mono">
                  coach club_id: {clubId || '—'}
                  {profile?.clubCode ? ` · profil: ${profile.clubCode}` : ''}
                </p>
                {coachClubMismatch && (
                  <p className="text-xs text-amber-800">{tr('staff_club_id_mismatch', lang)}</p>
                )}
                <p className="text-xs text-fg-muted">{tr('staff_empty_roster_hint', lang)}</p>
              </div>
            ) : (
              <>
                <StaffRosterToolbar
                  filters={staffFilters}
                  onFiltersChange={setStaffFilters}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSortKeyChange={setSortKey}
                  onSortDirToggle={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  resultCount={rosterRowsFilteredSorted.length}
                  totalCount={rosterBaseRows.length}
                  theme="app"
                />
                <StaffRosterTable
                  rows={rosterRowsFilteredSorted}
                  selectedAthleteId={effectiveSelectedAthleteId}
                  onSelectRow={setSelectedAthleteId}
                  theme="app"
                />
              </>
            )}
          </>
        )}
      </main>

      <StaffAthleteDetailDrawer
        open={!!selectedAthlete}
        athlete={selectedAthlete}
        displayName={selectedDisplayName}
        onClose={() => setSelectedAthleteId(null)}
        theme="app"
      />

      <BottomNav />
    </div>
  )
}
