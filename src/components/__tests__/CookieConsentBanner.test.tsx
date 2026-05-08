// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CookieConsentBanner } from '../CookieConsentBanner'

const initPostHogMock = vi.fn()
const optOutMock = vi.fn()

vi.mock('../../services/analytics/posthog', () => ({
  initPostHog: () => initPostHogMock(),
  posthog: { opt_out_capturing: () => optOutMock() },
}))

describe('CookieConsentBanner — WS9', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders when no consent recorded', () => {
    render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    )
    expect(screen.getByRole('dialog', { name: /cookies/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Accepter/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Refuser/i })).toBeTruthy()
  })

  it('does not render when consent already accepted', () => {
    localStorage.setItem('rugbyprep.cookies.consent', 'accepted')
    const { container } = render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('does not render when consent already declined', () => {
    localStorage.setItem('rugbyprep.cookies.consent', 'declined')
    const { container } = render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('Accepter persists "accepted", boots posthog, hides banner', () => {
    const { container } = render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Accepter/i }))
    expect(localStorage.getItem('rugbyprep.cookies.consent')).toBe('accepted')
    expect(initPostHogMock).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('Refuser persists "declined", does NOT boot posthog, hides banner', () => {
    const { container } = render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Refuser/i }))
    expect(localStorage.getItem('rugbyprep.cookies.consent')).toBe('declined')
    expect(initPostHogMock).not.toHaveBeenCalled()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })
})
