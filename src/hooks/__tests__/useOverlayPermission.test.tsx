// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { OverlayGateProvider } from '../../contexts/OverlayGateProvider'
import { useOverlayPermission } from '../useOverlayPermission'
import { useOverlayGate } from '../useOverlayGate'

function wrapper({ children }: { children: ReactNode }) {
  return <OverlayGateProvider>{children}</OverlayGateProvider>
}

describe('useOverlayPermission', () => {
  it('accorde le slot au premier demandeur', () => {
    const { result } = renderHook(
      () => useOverlayPermission('founding_offer', true),
      { wrapper },
    )
    expect(result.current).toBe(true)
  })

  it('priorité supérieure déloge le détenteur', () => {
    const { result } = renderHook(
      () => {
        const founding = useOverlayPermission('founding_offer', true)
        const program = useOverlayPermission('program_evolution', true)
        const { active } = useOverlayGate()
        return { founding, program, active }
      },
      { wrapper },
    )
    expect(result.current.active).toBe('program_evolution')
    expect(result.current.program).toBe(true)
    expect(result.current.founding).toBe(false)
  })

  it('libère et laisse le suivant claim', () => {
    const { result, rerender } = renderHook(
      ({ programWanted }: { programWanted: boolean }) => {
        const program = useOverlayPermission('program_evolution', programWanted)
        const founding = useOverlayPermission('founding_offer', true)
        return { program, founding }
      },
      { wrapper, initialProps: { programWanted: true } },
    )
    expect(result.current.program).toBe(true)
    expect(result.current.founding).toBe(false)

    act(() => {
      rerender({ programWanted: false })
    })
    expect(result.current.program).toBe(false)
    expect(result.current.founding).toBe(true)
  })
})
