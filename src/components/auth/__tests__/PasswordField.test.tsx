// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PasswordField } from '../PasswordField'

afterEach(() => cleanup())

describe('PasswordField', () => {
  it('masque le mot de passe par défaut et le révèle au clic', () => {
    const onChange = () => undefined
    render(
      <PasswordField
        id="password"
        label="Mot de passe"
        value="secretvalue"
        onChange={onChange}
      />,
    )

    const input = screen.getByLabelText('Mot de passe', { exact: true }) as HTMLInputElement
    expect(input.type).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
    expect(input.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Masquer le mot de passe' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }))
    expect(input.type).toBe('password')
  })
})
