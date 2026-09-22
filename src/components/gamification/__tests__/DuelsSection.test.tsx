// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DuelsSection } from '../DuelsSection'
import type { Duel } from '../../../types/gamification'

function duel(overrides: Partial<Duel> & { id: string }): Duel {
  return {
    weekStartISO: '2026-09-14',
    status: 'active',
    opponentDisplayName: 'Hugo Blanc',
    opponentAvatarUrl: null,
    selfPoints: 0,
    opponentPoints: 0,
    isChallenger: true,
    ...overrides,
  }
}

const candidates = [
  { userId: 'c1', displayName: 'Léo Martin', avatarUrl: null, level: 'cadre' as const },
]

function renderSection(props: Partial<React.ComponentProps<typeof DuelsSection>> = {}) {
  return render(
    <DuelsSection
      duels={[]}
      candidates={[]}
      onChallenge={vi.fn()}
      onRespond={vi.fn()}
      lang="fr"
      {...props}
    />,
  )
}

afterEach(() => cleanup())

describe('DuelsSection', () => {
  it('rappelle qu’un duel se joue sur la rigueur, pas sur le volume', () => {
    renderSection()
    expect(screen.getByText(/rigueur, pas sur le volume/i)).toBeInTheDocument()
  })

  it('laisse accepter ou refuser une invitation reçue', () => {
    const onRespond = vi.fn()
    renderSection({
      duels: [duel({ id: 'd1', status: 'pending', isChallenger: false })],
      onRespond,
    })
    expect(screen.getByTestId('duel-invitation')).toHaveTextContent('Hugo Blanc')

    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }))
    expect(onRespond).toHaveBeenCalledWith('d1', false)

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }))
    expect(onRespond).toHaveBeenCalledWith('d1', true)
  })

  it('n’offre pas de répondre à sa propre invitation', () => {
    renderSection({ duels: [duel({ id: 'd1', status: 'pending', isChallenger: true })] })
    expect(screen.queryByTestId('duel-invitation')).toBeNull()
    expect(screen.getByTestId('duel-sent')).toHaveTextContent('Hugo Blanc')
  })

  it('affiche le score d’un duel en cours', () => {
    renderSection({
      duels: [duel({ id: 'd1', status: 'active', selfPoints: 45, opponentPoints: 30 })],
    })
    const row = screen.getByTestId('duel-active')
    expect(row).toHaveTextContent('45')
    expect(row).toHaveTextContent('30')
    expect(row).toHaveTextContent('Tu mènes')
  })

  it('ne dévalorise pas l’athlète en retard', () => {
    renderSection({
      duels: [duel({ id: 'd1', status: 'active', selfPoints: 10, opponentPoints: 70 })],
    })
    const row = screen.getByTestId('duel-active')
    expect(row.textContent?.toLowerCase()).not.toMatch(/perd|retard|faible/)
  })

  it('n’ouvre le sélecteur d’adversaire qu’à la demande', () => {
    renderSection({ candidates })
    expect(screen.queryByTestId('duel-candidates')).toBeNull()

    fireEvent.click(screen.getByTestId('duel-open-picker'))
    expect(screen.getByTestId('duel-candidates')).toHaveTextContent('Léo Martin')
  })

  it('ne propose pas de défier quand aucun coéquipier n’est disponible', () => {
    renderSection({ candidates: [] })
    expect(screen.queryByTestId('duel-open-picker')).toBeNull()
  })

  it('lance le défi sur le coéquipier choisi', () => {
    const onChallenge = vi.fn()
    renderSection({ candidates, onChallenge })
    fireEvent.click(screen.getByTestId('duel-open-picker'))
    fireEvent.click(screen.getByRole('button', { name: /Léo Martin/ }))
    expect(onChallenge).toHaveBeenCalledWith('c1')
    expect(screen.queryByTestId('duel-candidates')).toBeNull()
  })
})
