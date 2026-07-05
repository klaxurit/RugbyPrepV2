// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react'
import { IsoChronoButton } from '../IsoChronoButton'

vi.mock('../../../hooks/useRestBeepPref', () => ({
  useRestBeepPref: () => ({ enabled: false }),
}))

vi.mock('../../../utils/audioBeep', () => ({
  playSetEndBeep: vi.fn(),
  playSideSwitchBeep: vi.fn(),
}))

const baseProps = {
  durationLow: 30,
  durationHigh: 30,
  perSide: false,
  perDirection: false,
  label: 'Gainage',
  onCompleted: vi.fn(),
}

describe('IsoChronoButton — prep 5s avant le chrono', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('affiche une fenêtre de préparation avant le chrono simple', () => {
    render(<IsoChronoButton {...baseProps} />)

    fireEvent.click(screen.getByRole('button', { name: /Démarrer · 30s/i }))

    expect(screen.getByText('Prépare-toi')).toBeInTheDocument()
    expect(screen.getByText('05')).toBeInTheDocument()
    expect(screen.queryByText('Gainage')).not.toBeInTheDocument()
  })

  it('démarre le chrono work après 5 secondes de prep', () => {
    render(<IsoChronoButton {...baseProps} />)

    fireEvent.click(screen.getByRole('button', { name: /Démarrer · 30s/i }))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('Gainage')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('perSide : prep initial indique le premier côté', () => {
    render(<IsoChronoButton {...baseProps} perSide durationLow={20} durationHigh={20} />)

    fireEvent.click(screen.getByRole('button', { name: /Démarrer · 20s/i }))

    expect(screen.getByText(/Prépare · Côté gauche/i)).toBeInTheDocument()
  })
})
