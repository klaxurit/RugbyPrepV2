import { describe, it, expect } from 'vitest'
import { getSessionFr, getSessionFrOrFallback, looksLikeFranglais } from '../motherSessionContentFr'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { msPositionGroupLabel } from '../motherSessionLabels'

const TRANSLATED_SESSION_IDS = [
  'FULL_OFFSEASON_RECOVERY_A_V1',
  'FULL_OFFSEASON_RECOVERY_B_V1',
  'LOWER_IN_SEASON_FRONT_ROW_V1',
  'LOWER_IN_SEASON_BACK_THREE_V1',
  'UPPER_IN_SEASON_FRONT_ROW_V1',
  'UPPER_IN_SEASON_BACK_THREE_V1',
  'FULL_BODY_IN_SEASON_FRONT_ROW_V1',
  'FULL_BODY_IN_SEASON_BACK_THREE_V1',
  'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1',
  'FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1',
]

describe('motherSessionContentFr', () => {
  describe.each(TRANSLATED_SESSION_IDS)('session %s', (sessionId) => {
    it('FR block count matches source block count', () => {
      const source = MOTHER_SESSIONS_BY_ID[sessionId]
      const fr = getSessionFr(sessionId)
      expect(source).toBeDefined()
      expect(fr).toBeDefined()
      expect(fr!.blocks.length).toBe(source.blocks.length)
    })

    it('has non-empty goals and blocks', () => {
      const fr = getSessionFr(sessionId)!
      expect(fr.goals.length).toBeGreaterThan(0)
      expect(fr.blocks.length).toBeGreaterThan(0)
    })

    it('each FR block has matching exercise count', () => {
      const source = MOTHER_SESSIONS_BY_ID[sessionId]
      const fr = getSessionFr(sessionId)!
      fr.blocks.forEach((frBlock, i) => {
        expect(frBlock.exercises.length).toBe(source.blocks[i].exercises.length)
      })
    })
  })

  it('getSessionFr returns undefined for untranslated session', () => {
    expect(getSessionFr('NONEXISTENT_SESSION_V1')).toBeUndefined()
  })

  it('generates a FR fallback for untranslated sessions', () => {
    const session = MOTHER_SESSIONS_BY_ID.LOWER_PRESEASON_FORCE_V1
    const fr = getSessionFrOrFallback(session)

    expect(fr).toBeDefined()
    expect(fr!.blocks[0].name).toBe('Force principale bas du corps')
    expect(fr!.blocks[1].name).toBe('Charnière de hanche + force unilatérale')
    expect(fr!.blocks[2].format).toBe('`2-3 tours`, `60-90s` de repos')
  })

  it('UPPER_OFFSEASON_TRANSITION_V1 coaching notes are clean French', () => {
    const session = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_TRANSITION_V1
    const fr = getSessionFrOrFallback(session)!
    const notes = fr.blocks[0].coachingNotes

    expect(notes[0]).toBe(
      'Garder les deux exos en effort modéré (`RPE 5-6` — 3-4 reps en réserve).',
    )
    expect(notes[1]).toBe(
      'C\'est le premier bloc de charge bilatérale haut du corps après la récupération.',
    )
    expect(notes[2]).toBe(
      'Le bench doit être stable et confortable, on ne vise pas de record ici.',
    )
    expect(notes[3]).toBe(
      'Le rowing doit rester contrôlé et propre sans sollicitation du bas du dos.',
    )
  })

  it('all mother sessions have French coaching notes without duplicate RPE or franglais', () => {
    const duplicateRpe = /effort modéré.*effort modéré/i

    for (const session of Object.values(MOTHER_SESSIONS_BY_ID)) {
      const fr = getSessionFrOrFallback(session)
      expect(fr, session.metadata.id).toBeDefined()

      const allNotes = [
        ...fr!.warmUpNotes,
        ...fr!.blocks.flatMap((b) => b.coachingNotes),
      ]
      for (const note of allNotes) {
        expect(duplicateRpe.test(note), `${session.metadata.id}: ${note}`).toBe(false)
        expect(looksLikeFranglais(note), `${session.metadata.id}: ${note}`).toBe(false)
        expect(note).toMatch(/^(`|[A-ZÀ-ÿ])/)
        expect(note).toMatch(/[.!?…]$/)
      }
    }
  })

  it('UPPER_OFFSEASON_FORCE_BRIDGE_V1 coaching notes are clean French', () => {
    const session = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_FORCE_BRIDGE_V1
    const fr = getSessionFrOrFallback(session)!
    expect(fr.warmUpNotes[0]).toBe(
      'Activation des épaules et du thorax avant les presses lourdes.',
    )
    expect(fr.warmUpNotes[1]).toBe(
      'Les séries de montée en charge sont essentielles — atteindre le poids de travail en 2-3 séries.',
    )
    expect(fr.blocks[0].coachingNotes).toEqual([
      'Bench lourd : excentrique contrôlée, concentrique explosif. RIR 1-2.',
      'Passe med ball dans les 15-20 s après la série de bench — exploiter le PAP.',
      'La passe doit sembler nettement plus rapide et plus vive après la série lourde.',
      'Si la qualité de la passe baisse, réduire d’abord la charge de bench.',
    ])
  })

  it('humanizes free-text position group labels in FR', () => {
    expect(msPositionGroupLabel('front_row + back_three (phase 1 common base)', 'fr')).toBe(
      'Avants + Ligne arrière (base commune phase 1)',
    )
  })
})
