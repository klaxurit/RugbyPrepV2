// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CompetitionPauseCard } from '../CompetitionPauseCard'

afterEach(() => cleanup())

describe('CompetitionPauseCard', () => {
  it('active la pause au clic', async () => {
    const onToggle = vi.fn().mockResolvedValue(true)
    render(
      <CompetitionPauseCard
        active={false}
        endsOn={null}
        onToggle={onToggle}
        lang="fr"
      />,
    )
    fireEvent.click(screen.getByTestId('competition-pause-toggle'))
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(true))
  })

  it('affiche la date de fin quand active', () => {
    render(
      <CompetitionPauseCard
        active
        endsOn="2026-11-28"
        onToggle={vi.fn()}
        lang="fr"
      />,
    )
    expect(screen.getByTestId('competition-pause-card')).toHaveAttribute(
      'data-pause-active',
      'true',
    )
    expect(screen.getByText(/2026-11-28/)).toBeInTheDocument()
  })
})
