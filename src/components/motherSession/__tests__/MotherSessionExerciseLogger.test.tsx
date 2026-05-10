// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MotherSessionBlock } from '../MotherSessionBlock'
import { SessionRunProvider } from '../../../contexts/SessionRunContext'
import type { Block } from '../../../types/motherSession'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

beforeEach(() => {
  window.localStorage.clear()
})

// 3 tours × 2 exos = 6 étapes à valider
const loggableBlock: Block = {
  number: 1,
  name: 'Puissance Lower',
  format: '3 tours · Repos 3 min',
  exercises: [
    { name: 'Bench Press', prescription: '3×5 @80%' },
    { name: 'Pendlay Row', prescription: '3×5' },
  ],
  coachingNotes: [],
}

const unloggableBlock: Block = {
  number: 0,
  name: 'Warm-Up',
  format: '',
  exercises: [
    { name: '2 progressive prep sets', prescription: '' },
    { name: '1 easy prep round', prescription: '' },
  ],
  coachingNotes: [],
}

/** Pré-installe un run en cours dans localStorage. */
function seedRunningSession(opts?: {
  sessionKey?: string
  completedExercises?: string[]
}) {
  const sessionKey = opts?.sessionKey ?? 'TEST_MS_V1'
  window.localStorage.setItem(
    'rf.sessionRun.v1',
    JSON.stringify({
      sessionKey,
      startedAt: Date.now(),
      completedExercises: opts?.completedExercises ?? [],
      exerciseTourLoads: {},
    }),
  )
}

const renderRunning = (
  ui: React.ReactElement,
  seedOpts?: Parameters<typeof seedRunningSession>[0],
) => {
  seedRunningSession(seedOpts)
  return render(
    <MemoryRouter>
      <SessionRunProvider>{ui}</SessionRunProvider>
    </MemoryRouter>,
  )
}

describe('MotherSessionBlock — SessionTourTracker exposure', () => {
  it('running + 3 tours × 2 exos → le tour 1 actif rend les 2 exos visibles', async () => {
    renderRunning(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        isRunning
        isPremium={false}
      />,
    )

    // Tour 1 actif : les deux exos rendus comme <li>.
    await screen.findByText(/Tour 1\/3/i)
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBe(2)

    // Tours 2 et 3 sont collapsés → leur header "Tour N · à venir" est visible.
    expect(screen.getByText(/Tour 2 · à venir/i)).toBeInTheDocument()
    expect(screen.getByText(/Tour 3 · à venir/i)).toBeInTheDocument()

    // Le label "Tour actif" affiché dans l'en-tête : Tour 1/3.
    expect(screen.getByText(/Tour 1\/3/i)).toBeInTheDocument()
  })

  it('running free → pas d\'inputs kg/reps dans les étapes actives', async () => {
    renderRunning(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        isRunning
        isPremium={false}
      />,
    )
    await screen.findByText(/Tour 1\/3/i)
    expect(screen.queryByLabelText(/Charge \(kg\)/i)).toBeNull()
    expect(screen.queryByLabelText(/^Reps$/i)).toBeNull()
  })

  it('running premium → inputs kg/reps rendus pour chaque exo actif', async () => {
    renderRunning(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        isRunning
        isPremium
        getLastEntryForExercise={(id) =>
          id === 'push_horizontal__bench_press__barbell'
            ? { exerciseId: id, loadKg: 80, reps: 5 }
            : undefined
        }
      />,
    )
    await screen.findByText(/Tour 1\/3/i)
    expect(screen.getAllByLabelText(/Charge \(kg\)/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByLabelText(/^Reps$/).length).toBeGreaterThanOrEqual(1)
  })

  it('no loggable exos → tracker pas rendu', () => {
    renderRunning(
      <MotherSessionBlock
        block={unloggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        isRunning
        isPremium
      />,
    )
    // Header "Tour X/Y" du tracker absent → tracker pas rendu.
    expect(screen.queryByText(/Tour 1\/3/i)).toBeNull()
  })

  it('not running → tracker pas rendu même sur un bloc loggable', () => {
    render(
      <MemoryRouter>
        <SessionRunProvider>
          <MotherSessionBlock
            block={loggableBlock}
            motherSessionId="TEST_MS_V1"
            sessionType="UPPER"
            week="W1"
            fatigue="OK"
            isRunning={false}
            isPremium
          />
        </SessionRunProvider>
      </MemoryRouter>,
    )
    // Hors run mode, le tracker n'est pas rendu — pas de header "Tour X/Y".
    expect(screen.queryByText(/Tour 1\/3/i)).toBeNull()
  })

  it('tour 1 entièrement validé (state seed) → tour 2 devient actif', async () => {
    // On seed les deux exos du tour 1 comme déjà cochés (block.number=1, tour=0).
    renderRunning(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        isRunning
        isPremium={false}
      />,
      { completedExercises: ['1_0_0', '1_0_1'] },
    )

    // Tour 2 est maintenant actif : ses 2 exos sont rendus.
    expect(await screen.findByText(/Tour 2\/3/i)).toBeInTheDocument()
    // Tour 1 est marqué terminé.
    expect(screen.getByText(/Tour 1 · terminé/i)).toBeInTheDocument()
    // Tour 3 reste collapsé.
    expect(screen.getByText(/Tour 3 · à venir/i)).toBeInTheDocument()
  })

  it('aucun CTA Premium "Logger mes kg/reps" n\'apparaît en mode En cours', async () => {
    renderRunning(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        isRunning
        isPremium={false}
      />,
    )
    await screen.findByText(/Tour 1\/3/i)
    expect(screen.queryByText(/Logger mes kg\/reps/i)).toBeNull()
    expect(screen.queryByText(/Activer Premium/i)).toBeNull()
  })

  it('série validée → la carte est cliquable pour annuler (role=button)', async () => {
    renderRunning(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        isRunning
        isPremium={false}
      />,
      { completedExercises: ['1_0_0'] }, // tour 1, premier exo validé
    )

    // La carte de l'exo validé est rendue avec role="button" + le hint "Toucher pour annuler".
    const undoHint = await screen.findByText(/Toucher pour annuler/i)
    expect(undoHint).toBeInTheDocument()

    // On peut la cliquer pour annuler — après le clic, le hint disparaît.
    const card = undoHint.closest('li')
    expect(card).not.toBeNull()
    if (card) fireEvent.click(card)
    expect(screen.queryByText(/Toucher pour annuler/i)).toBeNull()
  })
})
