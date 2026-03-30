// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MotherSessionBlock } from '../MotherSessionBlock'
import type { Block } from '../../../types/motherSession'
import type { SessionContentFr } from '../../../services/motherSession/motherSessionContentFr'

describe('MotherSessionBlock', () => {
  afterEach(() => {
    cleanup()
  })

  it('affiche les fallbackOptions FR quand elles existent', () => {
    const block: Block = {
      number: 1,
      name: 'Upper ballistic',
      format: '3 rounds',
      exercises: [{ name: 'Med Ball Chest Pass', prescription: '3 reps' }],
      coachingNotes: [],
      fallbackOptions: ['If no med ball is available: `Cable Press explosif`.'],
    }

    const frBlock: SessionContentFr['blocks'][0] = {
      name: 'Ballistique haut',
      format: '3 tours',
      exercises: [{ name: 'Lancer medecine ball poitrine mur', prescription: '3 reps' }],
      coachingNotes: [],
      fallbackOptions: ['Si pas de med ball : `Cable Press explosif`.'],
    }

    render(<MotherSessionBlock block={block} frBlock={frBlock} />)

    fireEvent.click(screen.getByRole('button', { name: /alternatives/i }))

    expect(screen.getByText(/Si pas de med ball/i)).toBeInTheDocument()
    expect(screen.queryByText(/If no med ball is available/i)).not.toBeInTheDocument()
  })

  it('ouvre une fiche exercice avec des repères et un lien vidéo', () => {
    const block: Block = {
      number: 1,
      name: 'Upper strength',
      format: '3 rounds',
      exercises: [
        {
          name: 'Bench press',
          exerciseId: 'push_horizontal__bench_press__barbell',
          prescription: '3x5',
        },
      ],
      coachingNotes: [],
    }

    render(<MotherSessionBlock block={block} />)

    fireEvent.click(screen.getByRole('button', { name: /voir l'exécution/i }))

    expect(screen.getByTestId('exercise-demo-sheet')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /développé couché barre/i })).toBeInTheDocument()
    expect(screen.getByText(/Ancre les pieds au sol/i)).toBeInTheDocument()
    expect(screen.getByTitle(/développé couché barre video/i)).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com/embed/'))
    expect(screen.getByRole('link', { name: /ouvrir sur youtube/i })).toHaveAttribute('href', expect.stringContaining('youtube.com/watch'))
  })

  it('n’affiche pas l’œil sur un exo non encore couvert en vidéo', () => {
    const block: Block = {
      number: 1,
      name: 'Support',
      format: '2 rounds',
      exercises: [
        {
          name: 'Farmer carry',
          exerciseId: 'carry__farmer_walk__dumbbell',
          prescription: '20m',
        },
      ],
      coachingNotes: [],
    }

    render(<MotherSessionBlock block={block} />)

    expect(screen.queryByRole('button', { name: /voir l'exécution/i })).not.toBeInTheDocument()
  })
})
