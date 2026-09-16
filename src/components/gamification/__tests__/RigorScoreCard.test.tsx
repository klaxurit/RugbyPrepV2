// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RigorScoreCard } from '../RigorScoreCard'
import { resolveLevelProgress } from '../../../services/gamification/levels'
import type {
  GamificationProfile,
  WeeklyScore,
  WeeklyScoreBreakdown,
} from '../../../types/gamification'

const EMPTY_BREAKDOWN: WeeklyScoreBreakdown = {
  plannedSessions: 0,
  offPlanSessions: 0,
  prescribedRest: 0,
  fullPlanBonus: 0,
  deloadCompensation: 0,
  logQualityBonus: 0,
  streakBonus: 0,
}

const profile: GamificationProfile = {
  totalXp: 500,
  level: 'titulaire',
  currentWeekStreak: 3,
  longestWeekStreak: 5,
  freezeUsedAt: null,
  leagueTier: 'espoirs',
  socialVisibility: 'private',
}

function week(overrides: Partial<WeeklyScore> = {}): WeeklyScore {
  return {
    weekStartISO: '2026-09-14',
    points: 85,
    sessionsPlanned: 3,
    sessionsCompleted: 3,
    deloadRespected: false,
    acwrCapped: false,
    breakdown: { ...EMPTY_BREAKDOWN, plannedSessions: 60, prescribedRest: 10, streakBonus: 15 },
    ...overrides,
  }
}

function renderCard(
  props: Partial<React.ComponentProps<typeof RigorScoreCard>> = {},
) {
  return render(
    <MemoryRouter>
      <RigorScoreCard
        profile={profile}
        currentWeek={week()}
        levelProgress={resolveLevelProgress(profile.totalXp)}
        lang="fr"
        {...props}
      />
    </MemoryRouter>,
  )
}

afterEach(() => cleanup())

describe('RigorScoreCard', () => {
  it('ne monte rien sans état de gamification', () => {
    const { container } = renderCard({ profile: null, currentWeek: null })
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche le total de la semaine et le palier', () => {
    renderCard()
    const card = screen.getByTestId('rigor-score-card')
    expect(card).toHaveTextContent('85')
    expect(card).toHaveTextContent('Titulaire')
  })

  it('détaille les postes au lieu d’un total opaque', () => {
    renderCard()
    expect(screen.getByText('Séances du plan tenues')).toBeInTheDocument()
    expect(screen.getByText('Repos prescrit respecté')).toBeInTheDocument()
    expect(screen.getByText('Régularité')).toBeInTheDocument()
  })

  it('n’affiche pas les postes à zéro', () => {
    renderCard()
    expect(screen.queryByText('Séance ajoutée')).toBeNull()
  })

  it('explique le gel des gains en surcharge', () => {
    renderCard({ currentWeek: week({ acwrCapped: true }) })
    expect(screen.getByText(/surcharge/i)).toBeInTheDocument()
  })

  it('valorise une semaine de décharge tenue', () => {
    renderCard({ currentWeek: week({ deloadRespected: true }) })
    expect(screen.getByText(/décharge tenue/i)).toBeInTheDocument()
  })

  it('affiche la progression vers le palier suivant', () => {
    renderCard()
    const bar = screen.getByRole('progressbar', { name: /progression de niveau/i })
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar).toHaveAttribute('aria-valuemax', '800')
  })

  it('n’affiche pas de barre de progression au dernier palier', () => {
    renderCard({
      profile: { ...profile, totalXp: 9000, level: 'legende' },
      levelProgress: resolveLevelProgress(9000),
    })
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('renvoie vers la page Groupe', () => {
    renderCard()
    expect(screen.getByTestId('rigor-score-squad-link')).toHaveAttribute('href', '/squad')
  })
})
