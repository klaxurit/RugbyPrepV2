// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { RigorBadgesStrip } from '../RigorBadgesStrip'

afterEach(() => cleanup())

describe('RigorBadgesStrip', () => {
  it('ne monte rien sans badge débloqué', () => {
    const { container } = render(<RigorBadgesStrip badges={[]} lang="fr" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche le libellé, le détail et la date de déblocage', () => {
    render(
      <RigorBadgesStrip
        badges={[{ badgeId: 'streak_4', unlockedAt: '2026-09-14T10:00:00.000Z' }]}
        lang="fr"
      />,
    )
    const badge = screen.getByTestId('rigor-badge')
    expect(badge).toHaveTextContent('Régulier')
    expect(badge).toHaveTextContent(/quatre semaines/i)
    expect(badge).toHaveTextContent('14')
  })

  it('n’affiche aucun jalon verrouillé', () => {
    render(
      <RigorBadgesStrip
        badges={[{ badgeId: 'streak_4', unlockedAt: '2026-09-14T10:00:00.000Z' }]}
        lang="fr"
      />,
    )
    expect(screen.getAllByTestId('rigor-badge')).toHaveLength(1)
  })

  it('ignore un badge dont la définition a disparu du barème', () => {
    const { container } = render(
      <RigorBadgesStrip
        badges={[{ badgeId: 'badge_retire', unlockedAt: '2026-09-14T10:00:00.000Z' }]}
        lang="fr"
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('tolère une date de déblocage invalide sans casser le badge', () => {
    render(
      <RigorBadgesStrip
        badges={[{ badgeId: 'deload_1', unlockedAt: 'pas-une-date' }]}
        lang="fr"
      />,
    )
    expect(screen.getByTestId('rigor-badge')).toHaveTextContent('Décharge assumée')
  })
})
