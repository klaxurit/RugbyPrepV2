import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { localizeBlockName } from '../../motherSession/motherSessionBlockLabels'
import { formatTitleFromMotherSessionId } from '../../../components/motherSession/formatMotherSessionTitle'
import { prepareSessionForRender } from '../prepareSessionForRender'
import type { ContentFamily } from '../../../data/contentFamily'

/** Tokens techniques / EN poste — jamais visibles joueur FR. */
const TECH =
  /\bBACK_ROW\b|\bSECOND_ROW\b|\bFRONT_ROW\b|\bHALF_BACKS\b|\bBACK_THREE\b|\bCENTERS\b|\bBack Row\b|\bSecond Row\b|\bFront Row\b|\bHalf-?Backs\b|\bBACK ROW\b|\bHALF BACKS\b|\bFRONT ROW\b|\bSECOND ROW\b|\bBACK THREE\b|\bback_row\b|\bfront_row\b|\bsecond_row\b|\bhalf_backs\b|\bback_three\b|\bcenters\b/

function familyFromId(id: string): ContentFamily {
  if (id.includes('SECOND_ROW')) return 'second_row'
  if (id.includes('BACK_ROW')) return 'back_row'
  if (id.includes('HALF_BACKS')) return 'half_backs'
  if (id.includes('CENTERS')) return 'centers'
  if (id.includes('BACK_THREE')) return 'back_three'
  return 'front_row'
}

function rugbyFromFamily(family: ContentFamily): string {
  switch (family) {
    case 'back_row':
      return 'BACK_ROW'
    case 'second_row':
      return 'SECOND_ROW'
    case 'half_backs':
      return 'HALF_BACKS'
    case 'centers':
      return 'CENTERS'
    case 'back_three':
      return 'BACK_THREE'
    default:
      return 'FRONT_ROW'
  }
}

describe('audit tokens poste visibles', () => {
  const sampleIds = Object.keys(MOTHER_SESSIONS_BY_ID).filter((id) =>
    /_(BACK_ROW|SECOND_ROW|FRONT_ROW|HALF_BACKS|CENTERS|BACK_THREE)/.test(id),
  )

  it('titres formatés sans token technique', () => {
    for (const id of sampleIds) {
      const title = formatTitleFromMotherSessionId(id, 'fr')
      expect(title, id).not.toMatch(TECH)
    }
  })

  it('blocs préparés + localizeBlockName sans token technique', () => {
    const leaks: string[] = []
    for (const id of sampleIds) {
      const family = familyFromId(id)
      const prepared = prepareSessionForRender({
        session: structuredClone(MOTHER_SESSIONS_BY_ID[id]!),
        trainingLevel: 'builder',
        equipment: ['barbell', 'dumbbell', 'bench', 'squat_rack'],
        lang: 'fr',
        contentFamily: family,
        rugbyPosition: rugbyFromFamily(family),
      })
      for (const block of prepared.blocks) {
        const name = localizeBlockName(block.name, 'fr')
        if (TECH.test(name)) leaks.push(`${id} → ${name}`)
      }
      const fields = [
        prepared.title ?? '',
        ...(prepared.goal ?? []),
        ...(prepared.sessionIdentity ?? []),
        ...(prepared.positionAccent ?? []),
        ...prepared.blocks.flatMap((b) => b.coachingNotes ?? []),
      ]
      for (const v of fields) {
        if (TECH.test(v)) leaks.push(`${id} :: ${v.slice(0, 100)}`)
      }
    }
    expect(leaks).toEqual([])
  })
})
