/**
 * Garde-fou : pas de doublon motivant (même famille lourde) dans une semaine
 * Lower + Upper + Full/Primer (salle et BW mappé).
 */
import { describe, expect, it } from 'vitest'
import { getWeeklyTemplate, type GetWeeklyTemplateParams } from '../../../data/weeklyTemplates'
import { MOTHER_SESSIONS } from '../../../data/motherSessions.generated'
import { resolveExerciseIdForSessionRun } from '../motherSessionExerciseMap'
import { mapMotherSessionIdForEquipment } from '../../equipment/motherSessionEquipmentMap'
import type { Equipment } from '../../../types/training'

const byId = Object.fromEntries(MOTHER_SESSIONS.map((s) => [s.metadata.id, s]))

/** Familles « ennuyeuses » si répétées Lower/Upper ↔ Full dans la même semaine. */
function heavyFamily(id: string, name: string): string | null {
  const n = `${name} ${id}`.toLowerCase()
  const rules: [RegExp, string][] = [
    [/bench_press|bench press|football bar|incline.*bench|db bench/, 'bench'],
    [/front.?squat|box.?squat|back.?squat|pin.?squat|anderson|hack.?squat|goblet|bodyweight squat/, 'squat_bilateral'],
    [/trap.?bar|hex.?bar.?deadlift|deadlift__trap/, 'trap_bar'],
    [/nordic/, 'nordic'],
    [/pull.?up|chin.?up|traction/, 'pull_up'],
    [/chest.?supported.?row/, 'csr'],
    [/decline.?push|push_up__decline/, 'decline_push'],
    [/inverted.?row|rowing inversé/, 'inverted_row'],
    [/half.?kneeling.?landmine.?press|landmine.?press__kneeling/, 'landmine_press'],
    [/plyo.?push/, 'plyo_push'],
    [/pike.?push/, 'pike_push'],
    [/bulgarian|rear-foot elevated/, 'bulgarian'],
  ]
  for (const [re, key] of rules) {
    if (re.test(n)) return key
  }
  return null
}

function sessionExercises(sessionId: string) {
  const s = byId[sessionId]
  if (!s) return [] as { name: string; id: string; family: string }[]
  const out: { name: string; id: string; family: string }[] = []
  for (const b of s.blocks ?? []) {
    for (const e of b.exercises ?? []) {
      if (!e?.name) continue
      const id =
        resolveExerciseIdForSessionRun(e.name, e.exerciseId) ??
        e.name.toLowerCase().replace(/\s+/g, '_')
      const family = heavyFamily(id, e.name)
      if (!family) continue
      out.push({ name: e.name, id, family })
    }
  }
  return out
}

function buildParams(): GetWeeklyTemplateParams[] {
  const out: GetWeeklyTemplateParams[] = []
  const freqs = [3, 4] as const
  const positions = ['front_row', 'back_three'] as const
  const matches = ['match_week', 'no_match_week'] as const

  for (const pos of positions) {
    for (const freq of freqs) {
      for (const phase of [1, 2, 3] as const) {
        out.push({ cycle: 'pre_season', phase, frequency: freq, positionGroup: pos })
      }
      for (const mc of matches) {
        out.push({
          cycle: 'in_season',
          frequency: freq,
          positionGroup: pos,
          matchContext: mc,
        })
      }
      for (const op of [2, 3, 4] as const) {
        out.push({
          cycle: 'off_season',
          offSeasonPhase: op,
          frequency: freq,
          positionGroup: pos,
        })
      }
    }
  }
  return out
}

function collectDupes(equipment: Equipment[] | undefined) {
  const findings: string[] = []
  const seen = new Set<string>()

  for (const p of buildParams()) {
    let res
    try {
      res = getWeeklyTemplate(p)
    } catch {
      continue
    }
    const sessionIds = res.sessions.map((s) =>
      mapMotherSessionIdForEquipment(s.sessionId, equipment)
    )
    if (sessionIds.length < 2) continue
    const weekKey = [
      equipment ? 'bw' : 'gym',
      p.cycle,
      p.phase ?? p.offSeasonPhase ?? '',
      `f${p.frequency}`,
      p.positionGroup,
      p.matchContext ?? '',
    ].join('|')

    const loaded = sessionIds.map((id) => ({ id, exs: sessionExercises(id) }))
    for (let i = 0; i < loaded.length; i++) {
      for (let j = i + 1; j < loaded.length; j++) {
        const A = loaded[i]
        const B = loaded[j]
        const involvesFull = A.id.includes('FULL_') || B.id.includes('FULL_')
        if (!involvesFull) continue
        for (const ea of A.exs) {
          for (const eb of B.exs) {
            if (ea.family !== eb.family) continue
            const dedupe = [weekKey, ea.family, [A.id, B.id].sort().join('+')].join('::')
            if (seen.has(dedupe)) continue
            seen.add(dedupe)
            findings.push(
              `${weekKey} | ${ea.family} | ${A.id}「${ea.name}」× ${B.id}「${eb.name}」`
            )
          }
        }
      }
    }
  }
  return findings
}

describe('weekly heavy-family duplicates (FULL vs Lower/Upper)', () => {
  it('has no motivating duplicates in gym weeks', () => {
    const dupes = collectDupes(undefined)
    if (dupes.length) {
      console.log('\nGYM DUPES:\n' + dupes.join('\n'))
    }
    expect(dupes).toEqual([])
  })

  it('has no motivating duplicates in bodyweight weeks', () => {
    // Profil poids de corps = aucun équipement déclaré (cf. resolveEquipmentProgramTier).
    const dupes = collectDupes([])
    if (dupes.length) {
      console.log('\nBW DUPES:\n' + dupes.join('\n'))
    }
    expect(dupes).toEqual([])
  })
})
