// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ReturnToClubPromptSheet } from '../ReturnToClubPromptSheet'

afterEach(() => cleanup())

const baseProps = {
  open: true,
  lang: 'fr' as const,
  today: '2026-07-14',
  needsClub: false,
  onSave: vi.fn(),
  onLater: vi.fn(),
}

describe('ReturnToClubPromptSheet', () => {
  it('affiche le sheet avec titre et corps en français', () => {
    render(<ReturnToClubPromptSheet {...baseProps} />)
    expect(screen.getByRole('dialog', { name: /date de reprise au club/i })).toBeInTheDocument()
    expect(screen.getByText(/quand reprends-tu les entraînements/i)).toBeInTheDocument()
    expect(screen.getByText(/calibre ta pré-saison/i)).toBeInTheDocument()
  })

  it('réinitialise le formulaire à chaque montage (comme ReturnToClubPromptMount)', () => {
    const { unmount } = render(<ReturnToClubPromptSheet {...baseProps} />)
    fireEvent.change(screen.getByTestId('return-club-date-input'), {
      target: { value: '2026-08-15' },
    })
    unmount()
    render(<ReturnToClubPromptSheet {...baseProps} />)
    expect((screen.getByTestId('return-club-date-input') as HTMLInputElement).value).toBe('')
  })

  it('bloque la sauvegarde sans date et affiche une erreur', () => {
    const onSave = vi.fn()
    render(<ReturnToClubPromptSheet {...baseProps} onSave={onSave} />)
    fireEvent.click(screen.getByTestId('return-club-prompt-save'))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/choisis une date de reprise/i)
  })

  it('sauvegarde la date de reprise', () => {
    const onSave = vi.fn()
    render(<ReturnToClubPromptSheet {...baseProps} onSave={onSave} />)
    fireEvent.change(screen.getByTestId('return-club-date-input'), {
      target: { value: '2026-08-15' },
    })
    fireEvent.click(screen.getByTestId('return-club-prompt-save'))
    expect(onSave).toHaveBeenCalledWith({ returnDate: '2026-08-15' })
  })

  it('propose le club seulement quand needsClub est vrai', () => {
    const { rerender } = render(<ReturnToClubPromptSheet {...baseProps} needsClub={false} />)
    expect(screen.queryByText(/ton club/i)).not.toBeInTheDocument()

    rerender(<ReturnToClubPromptSheet {...baseProps} needsClub />)
    expect(screen.getByText(/ton club/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/rechercher un club ffr/i)).toBeInTheDocument()
  })

  it('inclut le club dans le payload seulement si un code est sélectionné', () => {
    const onSave = vi.fn()
    render(<ReturnToClubPromptSheet {...baseProps} needsClub onSave={onSave} />)
    fireEvent.change(screen.getByTestId('return-club-date-input'), {
      target: { value: '2026-08-15' },
    })
    fireEvent.click(screen.getByTestId('return-club-prompt-save'))
    expect(onSave).toHaveBeenCalledWith({ returnDate: '2026-08-15' })
  })

  it('appelle onLater depuis le bouton secondaire', () => {
    const onLater = vi.fn()
    render(<ReturnToClubPromptSheet {...baseProps} onLater={onLater} />)
    fireEvent.click(screen.getByTestId('return-club-prompt-later'))
    expect(onLater).toHaveBeenCalledTimes(1)
  })

  it('désactive les boutons pendant la sauvegarde', () => {
    render(<ReturnToClubPromptSheet {...baseProps} isSaving />)
    expect(screen.getByTestId('return-club-prompt-save')).toBeDisabled()
    expect(screen.getByTestId('return-club-prompt-later')).toBeDisabled()
  })

  it('affiche les libellés en anglais', () => {
    render(<ReturnToClubPromptSheet {...baseProps} lang="en" />)
    expect(screen.getByRole('dialog', { name: /club return date/i })).toBeInTheDocument()
    expect(screen.getByText(/when do training sessions resume/i)).toBeInTheDocument()
    expect(screen.getByTestId('return-club-prompt-later')).toHaveTextContent(/remind me next week/i)
  })
})
