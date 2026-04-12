// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { InlineActiveRecovery, ActiveRecoveryBadge } from '../ActiveRecoveryCard'

describe('InlineActiveRecovery', () => {
  it('renders 4 compact activity choices', () => {
    const { container } = render(<InlineActiveRecovery isRecoveryDay={false} onComplete={vi.fn()} />)
    const root = within(container)

    expect(root.getByTestId('ar-activity-walk')).toBeInTheDocument()
    expect(root.getByTestId('ar-activity-bike')).toBeInTheDocument()
    expect(root.getByTestId('ar-activity-mobility')).toBeInTheDocument()
    expect(root.getByTestId('ar-activity-swim')).toBeInTheDocument()
  })

  it('shows "accélère ta récupération" header on normal rest days', () => {
    const { container } = render(<InlineActiveRecovery isRecoveryDay={false} onComplete={vi.fn()} />)
    expect(container.textContent).toContain('accélère ta récupération')
  })

  it('shows "post-match" header on recovery days', () => {
    const { container } = render(<InlineActiveRecovery isRecoveryDay={true} onComplete={vi.fn()} />)
    expect(container.textContent).toContain('post-match')
  })

  it('does not show Fait ✓ before selection', () => {
    const { container } = render(<InlineActiveRecovery isRecoveryDay={false} onComplete={vi.fn()} />)
    expect(within(container).queryByTestId('ar-complete-btn')).toBeNull()
  })

  it('selecting an activity reveals detail line and Fait ✓ button', () => {
    const { container } = render(<InlineActiveRecovery isRecoveryDay={false} onComplete={vi.fn()} />)
    const root = within(container)

    fireEvent.click(root.getByTestId('ar-activity-walk'))

    expect(root.getByTestId('ar-complete-btn')).toBeInTheDocument()
    expect(container.textContent).toContain('RPE 2-3')
  })

  it('tapping Fait ✓ calls onComplete with correct args', () => {
    const onComplete = vi.fn()
    const { container } = render(<InlineActiveRecovery isRecoveryDay={false} onComplete={onComplete} />)
    const root = within(container)

    fireEvent.click(root.getByTestId('ar-activity-bike'))
    fireEvent.click(root.getByTestId('ar-complete-btn'))

    expect(onComplete).toHaveBeenCalledWith('bike', 17, 2)
  })

  it('deselecting hides the detail/confirm', () => {
    const { container } = render(<InlineActiveRecovery isRecoveryDay={false} onComplete={vi.fn()} />)
    const root = within(container)

    fireEvent.click(root.getByTestId('ar-activity-swim'))
    expect(root.getByTestId('ar-complete-btn')).toBeInTheDocument()

    fireEvent.click(root.getByTestId('ar-activity-swim')) // deselect
    expect(root.queryByTestId('ar-complete-btn')).toBeNull()
  })
})

describe('ActiveRecoveryBadge', () => {
  it('renders the compact completion badge', () => {
    const { container } = render(<ActiveRecoveryBadge />)
    expect(within(container).getByTestId('active-recovery-badge')).toBeInTheDocument()
    expect(container.textContent).toContain('Récup active')
  })
})
