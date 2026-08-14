import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS } from '../../../data/motherSessions.generated'
import type { Block, MotherSession } from '../../../types/motherSession'
import { truncateSessionBlocks } from '../truncateSessionBlocks'

function block(number: number, overrides: Partial<Block> = {}): Block {
  return {
    number,
    name: `Block ${number}`,
    format: '`3 rounds`, `90s` rest',
    exercises: [{ name: `Exo ${number}`, prescription: '`3×8`' }],
    coachingNotes: [],
    ...overrides,
  }
}

function session(blocks: Block[], reductionOrder?: number[]): MotherSession {
  return {
    metadata: {
      id: 'TEST_V1',
      status: 'validated',
      version: 'V1',
      cycle: 'in_season',
      sessionType: 'full',
      targetLevel: 'performance',
      targetPositionGroup: 'front_row',
      equipment: 'full_gym',
      targetDuration: '45 min',
      reductionOrder,
    },
    goal: [],
    sessionIdentity: [],
    warmUp: { exercises: [], notes: [] },
    blocks,
    progressionRules: [],
    positionAccent: [],
    injurySubstitutions: [],
    coachingWarnings: [],
    sourceReferences: [],
  }
}

describe('truncateSessionBlocks — troncature', () => {
  it('ne touche à rien sans maxBlocks ni variant light', () => {
    const s = session([block(1), block(2), block(3)])
    const result = truncateSessionBlocks(s, {})
    expect(result.session).toBe(s)
    expect(result.droppedBlockNumbers).toEqual([])
  })

  it('ne touche à rien quand la séance tient déjà dans la cible', () => {
    const s = session([block(1), block(2)])
    const result = truncateSessionBlocks(s, { maxBlocks: 3 })
    expect(result.session.blocks).toHaveLength(2)
    expect(result.droppedBlockNumbers).toEqual([])
  })

  it('retire les blocs dans l ordre déclaré par la séance', () => {
    const s = session([block(1), block(2), block(3), block(4)], [4, 3, 2])
    const result = truncateSessionBlocks(s, { maxBlocks: 2 })
    expect(result.droppedBlockNumbers).toEqual([4, 3])
    expect(result.session.blocks.map((b) => b.number)).toEqual([1, 2])
  })

  it('ne retire jamais un bloc absent de reduction_order', () => {
    // Bloc 1 protégé : il n est pas dans la liste.
    const s = session([block(1), block(2), block(3), block(4)], [4, 3, 2])
    const result = truncateSessionBlocks(s, { maxBlocks: 1 })
    expect(result.session.blocks.map((b) => b.number)).toEqual([1])
    expect(result.flooredByProtectedBlocks).toBe(false)
  })

  it('sert plus de blocs que demandé plutôt que de violer une protection', () => {
    // Deux blocs protégés, la décharge en demande un seul.
    const s = session([block(1), block(2), block(3), block(4)], [4])
    const result = truncateSessionBlocks(s, { maxBlocks: 1 })
    expect(result.session.blocks.map((b) => b.number)).toEqual([1, 2, 3])
    expect(result.flooredByProtectedBlocks).toBe(true)
  })

  it('conserve toujours au moins un bloc, même à maxBlocks 0', () => {
    const s = session([block(1), block(2), block(3), block(4)], [4, 3, 2, 1])
    const result = truncateSessionBlocks(s, { maxBlocks: 0 })
    expect(result.session.blocks).toHaveLength(1)
  })

  it('à défaut de consigne, retire les blocs optionnels puis les plus tardifs', () => {
    const s = session([block(1), block(2, { isOptional: true }), block(3), block(4)])
    const result = truncateSessionBlocks(s, { maxBlocks: 2 })
    expect(result.droppedBlockNumbers).toEqual([2, 4])
    expect(result.session.blocks.map((b) => b.number)).toEqual([1, 3])
  })

  it('ignore les numéros de bloc obsolètes dans reduction_order', () => {
    const s = session([block(1), block(2), block(3), block(4)], [9, 4, 3])
    const result = truncateSessionBlocks(s, { maxBlocks: 2 })
    expect(result.droppedBlockNumbers).toEqual([4, 3])
  })

  it('soft-floor : séance ≤2 blocs ignore maxBlocks (seul light compte)', () => {
    const s = session([block(1), block(2)], [2, 1])
    const result = truncateSessionBlocks(s, { maxBlocks: 1, variant: 'light' })
    expect(result.droppedBlockNumbers).toEqual([])
    expect(result.session.blocks).toHaveLength(2)
    expect(result.lightenedBlockNumbers).toEqual([1, 2])
  })
})

describe('truncateSessionBlocks — variant light', () => {
  it('retire un tour aux blocs conservés', () => {
    const s = session([block(1), block(2)])
    const result = truncateSessionBlocks(s, { variant: 'light' })
    expect(result.session.blocks[0].format).toContain('2 rounds')
    expect(result.session.blocks[0].exercises[0].prescription).toContain('2×8')
    expect(result.lightenedBlockNumbers).toEqual([1, 2])
  })

  it('laisse intact un bloc déjà à deux tours', () => {
    const s = session([block(1, { format: '`2 rounds`, `90s` rest' })])
    const result = truncateSessionBlocks(s, { variant: 'light' })
    expect(result.session.blocks[0].format).toContain('2 rounds')
    expect(result.lightenedBlockNumbers).toEqual([])
  })

  it('réduit aussi les séries de travail des blocs lourds', () => {
    const s = session([
      block(1, {
        format: '`4 work sets`, `3 min` rest',
        exercises: [{ name: 'Back Squat', prescription: '`4×3` @ `85%`' }],
      }),
    ])
    const result = truncateSessionBlocks(s, { variant: 'light' })
    expect(result.session.blocks[0].format).toContain('3 work sets')
    expect(result.session.blocks[0].exercises[0].prescription).toContain('3×3')
    expect(result.session.blocks[0].exercises[0].prescription).toContain('85%')
  })

  it('combine troncature et allègement', () => {
    const s = session([block(1), block(2), block(3), block(4)], [4, 3, 2])
    const result = truncateSessionBlocks(s, { maxBlocks: 2, variant: 'light' })
    expect(result.session.blocks.map((b) => b.number)).toEqual([1, 2])
    expect(result.session.blocks.every((b) => b.format.includes('2 rounds'))).toBe(true)
  })

  it('ne modifie pas la séance source', () => {
    const s = session([block(1), block(2), block(3), block(4)], [4])
    truncateSessionBlocks(s, { maxBlocks: 1, variant: 'light' })
    expect(s.blocks).toHaveLength(4)
    expect(s.blocks[0].format).toContain('3 rounds')
  })
})

describe('truncateSessionBlocks — sur le corpus réel', () => {
  it('respecte maxBlocks 2 sur les séances ≥3 blocs, soft-floor sinon', () => {
    for (const s of MOTHER_SESSIONS) {
      const result = truncateSessionBlocks(s, { maxBlocks: 2, variant: 'light' })
      expect(result.session.blocks.length).toBeGreaterThanOrEqual(1)
      if (s.blocks.length <= 2) {
        expect(result.session.blocks.length).toBe(s.blocks.length)
        continue
      }
      if (!result.flooredByProtectedBlocks) {
        expect(
          result.session.blocks.length,
          `${s.metadata.id} sert ${result.session.blocks.length} blocs`,
        ).toBeLessThanOrEqual(2)
      }
    }
  })

  it('ne laisse aucune séance bloquée au-dessus de la cible par ses protections', () => {
    const floored = MOTHER_SESSIONS.filter(
      (s) => truncateSessionBlocks(s, { maxBlocks: 2 }).flooredByProtectedBlocks,
    ).map((s) => s.metadata.id)
    expect(floored, `Séances protégeant plus de 2 blocs : ${floored.join(', ')}`).toEqual([])
  })

  it('conserve toujours le bloc 1 des séances de contraste off-season', () => {
    const contrastSessions = MOTHER_SESSIONS.filter((s) =>
      s.metadata.id.includes('FORCE_BRIDGE'),
    )
    expect(contrastSessions.length).toBeGreaterThan(0)
    for (const s of contrastSessions) {
      const kept = truncateSessionBlocks(s, { maxBlocks: 2 }).session.blocks.map((b) => b.number)
      expect(kept, `${s.metadata.id}`).toContain(1)
      expect(kept, `${s.metadata.id}`).toContain(2)
    }
  })
})
