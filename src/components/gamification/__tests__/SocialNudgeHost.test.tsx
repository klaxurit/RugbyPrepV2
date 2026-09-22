// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SocialNudgeHost } from '../SocialNudgeHost'
import type { NudgeKind, SocialNudge } from '../../../types/gamification'

const NOW = '2026-09-16T10:00:00.000Z'

function nudge(kind: NudgeKind, overrides: Partial<SocialNudge> = {}): SocialNudge {
  return {
    id: `n-${kind}`,
    kind,
    title: `Titre ${kind}`,
    body: `Corps ${kind}`,
    createdAt: '2026-09-16T09:00:00.000Z',
    ...overrides,
  }
}

function renderHost(props: Partial<React.ComponentProps<typeof SocialNudgeHost>> = {}) {
  return render(
    <MemoryRouter>
      <SocialNudgeHost
        candidates={[]}
        nudgesShownThisWeek={0}
        isSessionRunning={false}
        hasBlockingOverlay={false}
        nowISO={NOW}
        lang="fr"
        onConsume={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  )
}

afterEach(() => cleanup())

describe('SocialNudgeHost', () => {
  it('ne rend rien sans candidat', () => {
    renderHost()
    expect(screen.queryByTestId('social-nudge-toast')).toBeNull()
    expect(screen.queryByTestId('social-nudge-sheet')).toBeNull()
  })

  it('n’interrompt jamais une séance en cours', () => {
    renderHost({ candidates: [nudge('league_overtaken')], isSessionRunning: true })
    expect(screen.queryByTestId('social-nudge-toast')).toBeNull()
  })

  it('cède la place à un overlay bloquant', () => {
    renderHost({ candidates: [nudge('league_overtaken')], hasBlockingOverlay: true })
    expect(screen.queryByTestId('social-nudge-toast')).toBeNull()
  })

  it('respecte le quota hebdomadaire d’interruptions', () => {
    renderHost({ candidates: [nudge('league_overtaken')], nudgesShownThisWeek: 2 })
    expect(screen.queryByTestId('social-nudge-toast')).toBeNull()
  })

  it('n’affiche qu’un seul nudge, le plus prioritaire', () => {
    renderHost({
      candidates: [nudge('club_pulse'), nudge('level_up'), nudge('kudos_received')],
    })
    expect(screen.getByTestId('social-nudge-sheet')).toHaveAttribute(
      'data-nudge-kind',
      'level_up',
    )
    expect(screen.queryByTestId('social-nudge-toast')).toBeNull()
  })

  it('célèbre un palier en sheet et le reste en toast', () => {
    const { unmount } = renderHost({ candidates: [nudge('level_up')] })
    expect(screen.getByTestId('social-nudge-sheet')).toBeInTheDocument()
    unmount()

    renderHost({ candidates: [nudge('kudos_received')] })
    expect(screen.getByTestId('social-nudge-toast')).toBeInTheDocument()
  })

  it('ignore un nudge périmé', () => {
    renderHost({
      candidates: [nudge('league_overtaken', { createdAt: '2026-09-10T09:00:00.000Z' })],
    })
    expect(screen.queryByTestId('social-nudge-toast')).toBeNull()
  })

  it('consomme le nudge à la fermeture et ne le remonte pas', () => {
    const onConsume = vi.fn()
    const candidates = [nudge('kudos_received')]
    const { rerender } = render(
      <MemoryRouter>
        <SocialNudgeHost
          candidates={candidates}
          nudgesShownThisWeek={0}
          isSessionRunning={false}
          hasBlockingOverlay={false}
          nowISO={NOW}
          lang="fr"
          onConsume={onConsume}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onConsume).toHaveBeenCalledWith('n-kudos_received')

    // Le parent peut mettre un rendu de retard avant de purger la liste : le
    // nudge fermé ne doit pas réapparaître entre-temps.
    rerender(
      <MemoryRouter>
        <SocialNudgeHost
          candidates={candidates}
          nudgesShownThisWeek={0}
          isSessionRunning={false}
          hasBlockingOverlay={false}
          nowISO={NOW}
          lang="fr"
          onConsume={onConsume}
        />
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('social-nudge-toast')).toBeNull()
  })

  it('affiche l’action quand le nudge en propose une', () => {
    renderHost({
      candidates: [
        nudge('league_overtaken', { actionHref: '/squad', actionLabel: 'Voir ma ligue' }),
      ],
    })
    const link = screen.getByRole('link', { name: 'Voir ma ligue' })
    expect(link).toHaveAttribute('href', '/squad')
  })
})
