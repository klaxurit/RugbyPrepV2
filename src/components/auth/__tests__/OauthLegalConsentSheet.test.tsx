// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OauthLegalConsentSheet } from '../OauthLegalConsentSheet'

afterEach(() => cleanup())

describe('OauthLegalConsentSheet', () => {
  it('n’envoie pas sans les deux cases', () => {
    const onSubmit = vi.fn()
    render(
      <MemoryRouter>
        <OauthLegalConsentSheet open lang="fr" onSubmit={onSubmit} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/Merci d’accepter les deux engagements/i)).toBeTruthy()
  })

  it('envoie quand 18+ et médical sont cochés', () => {
    const onSubmit = vi.fn()
    render(
      <MemoryRouter>
        <OauthLegalConsentSheet open lang="fr" onSubmit={onSubmit} />
      </MemoryRouter>,
    )

    const boxes = screen.getAllByRole('checkbox')
    fireEvent.click(boxes[0]!)
    fireEvent.click(boxes[1]!)
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
