// @vitest-environment jsdom

import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
import { WeekTimelineRow } from '../WeekTimelineRow'
import { SessionStatusIndicator } from '../SessionStatusIndicator'

describe('WeekTimelineRow', () => {
  it('renders content + tags row with planKind', () => {
    render(
      <WeekTimelineRow planKind="personal">
        <span data-testid="row-body">Corps</span>
      </WeekTimelineRow>,
    )
    expect(screen.getByTestId('row-body')).toHaveTextContent('Corps')
    expect(screen.getByTestId('week-timeline-row')).toHaveAttribute('data-week-row-kind', 'personal')
  })

  it('standalone layout applies frame classes per kind', () => {
    const { container, rerender } = render(
      <WeekTimelineRow planKind="recovery" layout="standalone">
        <span>R</span>
      </WeekTimelineRow>,
    )
    const root = screen.getByTestId('week-timeline-row')
    expect(root).toHaveAttribute('data-week-row-layout', 'standalone')
    expect(root.className).toMatch(/rounded-xl/)

    rerender(
      <WeekTimelineRow planKind="club" layout="embedded">
        <span>C</span>
      </WeekTimelineRow>,
    )
    const embedded = screen.getByTestId('week-timeline-row')
    expect(embedded).toHaveAttribute('data-week-row-layout', 'embedded')
    expect(embedded.className).not.toMatch(/rounded-xl/)
    expect(container.textContent).toContain('C')
  })

  it('aligne le contenu verticalement (slot flex items-center)', () => {
    render(
      <WeekTimelineRow planKind="club">
        <span className="inline-flex h-5 items-center leading-none">Entraînement club</span>
      </WeekTimelineRow>,
    )
    const row = screen.getByTestId('week-timeline-row')
    // Le slot de contenu est le 1er enfant (le marker pastille a été retiré)
    const contentSlot = row.firstElementChild
    expect(contentSlot).not.toBeNull()
    expect(contentSlot?.className).toMatch(/items-center/)
    expect(within(row).getByText('Entraînement club')).toBeInTheDocument()
  })

  it('status slot is grouped alongside content', () => {
    render(
      <WeekTimelineRow
        planKind="match"
        statusSlot={<SessionStatusIndicator status="completed" data-testid="slot-status" />}
      >
        <span>J</span>
      </WeekTimelineRow>,
    )
    const row = screen.getByTestId('week-timeline-row')
    expect(within(row).getByTestId('slot-status')).toBeInTheDocument()
    expect(within(row).getByTestId('slot-status')).toHaveAttribute('data-session-status', 'completed')
  })
})
