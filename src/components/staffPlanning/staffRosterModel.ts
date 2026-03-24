import type { AthleteStaffWeeklyView } from '../../types/staffPlanning'

export interface StaffRosterRowView {
  athlete: AthleteStaffWeeklyView
  displayName: string
}

export type FatigueFilter = 'all' | 'normal' | 'high' | 'very_high'
export type AdherenceFilter = 'all' | 'low' | 'ok'
export type PositionFilter = 'all' | AthleteStaffWeeklyView['annualPlanning']['positionGroup']
export type MatchWeekFilter = 'all' | 'yes' | 'no'
export type SortKey = 'name' | 'fatigue' | 'adherence' | 'sessions28'

export interface StaffRosterFilters {
  search: string
  fatigue: FatigueFilter
  adherence: AdherenceFilter
  position: PositionFilter
  matchWeek: MatchWeekFilter
}

function fatigueRank(level: AthleteStaffWeeklyView['load']['fatigueLevel']): number {
  switch (level) {
    case 'very_high':
      return 3
    case 'high':
      return 2
    default:
      return 1
  }
}

export function filterStaffRosterRows(
  rows: StaffRosterRowView[],
  filters: StaffRosterFilters
): StaffRosterRowView[] {
  const q = filters.search.trim().toLowerCase()
  return rows.filter(({ athlete, displayName }) => {
    if (q) {
      const id = athlete.identity.athleteId ?? ''
      if (!displayName.toLowerCase().includes(q) && !id.toLowerCase().includes(q)) {
        return false
      }
    }
    if (filters.fatigue !== 'all' && athlete.load.fatigueLevel !== filters.fatigue) {
      return false
    }
    if (filters.adherence === 'low') {
      if (!athlete.alerts.some((a) => a.code === 'low_adherence')) return false
    }
    if (filters.adherence === 'ok') {
      if (athlete.alerts.some((a) => a.code === 'low_adherence')) return false
    }
    if (filters.position !== 'all' && athlete.annualPlanning.positionGroup !== filters.position) {
      return false
    }
    if (filters.matchWeek === 'yes' && !athlete.annualPlanning.isMatchWeek) return false
    if (filters.matchWeek === 'no' && athlete.annualPlanning.isMatchWeek) return false
    return true
  })
}

function adherenceSortValue(athlete: AthleteStaffWeeklyView): number {
  const v = athlete.adherence.completionVsPlanned7d
  if (v === null || Number.isNaN(v)) return -1
  return v
}

export function sortStaffRosterRows(
  rows: StaffRosterRowView[],
  key: SortKey,
  dir: 'asc' | 'desc'
): StaffRosterRowView[] {
  const m = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const A = a.athlete
    const B = b.athlete
    switch (key) {
      case 'name':
        return m * a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' })
      case 'fatigue':
        return m * (fatigueRank(A.load.fatigueLevel) - fatigueRank(B.load.fatigueLevel))
      case 'adherence': {
        const va = adherenceSortValue(A)
        const vb = adherenceSortValue(B)
        return m * (va - vb)
      }
      case 'sessions28':
        return m * (A.adherence.completedSessionsLast28d - B.adherence.completedSessionsLast28d)
      default:
        return 0
    }
  })
}

export function countAlertsBySeverity(
  athlete: AthleteStaffWeeklyView
): { critical: number; warning: number; info: number } {
  let critical = 0
  let warning = 0
  let info = 0
  for (const al of athlete.alerts) {
    if (al.severity === 'critical') critical += 1
    else if (al.severity === 'warning') warning += 1
    else info += 1
  }
  return { critical, warning, info }
}
