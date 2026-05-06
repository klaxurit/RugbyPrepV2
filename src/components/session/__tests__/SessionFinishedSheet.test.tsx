// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { SessionFinishedSheet } from '../SessionFinishedSheet'

afterEach(() => cleanup())

const baseProps = {
  open: true,
  onClose: () => {},
  sessionLabel: 'Bas du corps · Hypertrophie',
  durationMin: 47,
  completedSets: 12,
  totalSets: 12,
  tonnageKg: 1240,
  prs: [],
  isPremium: true,
  onConfirm: vi.fn(),
}

describe('SessionFinishedSheet', () => {
  it('affiche le récap auto (durée, sets, tonnage)', () => {
    render(<SessionFinishedSheet {...baseProps} onConfirm={vi.fn()} />)
    expect(screen.getByTestId('finish-recap-duration')).toHaveTextContent("47'")
    expect(screen.getByTestId('finish-recap-sets')).toHaveTextContent('12/12')
    expect(screen.getByTestId('finish-recap-tonnage')).toHaveTextContent('1.2K kg')
  })

  it('affiche l\'eyebrow "Séance bouclée" et la quote', () => {
    render(<SessionFinishedSheet {...baseProps} onConfirm={vi.fn()} />)
    expect(screen.getByTestId('finish-eyebrow')).toHaveTextContent(/séance bouclée/i)
    expect(screen.getByTestId('finish-quote')).toHaveTextContent(/bien joué/i)
  })

  it('affiche "—" si la durée est null (chrono non lancé)', () => {
    render(
      <SessionFinishedSheet
        {...baseProps}
        durationMin={null}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByTestId('finish-recap-duration')).toHaveTextContent('—')
  })

  it('floute le tonnage et affiche un cadenas pour un user non Premium', () => {
    render(
      <SessionFinishedSheet
        {...baseProps}
        isPremium={false}
        onConfirm={vi.fn()}
      />,
    )
    const cell = screen.getByTestId('finish-recap-tonnage')
    expect(cell).toBeInTheDocument()
    expect(screen.getByTestId('finish-recap-tonnage-lock')).toBeInTheDocument()
  })

  it('CTA actif dès l\'ouverture (RPE pré-rempli à 5 — Modéré+)', () => {
    render(<SessionFinishedSheet {...baseProps} onConfirm={vi.fn()} />)
    const btn = screen.getByTestId('finish-confirm-btn') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    expect(screen.getByTestId('finish-rpe-label')).toHaveTextContent(/5/)
  })

  it('valide avec le RPE par défaut si l\'utilisateur ne touche pas le slider', () => {
    const onConfirm = vi.fn()
    render(<SessionFinishedSheet {...baseProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByTestId('finish-confirm-btn'))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ rpe: 5, fatigue: 'OK' }),
    )
  })

  it('valide avec fatigue + RPE auto-renseignés et payload correct', () => {
    const onConfirm = vi.fn()
    render(
      <SessionFinishedSheet
        {...baseProps}
        durationMin={47}
        tonnageKg={1240}
        onConfirm={onConfirm}
      />,
    )
    fireEvent.change(screen.getByTestId('finish-rpe-slider'), { target: { value: '7' } })
    fireEvent.click(screen.getByTestId('finish-fatigue-fatigue'))
    fireEvent.click(screen.getByTestId('finish-confirm-btn'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      fatigue: 'FATIGUE',
      rpe: 7,
      durationMin: 47,
      tonnageKg: 1240,
    })
  })

  it('charge sRPE = rpe × duration affichée live', () => {
    render(
      <SessionFinishedSheet
        {...baseProps}
        durationMin={50}
        onConfirm={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByTestId('finish-rpe-slider'), { target: { value: '8' } })
    expect(screen.getByTestId('finish-recap-srpe')).toHaveTextContent('400')
  })

  it('affiche un insight "PR" quand des records sont fournis', () => {
    render(
      <SessionFinishedSheet
        {...baseProps}
        prs={[{ exerciseId: 'back_squat', previousBest: 90, newBest: 100 }]}
        onConfirm={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByTestId('finish-rpe-slider'), { target: { value: '7' } })
    expect(screen.getByTestId('finish-insight')).toHaveTextContent(/100/)
  })

  it('affiche un insight "deload" si RPE 9+ et reps incomplètes', () => {
    render(
      <SessionFinishedSheet
        {...baseProps}
        completedSets={6}
        totalSets={12}
        onConfirm={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByTestId('finish-rpe-slider'), { target: { value: '9' } })
    expect(screen.getByTestId('finish-insight')).toHaveTextContent(/deload/i)
  })
})
