import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS } from '../../../data/motherSessions.generated'
import { getSessionFrOrFallback } from '../motherSessionContentFr'
import { parseBlockRestSeconds, parseRestSecondsFromText } from '../../ui/blockPresentation'
import type { Block } from '../../../types/motherSession'

/** Formats FR qui contiennent une indication de repos explicite. */
function collectFrFormatsWithRestHint(): string[] {
  const formats = new Set<string>()
  for (const session of MOTHER_SESSIONS) {
    const fr = getSessionFrOrFallback(session)
    for (const block of fr.blocks) {
      if (block.format && /repos|récup|rest|\d+\s*min|\d+s/i.test(block.format)) {
        formats.add(block.format)
      }
    }
  }
  return [...formats]
}

describe('repos FR — corpus sessions (getSessionFrOrFallback)', () => {
  it('parse tous les formats FR avec hint repos (pas de fallback 90s silencieux)', () => {
    const formats = collectFrFormatsWithRestHint()
    expect(formats.length).toBeGreaterThan(20)

    const unparsed: string[] = []
    for (const format of formats) {
      if (/marchant|walk-back|minimal|continuously|EMOM/i.test(format)) continue
      if (parseRestSecondsFromText(format) == null) {
        unparsed.push(format)
      }
    }

    expect(unparsed, `formats FR non parsés → fallback 90s: ${unparsed.join(' | ')}`).toEqual([])
  })

  it('FULL_OFFSEASON_HYPERTROPHY_V1 FR — repos différenciés par bloc', () => {
    const session = MOTHER_SESSIONS.find((s) => s.metadata.id === 'FULL_OFFSEASON_HYPERTROPHY_V1')
    expect(session).toBeDefined()
    const fr = getSessionFrOrFallback(session!)
    const rests = fr.blocks.map((b) =>
      parseBlockRestSeconds({
        number: 1,
        name: b.name,
        format: b.format,
        exercises: b.exercises.map((e) => ({ name: e.name, prescription: e.prescription ?? '' })),
        coachingNotes: [],
      }),
    )
    expect(rests[0]).toBe(120)
    expect(rests[1]).toBe(120)
    expect(rests[2]).toBe(90)
    expect(rests[3]).toBe(60)
  })
})

describe('repos EN — motherSessions.generated corpus', () => {
  it('aucun bloc EN loggable ne retombe à 90s sans format EMOM/minimal', () => {
    const suspicious: string[] = []
    for (const session of MOTHER_SESSIONS) {
      for (const block of session.blocks) {
        if (!block.format || /EMOM|minimal|walk-back|continuously/i.test(block.format)) continue
        if (!/rest|repos|min|\ds`/i.test(block.format)) continue
        const seconds = parseBlockRestSeconds(block)
        if (seconds === 90 && /120|180|2 min|3 min|240/i.test(block.format)) {
          suspicious.push(`${session.metadata.id} B${block.number}: ${block.format}`)
        }
      }
    }
    expect(suspicious).toEqual([])
  })
})
