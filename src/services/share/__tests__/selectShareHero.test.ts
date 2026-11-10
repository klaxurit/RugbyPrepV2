import { describe, expect, it } from 'vitest'
import type { SessionSharePayload } from '../sessionShareTypes'
import {
  buildRegularityChip,
  buildShareChips,
  findShareNextMatch,
  formatShareTonnageChip,
  normalizeOpponentName,
  selectShareHero,
  splitSessionLabel,
} from '../selectShareHero'

const base: SessionSharePayload = {
  sessionLabel: 'Bas du corps · Explosivité',
  durationMin: 52,
  completedSets: 26,
  totalSets: 26,
  tonnageKg: 5600,
  rpe: 7,
  fatigue: 'OK',
  prs: [],
  lang: 'fr',
  isPremium: true,
  exerciseMaxLoads: [],
  congratLine: '',
  purposeLine: '',
  sessionOrdinalLabel: 'Séance 3/3',
}

describe('selectShareHero — priorité', () => {
  it('a) record battu, prioritaire sur tout', () => {
    const hero = selectShareHero({
      ...base,
      prs: [{ exerciseName: 'Box squat', newBestKg: 80, previousBestKg: 75 }],
      nextMatch: { daysUntil: 5, opponent: 'Hérouville', isHome: false },
      progression: { kind: 'load', percent: 12, weeks: 4 },
    })
    expect(hero).toEqual({
      kind: 'record',
      exerciseName: 'Box squat',
      kg: 80,
      deltaKg: 5,
      previousKg: 75,
      extraRecords: 0,
    })
  })

  it('préférence match : force la semaine de match même avec un record', () => {
    const hero = selectShareHero({
      ...base,
      heroPreference: 'match',
      prs: [{ exerciseName: 'Box squat', newBestKg: 80, previousBestKg: 75 }],
      nextMatch: { daysUntil: 5, opponent: 'Rugby Club Hérouvillais', isHome: false },
    })
    expect(hero).toEqual({
      kind: 'match',
      daysUntil: 5,
      opponent: 'Hérouvillais',
      venue: 'away',
    })
  })

  it('préférence exercise : ignore le match, garde record puis séance', () => {
    expect(
      selectShareHero({
        ...base,
        heroPreference: 'exercise',
        nextMatch: { daysUntil: 3, opponent: 'DUC', isHome: true },
      }).kind,
    ).toBe('session')
    expect(
      selectShareHero({
        ...base,
        heroPreference: 'exercise',
        prs: [{ exerciseName: 'Bench', newBestKg: 90, previousBestKg: 85 }],
        nextMatch: { daysUntil: 3, opponent: 'DUC', isHome: true },
      }).kind,
    ).toBe('record')
  })

  it('a) premier record : pas de delta', () => {
    const hero = selectShareHero({
      ...base,
      prs: [{ exerciseName: 'Box squat', newBestKg: 80, previousBestKg: 0 }],
    })
    expect(hero).toMatchObject({ kind: 'record', deltaKg: null, previousKg: null })
  })

  it('b) match à J-1…J-7', () => {
    expect(
      selectShareHero({ ...base, nextMatch: { daysUntil: 5, opponent: 'Rugby Club Hérouvillais', isHome: false } }),
    ).toEqual({ kind: 'match', daysUntil: 5, opponent: 'Hérouvillais', venue: 'away' })
  })

  it('b) ignoré hors fenêtre', () => {
    expect(selectShareHero({ ...base, nextMatch: { daysUntil: 9, opponent: 'X', isHome: true } }).kind).toBe('session')
  })

  it('c) progression charge ≥ 5 % ou série ≥ 3 semaines', () => {
    expect(selectShareHero({ ...base, progression: { kind: 'load', percent: 12, weeks: 4 } }).kind).toBe('progression')
    expect(selectShareHero({ ...base, progression: { kind: 'load', percent: 3, weeks: 4 } }).kind).toBe('session')
    expect(selectShareHero({ ...base, progression: { kind: 'streak', weeks: 6 } }).kind).toBe('progression')
    expect(selectShareHero({ ...base, progression: { kind: 'streak', weeks: 2 } }).kind).toBe('session')
  })

  it('d) par défaut : séance + durée + focus, sans point final', () => {
    expect(selectShareHero({ ...base, sessionLabel: 'Bas du corps · Explosivité.' })).toEqual({
      kind: 'session',
      title: 'Bas du corps',
      focus: 'Explosivité',
      durationMin: 52,
    })
  })
})

describe('splitSessionLabel', () => {
  it.each([
    ['Bas du corps · Puissance', 'Bas du corps', 'Puissance'],
    ['Haut du corps - Force', 'Haut du corps', 'Force'],
    ['Activation.', 'Activation', null],
    ['Full body · Développement de la puissance maximale', 'Full body Développement de la puissance maximale', null],
  ])('%s', (label, title, focus) => {
    expect(splitSessionLabel(label)).toEqual({ title, focus })
  })
})

describe('normalizeOpponentName', () => {
  it.each([
    ['Rugby Club Hérouvillais', 'Hérouvillais'],
    ['Stade Rouennais Rugby', 'Rouennais'],
    ['RC Caen', 'Caen'],
    ['US SAINT-SEBASTIEN-SUR-LOIRE', 'Saint-Sebastien-Sur-Loire'],
    ['Union Sportive de la Seine', 'Seine'],
    ['Rugby Club', 'Rugby Club'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeOpponentName(raw)).toBe(expected)
  })

  it('null si vide', () => {
    expect(normalizeOpponentName('  ')).toBeNull()
  })
})

describe('findShareNextMatch', () => {
  const events = [
    { date: '2026-11-12', type: 'rest' },
    { date: '2026-11-21', type: 'match', opponent: 'Loin' },
    { date: '2026-11-15', type: 'match', opponent: 'Hérouville', is_home: false },
    { date: '2026-11-14', type: 'match', opponent: 'Caché', user_hidden: true },
    { date: '2026-11-10', type: 'match', opponent: 'Aujourd’hui' },
  ]
  it('le plus proche entre J-1 et J-7, matchs masqués exclus', () => {
    expect(findShareNextMatch(events, '2026-11-10')).toEqual({
      daysUntil: 5,
      opponent: 'Hérouville',
      isHome: false,
    })
  })
  it('null sans match dans la fenêtre', () => {
    expect(findShareNextMatch(events, '2026-11-22')).toBeNull()
  })
})

describe('chips', () => {
  it('tonnage formaté en chip', () => {
    expect(formatShareTonnageChip(5600, 'fr')).toBe('5,6 t soulevées')
    expect(formatShareTonnageChip(850, 'fr')).toBe('850 kg soulevés')
    expect(formatShareTonnageChip(null, 'fr')).toBeNull()
  })

  it('régularité : un seul indicateur', () => {
    expect(buildRegularityChip({ ...base, progression: { kind: 'streak', weeks: 6 } })).toMatchObject({
      text: '6 sem. d’affilée',
      filled: true,
    })
    expect(buildRegularityChip(base)?.text).toBe('Semaine 3/3')
    expect(buildRegularityChip({ ...base, sessionOrdinalLabel: 'Séance 2/3' })?.text).toBe('Séance 2/3')
    expect(buildRegularityChip({ ...base, sessionOrdinalLabel: null })).toBeNull()
  })

  it('d) focus et durée déjà dans le héros → régularité, tonnage, sets', () => {
    const chips = buildShareChips(base, selectShareHero(base)).map((c) => c.text)
    expect(chips).toEqual(['Semaine 3/3', '5,6 t soulevées', '26/26 sets'])
  })

  it('a) focus, durée, régularité ; jamais plus de 3', () => {
    const p = { ...base, prs: [{ exerciseName: 'Box squat', newBestKg: 80, previousBestKg: 75 }] }
    const chips = buildShareChips(p, selectShareHero(p)).map((c) => c.text)
    expect(chips).toEqual(['Explosivité', '52 min', 'Semaine 3/3'])
  })

  it('free : pas de tonnage', () => {
    const p = { ...base, isPremium: false }
    const chips = buildShareChips(p, selectShareHero(p)).map((c) => c.text)
    expect(chips).not.toContain('5,6 t soulevées')
  })

  it('série en héros : pas de chip régularité', () => {
    const p = { ...base, progression: { kind: 'streak' as const, weeks: 6 } }
    const chips = buildShareChips(p, selectShareHero(p)).map((c) => c.text)
    expect(chips.some((c) => /affilée|Semaine/.test(c))).toBe(false)
  })
})
