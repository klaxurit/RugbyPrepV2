import { describe, expect, it } from 'vitest'
import { selectSessionInsight } from '../selectSessionInsight'

describe('selectSessionInsight', () => {
  it('priorise un PR battu sur tout le reste', () => {
    const insight = selectSessionInsight({
      rpe: 9,
      completedRatio: 0.5,
      prs: [{ exerciseId: 'back_squat', previousBest: 90, newBest: 100 }],
    })
    expect(insight?.tone).toBe('success')
    expect(insight?.message).toMatch(/100/)
  })

  it('mention plurielle si plusieurs PRs', () => {
    const insight = selectSessionInsight({
      rpe: 7,
      completedRatio: 1,
      prs: [
        { exerciseId: 'a', previousBest: 1, newBest: 2 },
        { exerciseId: 'b', previousBest: 1, newBest: 2 },
      ],
    })
    expect(insight?.message).toMatch(/2 nouveaux records/)
  })

  it('suggère un deload si RPE 9+ et reps incomplètes', () => {
    const insight = selectSessionInsight({
      rpe: 9,
      completedRatio: 0.6,
      prs: [],
    })
    expect(insight?.tone).toBe('warn')
    expect(insight?.message).toMatch(/deload/i)
    expect(insight?.message).toMatch(/RER/)
  })

  it('insight info "limite atteinte" si RPE 9+ avec complétion totale', () => {
    const insight = selectSessionInsight({
      rpe: 9,
      completedRatio: 1,
      prs: [],
    })
    expect(insight?.tone).toBe('info')
    expect(insight?.message).toMatch(/limite/i)
    expect(insight?.message).toMatch(/échec systématique/i)
  })

  it('insight "trop facile" si RPE ≤ 5 + complétion totale', () => {
    const insight = selectSessionInsight({
      rpe: 4,
      completedRatio: 1,
      prs: [],
    })
    expect(insight?.tone).toBe('info')
    expect(insight?.message).toMatch(/confortable|augmentera/i)
  })

  it('renvoie null si rien de notable', () => {
    expect(selectSessionInsight({ rpe: 7, completedRatio: 1, prs: [] })).toBeNull()
  })

  it('insight Weakley si battu dernière séance sans PR', () => {
    const insight = selectSessionInsight({
      rpe: 7,
      completedRatio: 1,
      prs: [],
      beatPreviousSession: true,
    })
    expect(insight?.tone).toBe('success')
    expect(insight?.message).toMatch(/dernière séance/i)
  })
})
