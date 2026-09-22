// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { WeekMonthView } from '../WeekMonthView'
import type { CalendarEvent, DayOfWeek } from '../../../types/training'
import type { MonthPlannedSession } from '../../../services/scheduling/resolveMonthProgramGrid'

const awayMatch: CalendarEvent = {
  id: 'm1',
  date: '2026-08-15',
  type: 'match',
  opponent: 'Racing 92',
  opponent_code: '92RS',
  kickoff_time: '15:00',
  is_home: false,
}

const upperPending: MonthPlannedSession = {
  dateISO: '2026-08-15',
  title: 'Haut du corps',
  shortLabel: 'Haut',
  sessionType: 'upper',
  status: 'pending',
  motherSessionId: 'test-upper-id',
}

function renderMonth({
  events = [awayMatch],
  clubDays,
  planned,
  clubCode,
  clubName,
  onSelectPlannedSession,
}: {
  events?: CalendarEvent[]
  clubDays?: DayOfWeek[]
  planned?: ReadonlyMap<string, readonly MonthPlannedSession[]>
  clubCode?: string
  clubName?: string
  onSelectPlannedSession?: (session: MonthPlannedSession) => void
} = {}) {
  return render(
    <MemoryRouter>
      <WeekMonthView
        events={events}
        logs={[]}
        clubDays={clubDays}
        plannedSessionsByDate={planned}
        todayISO="2026-08-16"
        year={2026}
        month={7}
        onMonthChange={() => {}}
        lang="fr"
        clubCode={clubCode}
        clubName={clubName}
        onSelectPlannedSession={onSelectPlannedSession}
      />
    </MemoryRouter>,
  )
}

afterEach(() => cleanup())

describe('WeekMonthView — cases match', () => {
  it('affiche filigrane, coup d’envoi, adversaire et extérieur dans la case', () => {
    renderMonth()
    const cell = screen.getByTestId('month-cell-match-15')
    expect(cell.getAttribute('aria-label')).toMatch(/extérieur/)
    expect(cell.getAttribute('aria-label')).toMatch(/Racing 92/)
    expect(cell.getAttribute('aria-label')).toMatch(/15:00/)
    expect(within(cell).getByText('15:00')).toBeTruthy()
    expect(within(cell).getByText('Racing 92')).toBeTruthy()
    expect(within(cell).getByText('EXT')).toBeTruthy()
    expect(within(cell).getByTestId('month-cell-crest')).toBeTruthy()
    expect(within(cell).getByText('R9')).toBeTruthy()
  })

  it('domicile : pastille DOM, pas EXT', () => {
    renderMonth({ events: [{ ...awayMatch, is_home: true }] })
    const cell = screen.getByTestId('month-cell-match-15')
    expect(cell.getAttribute('aria-label')).toMatch(/domicile/)
    expect(cell.getAttribute('aria-label')).not.toMatch(/extérieur/)
    expect(within(cell).getByText('DOM')).toBeTruthy()
    expect(within(cell).queryByText('EXT')).toBeNull()
  })
})

describe('WeekMonthView — club et séances décorées', () => {
  it('case club seule : tag CLUB, filigrane, libellé Entraînement', () => {
    renderMonth({
      events: [],
      clubDays: [6],
      clubCode: '4207Y',
      clubName: 'Dieppe UC',
    })
    const cell = screen.getByTestId('month-cell-club-15')
    expect(cell.getAttribute('aria-label')).toMatch(/club/i)
    expect(within(cell).getByText('CLUB')).toBeTruthy()
    expect(within(cell).getByText('Entraînement')).toBeTruthy()
    expect(within(cell).getByTestId('month-cell-crest')).toBeTruthy()
  })

  it('case séance : tag HAUT, art de fond, titre et statut', () => {
    renderMonth({
      events: [],
      planned: new Map([['2026-08-15', [upperPending]]]),
    })
    const cell = screen.getByTestId('month-cell-session-15')
    expect(within(cell).getByText('HAUT')).toBeTruthy()
    expect(within(cell).getByText('Haut du corps')).toBeTruthy()
    expect(within(cell).getByText('À faire')).toBeTruthy()
    expect(within(cell).getByTestId('month-cell-session-art')).toBeTruthy()
  })

  it('salle + club : déco séance prioritaire, mention Club', () => {
    renderMonth({
      events: [],
      clubDays: [6],
      planned: new Map([['2026-08-15', [upperPending]]]),
    })
    const cell = screen.getByTestId('month-cell-session-15')
    expect(within(cell).getByText('HAUT')).toBeTruthy()
    expect(within(cell).getByText('Club')).toBeTruthy()
    expect(within(cell).getByTestId('month-cell-session-art')).toBeTruthy()
  })

  it('clic séance appelle onSelectPlannedSession', () => {
    const onSelect = vi.fn()
    renderMonth({
      events: [],
      planned: new Map([['2026-08-15', [upperPending]]]),
      onSelectPlannedSession: onSelect,
    })
    fireEvent.click(screen.getByTestId('month-cell-session-15'))
    expect(onSelect).toHaveBeenCalledWith(upperPending)
  })
})
