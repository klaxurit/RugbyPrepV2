// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GamificationIntroSheet } from '../GamificationIntroSheet'

afterEach(() => cleanup())

describe('GamificationIntroSheet', () => {
  it('porte le copy produit (conformité, pas volume)', () => {
    render(
      <MemoryRouter>
        <GamificationIntroSheet open onClose={() => undefined} lang="fr" />
      </MemoryRouter>,
    )
    const sheet = screen.getByTestId('gamification-intro-sheet')
    expect(sheet).toHaveTextContent(/faire plus ne rapporte rien/i)
    expect(sheet).toHaveTextContent('Le score de rigueur')
    expect(sheet).toHaveTextContent('L’onglet Groupe')
    expect(sheet).toHaveTextContent(/Privé par défaut/i)
    expect(sheet).toHaveTextContent(/repart de zéro/i)
  })

  it('renvoie vers /squad et appelle onClose', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <GamificationIntroSheet open onClose={onClose} lang="fr" />
      </MemoryRouter>,
    )
    const cta = screen.getByTestId('gamification-intro-cta')
    expect(cta).toHaveAttribute('href', '/squad')
    expect(cta).toHaveTextContent('Voir mon groupe')
    fireEvent.click(cta)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('permet de reporter via Pas maintenant', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <GamificationIntroSheet open onClose={onClose} lang="fr" />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('gamification-intro-dismiss')).toHaveTextContent(
      'Pas maintenant',
    )
    fireEvent.click(screen.getByTestId('gamification-intro-dismiss'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
