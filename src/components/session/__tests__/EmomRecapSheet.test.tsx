// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { EmomRecapSheet } from '../EmomRecapSheet'
import type { EmomRecapField } from '../../services/session/buildEmomRecapFields'

afterEach(() => cleanup())

vi.mock('../ui/BottomSheet', () => ({
  BottomSheet: ({
    open,
    children,
    title,
  }: {
    open: boolean
    children: React.ReactNode
    title?: string
  }) => (open ? <div data-testid="bottom-sheet" data-title={title}>{children}</div> : null),
}))

const fields: EmomRecapField[] = [
  {
    exerciseId: 'sled__push__standard',
    exerciseIndex: 0,
    name: 'Sled Push',
    prescription: '20m',
    metricType: 'meters',
    alsoAskLoadKg: true,
    previous: { loadKg: 40, meters: 20 },
  },
  {
    exerciseId: 'groin_adductors__copenhagen_plank__long',
    exerciseIndex: 1,
    name: 'Copenhagen Hold',
    prescription: '20s',
    metricType: 'seconds',
    alsoAskLoadKg: false,
    previous: { seconds: 15 },
  },
]

describe('EmomRecapSheet', () => {
  it('préremplit et confirme les valeurs Pro', () => {
    const onConfirm = vi.fn()
    render(
      <EmomRecapSheet
        open
        fields={fields}
        isPremium
        lang="fr"
        onConfirm={onConfirm}
        onSkip={vi.fn()}
      />,
    )

    expect(screen.getByTestId('emom-recap-kg-sled__push__standard')).toHaveValue(40)
    expect(screen.getByTestId('emom-recap-sec-groin_adductors__copenhagen_plank__long')).toHaveValue(
      15,
    )

    fireEvent.change(screen.getByTestId('emom-recap-kg-sled__push__standard'), {
      target: { value: '55' },
    })
    fireEvent.click(screen.getByTestId('emom-recap-confirm'))

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        sled__push__standard: expect.objectContaining({ loadKg: 55, meters: 20 }),
        'groin_adductors__copenhagen_plank__long': expect.objectContaining({ seconds: 15 }),
      }),
    )
  })

  it('Free : pas de confirm, skip disponible', () => {
    const onSkip = vi.fn()
    render(
      <EmomRecapSheet
        open
        fields={fields}
        isPremium={false}
        lang="fr"
        onConfirm={vi.fn()}
        onSkip={onSkip}
      />,
    )
    expect(screen.queryByTestId('emom-recap-confirm')).toBeNull()
    fireEvent.click(screen.getByTestId('emom-recap-skip'))
    expect(onSkip).toHaveBeenCalled()
  })
})
