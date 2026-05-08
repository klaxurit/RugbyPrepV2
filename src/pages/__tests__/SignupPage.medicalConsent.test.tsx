// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, render, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SignupPage } from '../auth/SignupPage'

// useAuth().signUp must receive medicalConsentAcceptedAt — that's the WS9 contract.
const signUpMock = vi.fn()
const useAuthMock = vi.fn(() => ({
  authState: { status: 'anonymous' as const, user: null },
  isInitializing: false,
  signUp: signUpMock,
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../services/analytics/posthog', () => ({
  posthog: { capture: vi.fn(), identify: vi.fn(), reset: vi.fn() },
}))

function fillForm(opts: { age: boolean; medical: boolean }) {
  fireEvent.change(screen.getByLabelText(/Prénom/i), { target: { value: 'Antoine' } })
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@test.local' } })
  fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'azerty12' } })

  // Disable HTML5 native validation so we can exercise our own JS guard
  // (otherwise unchecked-required intercepts submit before handleSubmit runs).
  const form = screen.getByRole('button', { name: /Créer mon compte/i }).closest('form')!
  form.setAttribute('novalidate', '')

  const checkboxes = screen.getAllByRole('checkbox')
  // Ordre dans le DOM : âge/CGU d'abord, médical ensuite (cf. SignupPage).
  if (opts.age) fireEvent.click(checkboxes[0])
  if (opts.medical) fireEvent.click(checkboxes[1])
}

describe('SignupPage — WS9 medical consent hard gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signUpMock.mockResolvedValue({ ok: true, value: { id: 'u1', email: 'a@test.local', displayName: 'Antoine' } })
  })

  afterEach(() => {
    cleanup()
  })

  it('signUp is NOT called when medical consent is unticked', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<SignupPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fillForm({ age: true, medical: false })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }))

    expect(signUpMock).not.toHaveBeenCalled()
    expect(screen.getByText(/Merci d'accepter les deux engagements/i)).toBeTruthy()
  })

  it('signUp is NOT called when age confirmation is unticked', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<SignupPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fillForm({ age: false, medical: true })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }))

    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('signUp receives a valid medicalConsentAcceptedAt ISO when both boxes are ticked', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<SignupPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fillForm({ age: true, medical: true })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }))

    // signUp is called synchronously from handleSubmit's await, so flush microtasks.
    await Promise.resolve()
    expect(signUpMock).toHaveBeenCalledTimes(1)
    const arg = signUpMock.mock.calls[0]![0]
    expect(arg.email).toBe('a@test.local')
    expect(arg.password).toBe('azerty12')
    expect(arg.displayName).toBe('Antoine')
    expect(typeof arg.medicalConsentAcceptedAt).toBe('string')
    // ISO format YYYY-MM-DDTHH:mm:ss.sssZ
    expect(arg.medicalConsentAcceptedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
