import { describe, expect, it } from 'vitest'
import { buildRecomputePayload } from '../buildRecomputePayload'

// Mercredi 16 septembre 2026. Lundi de la semaine : 2026-09-14.
const TODAY = '2026-09-16'
const MONDAY = '2026-09-14'
const SUNDAY = '2026-09-20'

const base = {
  todayISO: TODAY,
  weekSessions: [],
  events: [],
  isDeloadWeek: false,
  weeklySessions: 4,
  loggedDatesISO: [],
}

describe('buildRecomputePayload', () => {
  it('projette les jours de semaine sur les dates de la semaine ISO', () => {
    const payload = buildRecomputePayload({
      ...base,
      // 2 = mardi, 4 = jeudi, 6 = samedi (convention Date.getDay).
      weekSessions: [{ dayOfWeek: 2 }, { dayOfWeek: 4 }, { dayOfWeek: 6 }],
    })
    expect(payload.plannedSessionDates).toEqual([
      '2026-09-15',
      '2026-09-17',
      '2026-09-19',
    ])
  })

  it('place le dimanche en fin de semaine, pas au début', () => {
    const payload = buildRecomputePayload({ ...base, weekSessions: [{ dayOfWeek: 0 }] })
    expect(payload.plannedSessionDates).toEqual([SUNDAY])
  })

  it('déduplique et trie les dates prévues', () => {
    const payload = buildRecomputePayload({
      ...base,
      weekSessions: [{ dayOfWeek: 4 }, { dayOfWeek: 2 }, { dayOfWeek: 4 }],
    })
    expect(payload.plannedSessionDates).toEqual(['2026-09-15', '2026-09-17'])
  })

  it('ignore un jour de semaine invalide', () => {
    const payload = buildRecomputePayload({
      ...base,
      weekSessions: [{ dayOfWeek: 9 }, { dayOfWeek: -1 }, { dayOfWeek: 1.5 }],
    })
    expect(payload.plannedSessionDates).toEqual([])
  })

  it('garde les matchs de la semaine et les bords J−1 / J+1', () => {
    const payload = buildRecomputePayload({
      ...base,
      events: [
        { date: '2026-09-13' }, // dimanche précédent : borne J−1
        { date: '2026-09-19' }, // samedi de la semaine
        { date: '2026-09-21' }, // lundi suivant : borne J+1
        { date: '2026-09-28' }, // hors fenêtre
      ],
    })
    expect(payload.matchDates).toEqual(['2026-09-13', '2026-09-19', '2026-09-21'])
  })

  it('tolère un horodatage complet et écarte une date malformée', () => {
    const payload = buildRecomputePayload({
      ...base,
      events: [{ date: '2026-09-19T18:00:00.000Z' }, { date: 'demain' }],
    })
    expect(payload.matchDates).toEqual(['2026-09-19'])
  })

  it('retombe sur trois séances de référence si le profil n’en déclare pas', () => {
    expect(buildRecomputePayload({ ...base, weeklySessions: null }).referenceSessionCount).toBe(3)
    expect(buildRecomputePayload({ ...base, weeklySessions: 0 }).referenceSessionCount).toBe(3)
    expect(
      buildRecomputePayload({ ...base, weeklySessions: undefined }).referenceSessionCount,
    ).toBe(3)
  })

  it('n’envoie aucune séance réalisée : le serveur relit session_logs', () => {
    const payload = buildRecomputePayload({
      ...base,
      loggedDatesISO: [MONDAY, '2026-09-15'],
    })
    expect(Object.keys(payload).sort()).toEqual([
      'isDeloadWeek',
      'matchDates',
      'plannedSessionDates',
      'referenceSessionCount',
      'signature',
      'todayISO',
    ])
  })

  it('fait bouger la signature quand une séance est enregistrée', () => {
    const before = buildRecomputePayload(base).signature
    const after = buildRecomputePayload({ ...base, loggedDatesISO: [MONDAY] }).signature
    expect(after).not.toBe(before)
  })

  it('laisse la signature stable quand rien ne change', () => {
    expect(buildRecomputePayload(base).signature).toBe(buildRecomputePayload(base).signature)
  })

  it('ignore une séance enregistrée hors de la semaine dans la signature', () => {
    const outside = buildRecomputePayload({ ...base, loggedDatesISO: ['2026-09-07'] })
    expect(outside.signature).toBe(buildRecomputePayload(base).signature)
  })

  it('fait bouger la signature quand la semaine passe en décharge', () => {
    expect(buildRecomputePayload({ ...base, isDeloadWeek: true }).signature).not.toBe(
      buildRecomputePayload(base).signature,
    )
  })
})
