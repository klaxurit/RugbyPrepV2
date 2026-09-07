// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PasswordUpgradeSheet } from '../PasswordUpgradeSheet'
import { NewsletterOptInSheet } from '../NewsletterOptInSheet'

afterEach(() => cleanup())

describe('PasswordUpgradeSheet', () => {
  it('blocks submit when the password is too short', () => {
    const onSubmit = vi.fn()
    render(<PasswordUpgradeSheet open onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'azerty' } })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'azerty' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Mot de passe trop faible (10 caractères minimum).')).toBeTruthy()
  })

  it('submits a valid matching password', () => {
    const onSubmit = vi.fn()
    render(<PasswordUpgradeSheet open onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'azerty12xx' } })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'azerty12xx' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(onSubmit).toHaveBeenCalledWith('azerty12xx')
  })
})

describe('NewsletterOptInSheet', () => {
  it('exposes accept and decline with no-ads reassurance', () => {
    const onAccept = vi.fn()
    const onDecline = vi.fn()
    render(<NewsletterOptInSheet open onAccept={onAccept} onDecline={onDecline} />)

    expect(screen.getByText(/Pas de pubs/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Oui, tenez-moi au courant/i }))
    fireEvent.click(screen.getByRole('button', { name: /Non merci/i }))
    expect(onAccept).toHaveBeenCalledTimes(1)
    expect(onDecline).toHaveBeenCalledTimes(1)
  })
})
