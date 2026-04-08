// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { render, within } from '@testing-library/react'
import { SessionTypeMarker } from '../SessionTypeMarker'

describe('SessionTypeMarker', () => {
  it.each([
    ['personal', 'P', 'Séance personnelle'],
    ['club', 'C', 'Entraînement club'],
    ['match', 'J', 'Jour de match'],
    ['recovery', 'R', 'Récupération'],
  ] as const)('kind %s shows letter %s and aria', (kind, letter, name) => {
    const { container } = render(<SessionTypeMarker kind={kind} />)
    expect(container.textContent).toContain(letter)
    expect(within(container).getByRole('img', { name })).toBeInTheDocument()
    expect(container.querySelector(`[data-session-kind="${kind}"]`)).toBeInTheDocument()
  })

  it('compact size still exposes label', () => {
    const { container } = render(<SessionTypeMarker kind="personal" size="compact" />)
    expect(within(container).getByRole('img', { name: 'Séance personnelle' })).toBeInTheDocument()
  })
})
