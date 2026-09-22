// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { LeagueBoard } from '../LeagueBoard'
import type { LeaderboardEntry } from '../../../types/gamification'

function entry(overrides: Partial<LeaderboardEntry> & { userId: string }): LeaderboardEntry {
  return {
    displayName: `Athlète ${overrides.userId}`,
    avatarUrl: null,
    clubCode: '4207Y',
    clubName: 'Test RFC',
    points: 0,
    sessionsCompleted: 0,
    daysSinceLastSession: 1,
    level: 'espoir',
    rank: 1,
    isSelf: false,
    ...overrides,
  }
}

const entries: LeaderboardEntry[] = [
  entry({
    userId: 'a',
    displayName: 'Léo Martin',
    points: 80,
    rank: 1,
    sessionsCompleted: 3,
    daysSinceLastSession: 0,
  }),
  entry({
    userId: 'b',
    displayName: 'Anna Roux',
    points: 55,
    rank: 2,
    isSelf: true,
    sessionsCompleted: 2,
    daysSinceLastSession: 1,
  }),
  entry({
    userId: 'c',
    displayName: 'Hugo Blanc',
    points: 20,
    rank: 3,
    sessionsCompleted: 0,
    daysSinceLastSession: 12,
  }),
]

afterEach(() => cleanup())

describe('LeagueBoard', () => {
  it('affiche le message vide plutôt qu’un tableau sans ligne', () => {
    render(
      <LeagueBoard
        title="Ligue"
        entries={[]}
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel="Personne pour l’instant."
      />,
    )
    expect(screen.getByText('Personne pour l’instant.')).toBeInTheDocument()
    expect(screen.queryByTestId('league-row')).toBeNull()
  })

  it('distingue la ligne de l’athlète courant', () => {
    render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel=""
      />,
    )
    const self = screen.getByTestId('league-row-self')
    expect(self).toHaveTextContent('Anna Roux')
    expect(screen.getAllByTestId('league-row')).toHaveLength(2)
  })

  it('n’affiche aucun écart de points entre athlètes', () => {
    const { container } = render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel=""
      />,
    )
    // On montre des totaux (80, 55, 20), jamais un différentiel signé.
    expect(container.textContent).not.toMatch(/[−+-]\d+\s*pts/)
  })

  it('ne propose un kudos que pour une séance du jour (pas soi, pas vieux log)', () => {
    render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        kudosGiven={new Set()}
        onGiveKudos={vi.fn()}
        lang="fr"
        emptyLabel=""
      />,
    )
    // Léo (récence 0) oui ; Anna (soi) non ; Hugo (12 j) non.
    expect(screen.getAllByTestId('kudos-button')).toHaveLength(1)
    expect(screen.getByLabelText(/Saluer la séance de Léo Martin/i)).toBeInTheDocument()
  })

  it('n’affiche aucun bouton kudos sans gestionnaire (classement en lecture)', () => {
    render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel=""
      />,
    )
    expect(screen.queryByTestId('kudos-button')).toBeNull()
  })

  it('désactive le bouton d’un athlète déjà salué', () => {
    render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        kudosGiven={new Set(['a'])}
        onGiveKudos={vi.fn()}
        lang="fr"
        emptyLabel=""
      />,
    )
    const button = screen.getByTestId('kudos-button')
    expect(button).toBeDisabled()
  })

  it('annonce les seuils uniquement quand des mouvements sont prévus', () => {
    const { container, unmount } = render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        promotionCutoff={0}
        relegationCutoff={0}
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel=""
      />,
    )
    expect(container.textContent).not.toMatch(/promus/i)
    unmount()

    render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        promotionCutoff={1}
        relegationCutoff={3}
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel=""
      />,
    )
    expect(screen.getByText(/Top 1 promus/i)).toBeInTheDocument()
  })

  it('montre un indice de forme SVG hot ou dormant', () => {
    render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel=""
      />,
    )
    const cues = screen.getAllByTestId('league-form-cue')
    expect(cues.map((node) => node.getAttribute('data-form-cue'))).toEqual([
      'hot',
      'hot',
      'dormant',
    ])
  })

  it('affiche le countdown fin de ligue quand un palier et une date sont fournis', () => {
    render(
      <LeagueBoard
        title="Ligue"
        entries={entries}
        tier="premiere"
        todayISO="2026-09-16"
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel=""
      />,
    )
    expect(screen.getByTestId('league-countdown')).toHaveTextContent('Fin de ligue dans 5 j')
  })

  it('n’affiche pas le countdown sur le classement club (sans tier)', () => {
    render(
      <LeagueBoard
        title="Club"
        entries={entries}
        todayISO="2026-09-16"
        kudosGiven={new Set()}
        lang="fr"
        emptyLabel=""
      />,
    )
    expect(screen.queryByTestId('league-countdown')).toBeNull()
  })
})
