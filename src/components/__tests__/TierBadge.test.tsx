// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TierAvatarPhoto, TierBadge } from '../TierBadge'

const authMock = vi.fn()
const entitlementsMock = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => authMock(),
}))
vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({ profile: { preferredLanguage: 'fr' } }),
}))
vi.mock('../../contexts/EntitlementsContext', () => ({
  useEntitlementsContext: () => entitlementsMock(),
}))

const authenticated = { authState: { status: 'authenticated', user: { id: 'u1' } } }
const anonymous = { authState: { status: 'anonymous', user: null } }

function renderBadge() {
  return render(
    <MemoryRouter>
      <TierBadge />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  authMock.mockReturnValue(authenticated)
  entitlementsMock.mockReturnValue({ loading: false, isPremium: false, isFounding: false })
})
afterEach(() => cleanup())

describe('TierBadge', () => {
  it('ne rend rien si non authentifié', () => {
    authMock.mockReturnValue(anonymous)
    const { container } = renderBadge()
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche un skeleton pendant le chargement (pas de flash FREE)', () => {
    entitlementsMock.mockReturnValue({ loading: true, isPremium: false, isFounding: false })
    renderBadge()
    expect(screen.getByTestId('tier-badge-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('tier-badge')).toBeNull()
    expect(screen.queryByText('FREE')).toBeNull()
  })

  it('affiche une pastille PRO non cliquable pour un compte Pro', () => {
    entitlementsMock.mockReturnValue({ loading: false, isPremium: true, isFounding: false })
    renderBadge()
    const badge = screen.getByTestId('tier-badge')
    expect(badge).toHaveTextContent('PRO')
    expect(badge.getAttribute('data-tier')).toBe('pro')
    expect(badge.tagName).not.toBe('A')
    expect(badge.getAttribute('aria-label')).toMatch(/compte pro/i)
    expect(badge.className).toMatch(/bg-pro/)
  })

  it('traite un membre Founding comme Pro', () => {
    entitlementsMock.mockReturnValue({ loading: false, isPremium: true, isFounding: true })
    renderBadge()
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('PRO')
  })

  it('affiche un lien FREE vers l\'upsell pour un compte gratuit', () => {
    entitlementsMock.mockReturnValue({ loading: false, isPremium: false, isFounding: false })
    renderBadge()
    const badge = screen.getByTestId('tier-badge')
    expect(badge).toHaveTextContent('FREE')
    expect(badge.getAttribute('data-tier')).toBe('free')
    expect(badge.tagName).toBe('A')
    expect(badge.getAttribute('href')).toContain('/profile')
    expect(badge.getAttribute('aria-label')).toMatch(/passer en pro/i)
  })
})

describe('TierAvatarPhoto', () => {
  it('applique un anneau or pour un compte Pro', () => {
    entitlementsMock.mockReturnValue({ loading: false, isPremium: true, isFounding: false })
    render(
      <TierAvatarPhoto>
        <span>photo</span>
      </TierAvatarPhoto>,
    )
    const photo = screen.getByTestId('tier-avatar-photo')
    expect(photo.getAttribute('data-tier')).toBe('pro')
    expect(photo.className).toMatch(/border-pro/)
  })

  it('applique un anneau discret pour un compte Free', () => {
    entitlementsMock.mockReturnValue({ loading: false, isPremium: false, isFounding: false })
    render(
      <TierAvatarPhoto>
        <span>photo</span>
      </TierAvatarPhoto>,
    )
    const photo = screen.getByTestId('tier-avatar-photo')
    expect(photo.getAttribute('data-tier')).toBe('free')
    expect(photo.className).toMatch(/border-white\/25/)
  })
})
