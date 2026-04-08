// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { SessionStatusIndicator } from '../SessionStatusIndicator'

describe('SessionStatusIndicator', () => {
  it('completed : icône seule timeline, nom accessible et pas de libellé visible', () => {
    const { container } = render(<SessionStatusIndicator status="completed" />)
    expect(
      within(container).getByRole('group', { name: 'Séance terminée' }),
    ).toBeInTheDocument()
    expect(container.textContent?.trim()).toBe('')
    expect(container.querySelector('[data-session-status="completed"]')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('missed exposes distinct accessible name and label Passée', () => {
    const { container } = render(<SessionStatusIndicator status="missed" />)
    expect(
      within(container).getByRole('group', {
        name: 'Créneau dépassé sans complétion de séance',
      }),
    ).toBeInTheDocument()
    expect(container.textContent).toContain('Passée')
    expect(container.querySelector('[data-session-status="missed"]')).toBeInTheDocument()
  })

  it('skipped without undo uses sautée label and neutral group name', () => {
    const { container } = render(<SessionStatusIndicator status="skipped" />)
    expect(within(container).getByRole('group', { name: 'Séance sautée' })).toBeInTheDocument()
    expect(container.textContent).toContain('Sautée')
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('[data-session-status="skipped"]')).toBeInTheDocument()
  })

  it('skipped with undo shows button and announces undo possibility', () => {
    const onUndo = vi.fn()
    const { container } = render(<SessionStatusIndicator status="skipped" onUndo={onUndo} undoLabel="Défaire" />)
    expect(
      within(container).getByRole('group', { name: 'Séance sautée, annulation possible' }),
    ).toBeInTheDocument()
    fireEvent.click(within(container).getByRole('button', { name: 'Défaire' }))
    expect(onUndo).toHaveBeenCalledTimes(1)
  })
})
