// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SocialVisibilityPicker } from '../SocialVisibilityPicker'

afterEach(() => cleanup())

describe('SocialVisibilityPicker', () => {
  it('propose exactement trois périmètres, sans option publique nominative', () => {
    render(
      <SocialVisibilityPicker
        value="private"
        onChange={vi.fn()}
        displayName="Anna Roux"
        lang="fr"
      />,
    )
    expect(screen.getByTestId('social-visibility-private')).toBeInTheDocument()
    expect(screen.getByTestId('social-visibility-club')).toBeInTheDocument()
    expect(screen.getByTestId('social-visibility-cohort')).toBeInTheDocument()
    expect(screen.getByTestId('social-visibility-picker').textContent).not.toMatch(
      /monde|public|global/i,
    )
  })

  it('marque le périmètre courant', () => {
    render(
      <SocialVisibilityPicker
        value="club"
        onChange={vi.fn()}
        displayName="Anna Roux"
        lang="fr"
      />,
    )
    expect(screen.getByTestId('social-visibility-club')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByTestId('social-visibility-private')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('remonte le choix de l’athlète', () => {
    const onChange = vi.fn()
    render(
      <SocialVisibilityPicker
        value="private"
        onChange={onChange}
        displayName="Anna Roux"
        lang="fr"
      />,
    )
    fireEvent.click(screen.getByTestId('social-visibility-cohort'))
    expect(onChange).toHaveBeenCalledWith('cohort')
  })

  it('prévient qu’un opt-in sans prénom reste sans effet', () => {
    render(
      <SocialVisibilityPicker value="club" onChange={vi.fn()} displayName="  " lang="fr" />,
    )
    expect(screen.getByText(/prénom/i)).toBeInTheDocument()
  })

  it('n’affiche pas cet avertissement en mode privé', () => {
    render(
      <SocialVisibilityPicker value="private" onChange={vi.fn()} displayName={null} lang="fr" />,
    )
    expect(screen.queryByText(/prénom/i)).toBeNull()
  })

  it('annonce qu’aucune donnée de santé n’est partagée', () => {
    render(
      <SocialVisibilityPicker
        value="cohort"
        onChange={vi.fn()}
        displayName="Anna Roux"
        lang="fr"
      />,
    )
    expect(screen.getByText(/aucune donnée de santé/i)).toBeInTheDocument()
  })
})
