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
function seedRunningSession(sessionKey = 'TEST_MS_V1') {
  window.localStorage.setItem(
    'rf.sessionRun.v1',
    JSON.stringify({
      sessionKey,
      startedAt: Date.now(),
      completedExercises: [],
      exerciseTourLoads: {},
    }),
  )
}

const renderRunning = (ui: React.ReactElement) => {
  seedRunningSession()
  return render(
    <MemoryRouter>
      <SessionRunProvider>{ui}</SessionRunProvider>
    </MemoryRouter>,
  )
}

describe('MotherSessionBlock — SessionTourTracker exposure', () => {
  it('running + 3 tours × 2 exos → le tour 1 actif affiche 2 cases ; tours 2 et 3 collapsés', async () => {
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

    // Tour 1 est le tour actif → les deux exos sont visibles avec leur bouton Valider.
    const validateButtons = await screen.findAllByLabelText(/Valider/)
    expect(validateButtons.length).toBe(2)

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
    await screen.findAllByLabelText(/Valider/)
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
    await screen.findAllByLabelText(/Valider/)
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
    expect(screen.queryByLabelText(/Valider/)).toBeNull()
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
    expect(screen.queryByLabelText(/Valider/)).toBeNull()
  })

  it('valider les 2 exos du tour 1 → tour 2 devient actif', async () => {
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
    const tour1Buttons = await screen.findAllByLabelText(/Valider/)
    expect(tour1Buttons.length).toBe(2)
    fireEvent.click(tour1Buttons[0])
    fireEvent.click(tour1Buttons[1])

    // Le tour 2 devient actif : deux nouveaux boutons Valider apparaissent (les exos du tour 2).
    const tour2Buttons = await screen.findAllByLabelText(/Valider/)
    expect(tour2Buttons.length).toBe(2)
    expect(screen.getByText(/Tour 2\/3/i)).toBeInTheDocument()
    // Le tour 1 est maintenant listé comme "terminé".
    expect(screen.getByText(/Tour 1 · terminé/i)).toBeInTheDocument()
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
    await screen.findAllByLabelText(/Valider/)
    expect(screen.queryByText(/Logger mes kg\/reps/i)).toBeNull()
    expect(screen.queryByText(/Passer en Premium/i)).toBeNull()
  })
})
