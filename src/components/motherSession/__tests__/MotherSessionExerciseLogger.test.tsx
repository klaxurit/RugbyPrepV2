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

/** Pré-installe un run en cours dans localStorage avant que SessionRunProvider le lise au mount. */
function seedRunningSession(sessionKey = 'TEST_MS_V1') {
  window.localStorage.setItem(
    'rf.sessionRun.v1',
    JSON.stringify({
      sessionKey,
      startedAt: Date.now(),
      completedExercises: [],
      perExerciseSets: {},
    }),
  )
}

// Block with known loggable exercises
const loggableBlock: Block = {
  number: 1,
  name: 'Strength Block',
  format: '4×5',
  exercises: [
    { name: 'Bench Press', prescription: '4×5 @80%' },
    { name: 'Pendlay Row', prescription: '4×5' },
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

const renderRunning = (ui: React.ReactElement) => {
  seedRunningSession()
  return render(
    <MemoryRouter>
      <SessionRunProvider>{ui}</SessionRunProvider>
    </MemoryRouter>,
  )
}

describe('MotherSessionBlock — SessionSetTracker exposure', () => {
  it('running + loggable exos → tracker rendered (free: no kg/reps inputs)', async () => {
    renderRunning(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        getLastEntryForExercise={() => undefined}
        isRunning
        isPremium={false}
      />,
    )
    // L'init des sets se fait dans un useEffect → attendre que les boutons apparaissent.
    const validateButtons = await screen.findAllByLabelText(/Valider série/)
    expect(validateButtons.length).toBeGreaterThanOrEqual(4)
    // Free : pas d'input kg/reps
    expect(screen.queryByLabelText(/charge en kg/i)).toBeNull()
    // Lien paywall contextuel — un par exo loggable
    expect(screen.getAllByText(/Logger mes kg\/reps/i).length).toBeGreaterThanOrEqual(1)
  })

  it('running + loggable exos → premium voit les inputs kg/reps pré-remplis', async () => {
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
    const kgInputs = (await screen.findAllByLabelText(/charge en kg/i)) as HTMLInputElement[]
    expect(kgInputs.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByLabelText(/reps$/i).length).toBeGreaterThanOrEqual(1)
    // Pré-remplissage depuis la dernière entrée — au moins un input de 80 kg
    expect(kgInputs.some((el) => el.value === '80')).toBe(true)
  })

  it('no loggable exos → no tracker rendered', () => {
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
    expect(screen.queryByLabelText(/Valider série/)).toBeNull()
  })

  it('not running → tracker not rendered even on a loggable block', () => {
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
    expect(screen.queryByLabelText(/Valider série/)).toBeNull()
  })

  it('free user: tap paywall link opens the PremiumSheet', () => {
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
    const paywallLink = screen.getAllByText(/Logger mes kg\/reps/i)[0]
    fireEvent.click(paywallLink)
    expect(screen.getByRole('dialog', { name: /suivi des charges/i })).toBeTruthy()
  })
})
