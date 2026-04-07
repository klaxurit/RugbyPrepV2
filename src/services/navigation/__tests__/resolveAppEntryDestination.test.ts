import { describe, expect, it } from 'vitest'
import {
  sanitizeRequestedAppPath,
  resolveAuthenticatedAppDestination,
  resolvePostOnboardingDestination,
} from '../resolveAppEntryDestination'

describe('sanitizeRequestedAppPath', () => {
  it('null / undefined / empty → null', () => {
    expect(sanitizeRequestedAppPath(null)).toBeNull()
    expect(sanitizeRequestedAppPath(undefined)).toBeNull()
    expect(sanitizeRequestedAppPath('')).toBeNull()
  })

  it('route auth → null', () => {
    expect(sanitizeRequestedAppPath('/auth/login')).toBeNull()
    expect(sanitizeRequestedAppPath('/auth/signup')).toBeNull()
    expect(sanitizeRequestedAppPath('/auth/callback')).toBeNull()
  })

  it('route publique / landing → null', () => {
    expect(sanitizeRequestedAppPath('/')).toBeNull()
    expect(sanitizeRequestedAppPath('/landing')).toBeNull()
  })

  it('/onboarding → null', () => {
    expect(sanitizeRequestedAppPath('/onboarding')).toBeNull()
  })

  it('URL externe → null', () => {
    expect(sanitizeRequestedAppPath('https://evil.com')).toBeNull()
  })

  it('route protégée valide → conservée', () => {
    expect(sanitizeRequestedAppPath('/home')).toBe('/home')
    expect(sanitizeRequestedAppPath('/program')).toBe('/program')
    expect(sanitizeRequestedAppPath('/week')).toBe('/week')
    expect(sanitizeRequestedAppPath('/progress')).toBe('/progress')
    expect(sanitizeRequestedAppPath('/history')).toBe('/history')
    expect(sanitizeRequestedAppPath('/profile')).toBe('/profile')
    expect(sanitizeRequestedAppPath('/session/0')).toBe('/session/0')
    expect(sanitizeRequestedAppPath('/chat')).toBe('/chat')
    expect(sanitizeRequestedAppPath('/mobility')).toBe('/mobility')
  })

  it('route inconnue → null', () => {
    expect(sanitizeRequestedAppPath('/unknown')).toBeNull()
    expect(sanitizeRequestedAppPath('/admin')).toBeNull()
  })

  it('route protégée avec query string → conservée intégralement', () => {
    expect(sanitizeRequestedAppPath('/progress?tab=settings')).toBe('/progress?tab=settings')
    expect(sanitizeRequestedAppPath('/session/0?mode=edit')).toBe('/session/0?mode=edit')
  })

  it('route protégée avec fragment → conservée', () => {
    expect(sanitizeRequestedAppPath('/history#week2')).toBe('/history#week2')
  })

  it('route exclue avec query string → null', () => {
    expect(sanitizeRequestedAppPath('/auth/login?redirect=foo')).toBeNull()
    expect(sanitizeRequestedAppPath('/onboarding?step=3')).toBeNull()
  })
})

describe('resolveAuthenticatedAppDestination', () => {
  it('onboarding incomplet → /onboarding', () => {
    expect(resolveAuthenticatedAppDestination({ onboardingStatus: 'incomplete' })).toBe('/onboarding')
  })

  it('onboarding complet sans destination → /program', () => {
    expect(resolveAuthenticatedAppDestination({ onboardingStatus: 'complete' })).toBe('/home')
  })

  it('onboarding complet + destination protégée valide → destination conservée', () => {
    expect(resolveAuthenticatedAppDestination({ onboardingStatus: 'complete', requestedPath: '/progress' })).toBe('/progress')
  })

  it('onboarding complet + route auth invalide → fallback /program', () => {
    expect(resolveAuthenticatedAppDestination({ onboardingStatus: 'complete', requestedPath: '/auth/login' })).toBe('/home')
  })

  it('onboarding complet + /landing → fallback /program', () => {
    expect(resolveAuthenticatedAppDestination({ onboardingStatus: 'complete', requestedPath: '/landing' })).toBe('/home')
  })

  it('onboarding complet + path vide → fallback /program', () => {
    expect(resolveAuthenticatedAppDestination({ onboardingStatus: 'complete', requestedPath: '' })).toBe('/home')
    expect(resolveAuthenticatedAppDestination({ onboardingStatus: 'complete', requestedPath: null })).toBe('/home')
  })

  it('ne jamais retomber sur /week par défaut', () => {
    // /week est valide si demandé explicitement, mais le défaut est /program
    expect(resolveAuthenticatedAppDestination({ onboardingStatus: 'complete' })).toBe('/home')
  })
})

describe('resolvePostOnboardingDestination', () => {
  it('sans intention → /home', () => {
    expect(resolvePostOnboardingDestination()).toBe('/home')
    expect(resolvePostOnboardingDestination(null)).toBe('/home')
  })

  it('avec intention valide → destination conservée', () => {
    expect(resolvePostOnboardingDestination('/progress')).toBe('/progress')
  })

  it('avec intention invalide → /home', () => {
    expect(resolvePostOnboardingDestination('/auth/login')).toBe('/home')
  })
})
