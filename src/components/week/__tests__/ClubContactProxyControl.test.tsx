// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ClubContactProxyControl } from '../ClubContactProxyControl'

afterEach(() => cleanup())

describe('ClubContactProxyControl', () => {
  it('propose séance complète ou plus courte, et enregistre hard', () => {
    const onChange = vi.fn()
    render(<ClubContactProxyControl value="normal" lang="fr" onChange={onChange} />)
    expect(screen.getByTestId('club-contact-proxy')).toBeTruthy()
    expect(screen.getByText('Contact au club')).toBeTruthy()
    expect(screen.getByText(/Si ça a tapé, on raccourcit la salle/)).toBeTruthy()
    expect(screen.getByText('Séance complète')).toBeTruthy()
    expect(screen.getByText('Séance plus courte')).toBeTruthy()
    expect(screen.getByTestId('club-contact-result').textContent).toMatch(/sans coupe/)
    fireEvent.click(screen.getByTestId('club-contact-hard'))
    expect(onChange).toHaveBeenCalledWith('hard')
  })

  it('light historique = séance complète sélectionnée', () => {
    render(<ClubContactProxyControl value="light" lang="fr" onChange={vi.fn()} />)
    expect(screen.getByTestId('club-contact-normal')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('club-contact-hard')).toHaveAttribute('aria-checked', 'false')
  })

  it('confirme la coupe quand séance plus courte est déjà sélectionnée', () => {
    render(<ClubContactProxyControl value="hard" lang="fr" onChange={vi.fn()} />)
    expect(screen.getByTestId('club-contact-hard')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('club-contact-result').textContent).toMatch(/3 blocs/)
  })
})
