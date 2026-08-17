import { describe, expect, it } from 'vitest'
import type { PresentedMatchEvent } from '../../../types/scheduling'
import {
  DEFAULT_KICKOFF_HOUR,
  PRIMER_MIN_HOURS,
  PRIMER_OPTIMAL_MAX_HOURS,
  POST_MATCH_BLOCK_HOURS,
  resolveKickoffDate,
  dateOfWeekday,
  hoursFromDayToKickoff,
  isPostMatchWindow,
  isPrimerWindow,
  isPreMatchLightOnlyWindow,
  isCalendarPreMatchNoHeavyWindow,
  sessionRequiresPreMatchLight,
  withPreMatchNoHeavyVariant,
  pickPrimerDay,
} from '../matchWindowPolicy'
import type { DayOfWeek } from '../../../types/scheduling'

/**
 * Fenêtres scientifiques (KB periodization.md §4.3, §6) :
 *   - Primer : 18h–36h avant kickoff (idéal 24h = MD-1)
 *   - Pas de S&C lourde dans les 48h pré-match
 *   - Pas de S&C dans les 24h post-match
 */

const match: PresentedMatchEvent = {
  type: 'match',
  date: '2026-04-25', // Samedi
  kickoff_time: '15:00',
}

// Reference date : le lundi de la même semaine ISO.
const monday = new Date(2026, 3, 20)

describe('matchWindowPolicy · constantes scientifiques', () => {
  it('primer window = 18h → 36h', () => {
    expect(PRIMER_MIN_HOURS).toBe(18)
    expect(PRIMER_OPTIMAL_MAX_HOURS).toBe(36)
  })

  it('post-match block = 24h', () => {
    expect(POST_MATCH_BLOCK_HOURS).toBe(24)
  })

  it('kickoff par défaut = 15h (standard amateur FR)', () => {
    expect(DEFAULT_KICKOFF_HOUR).toBe(15)
  })
})

describe('resolveKickoffDate', () => {
  it('parse correctement la date + heure', () => {
    const d = resolveKickoffDate(match)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3) // avril (0-indexed)
    expect(d.getDate()).toBe(25)
    expect(d.getHours()).toBe(15)
    expect(d.getMinutes()).toBe(0)
  })

  it('fallback 15h si kickoff_time absent', () => {
    const noTime: PresentedMatchEvent = { type: 'match', date: '2026-04-25' }
    const d = resolveKickoffDate(noTime)
    expect(d.getHours()).toBe(DEFAULT_KICKOFF_HOUR)
  })
})

describe('dateOfWeekday', () => {
  it('retourne le lundi = 1 de la semaine', () => {
    const d = dateOfWeekday(1, monday)
    expect(d.getDay()).toBe(1)
    expect(d.getDate()).toBe(20)
  })

  it('retourne le dimanche = 0 de la semaine (dernier jour ISO)', () => {
    const d = dateOfWeekday(0, monday)
    expect(d.getDay()).toBe(0)
    expect(d.getDate()).toBe(26)
  })
})

describe('hoursFromDayToKickoff (match Sam 15h)', () => {
  it('MD-1 (Vendredi midi) ≈ 27h', () => {
    expect(hoursFromDayToKickoff(5, match, monday)).toBe(27)
  })

  it('MD-2 (Jeudi midi) ≈ 51h', () => {
    expect(hoursFromDayToKickoff(4, match, monday)).toBe(51)
  })

  it('MD (Samedi midi) = 3h (kickoff même jour 15h)', () => {
    expect(hoursFromDayToKickoff(6, match, monday)).toBe(3)
  })

  it('MD+1 (Dimanche midi) = -21h', () => {
    expect(hoursFromDayToKickoff(0, match, monday)).toBe(-21)
  })
})

describe('isPrimerWindow — fenêtre 18h–36h', () => {
  it('MD-1 (27h avant) est dans la fenêtre', () => {
    expect(isPrimerWindow(5, match, monday)).toBe(true)
  })

  it('MD-2 (51h avant) est hors fenêtre (trop tôt)', () => {
    expect(isPrimerWindow(4, match, monday)).toBe(false)
  })

  it('MD matin (3h avant) est hors fenêtre (trop tard)', () => {
    expect(isPrimerWindow(6, match, monday)).toBe(false)
  })
})

describe('isPostMatchWindow — fenêtre 24h post-kickoff', () => {
  it('MD+1 Dim midi (21h après) est bloqué', () => {
    expect(isPostMatchWindow(0, match, monday)).toBe(true)
  })

  it('MD+2 Lun suivant (hors semaine ISO) : test sur même semaine uniquement', () => {
    // Dans la semaine ISO du match, seuls MD et MD+1 peuvent tomber dans la
    // fenêtre. Ce test vérifie qu'un jour antérieur au match n'est pas bloqué.
    expect(isPostMatchWindow(1, match, monday)).toBe(false) // Lundi pré-match
  })

  it('MD-1 n\'est pas bloqué', () => {
    expect(isPostMatchWindow(5, match, monday)).toBe(false)
  })
})

describe('isPreMatchLightOnlyWindow — 48h pré-kickoff', () => {
  it('MD-1 (27h) dans la fenêtre light-only', () => {
    expect(isPreMatchLightOnlyWindow(5, match, monday)).toBe(true)
  })

  it('MD-2 (51h) hors fenêtre (au-delà 48h)', () => {
    expect(isPreMatchLightOnlyWindow(4, match, monday)).toBe(false)
  })

  it('MD+1 hors fenêtre (après le match)', () => {
    expect(isPreMatchLightOnlyWindow(0, match, monday)).toBe(false)
  })
})

describe('isCalendarPreMatchNoHeavyWindow — J-2 calendaire (rail registre)', () => {
  const saturday = '2026-04-11'

  it('jeudi (J-2) inclus — contrairement à la fenêtre 48 h midi', () => {
    expect(isCalendarPreMatchNoHeavyWindow('2026-04-09', saturday)).toBe(true)
  })

  it('vendredi (J-1) inclus', () => {
    expect(isCalendarPreMatchNoHeavyWindow('2026-04-10', saturday)).toBe(true)
  })

  it('samedi (jour de match) inclus', () => {
    expect(isCalendarPreMatchNoHeavyWindow(saturday, saturday)).toBe(true)
  })

  it('mercredi (J-3) hors fenêtre', () => {
    expect(isCalendarPreMatchNoHeavyWindow('2026-04-08', saturday)).toBe(false)
  })

  it('dimanche (J+1) hors fenêtre', () => {
    expect(isCalendarPreMatchNoHeavyWindow('2026-04-12', saturday)).toBe(false)
  })

  it('ISO invalide → false', () => {
    expect(isCalendarPreMatchNoHeavyWindow('not-a-date', saturday)).toBe(false)
    expect(isCalendarPreMatchNoHeavyWindow('2026-04-09', '')).toBe(false)
  })

  it('sans match → false', () => {
    expect(sessionRequiresPreMatchLight('2026-04-09', [])).toBe(false)
  })

  it('withPreMatchNoHeavyVariant tamponne light + maxBlocks 2 sans réécrire la mother', () => {
    const slot = { sessionId: 'LOWER', variant: 'normal' as const }
    expect(withPreMatchNoHeavyVariant(slot, '2026-04-09', [saturday])).toEqual({
      sessionId: 'LOWER',
      variant: 'light',
      maxBlocks: 2,
    })
    expect(withPreMatchNoHeavyVariant(slot, '2026-04-08', [saturday])).toBe(slot)
  })

  it('withPreMatchNoHeavyVariant ne remonte pas un maxBlocks déjà plus bas', () => {
    const slot = { sessionId: 'LOWER', variant: 'light' as const, maxBlocks: 1 }
    expect(withPreMatchNoHeavyVariant(slot, '2026-04-09', [saturday])).toBe(slot)
  })
})

describe('pickPrimerDay — sélection optimale MD-1 puis fallback MD-2', () => {
  it('MD-1 disponible → retourne MD-1 (27h avant)', () => {
    const day = pickPrimerDay(match, monday, () => false)
    expect(day).toBe(5) // Vendredi
  })

  it('MD-1 bloqué → fallback MD-2 (même si > 48h)', () => {
    const day = pickPrimerDay(match, monday, (d: DayOfWeek) => d === 5)
    expect(day).toBe(4) // Jeudi
  })

  it('MD-1 et MD-2 bloqués → null', () => {
    const day = pickPrimerDay(match, monday, (d: DayOfWeek) => d === 5 || d === 4)
    expect(day).toBeNull()
  })

  it('match dimanche 15h → MD-1 samedi retourné', () => {
    const sundayMatch: PresentedMatchEvent = {
      type: 'match',
      date: '2026-04-26',
      kickoff_time: '15:00',
    }
    const day = pickPrimerDay(sundayMatch, monday, () => false)
    expect(day).toBe(6) // Samedi
  })
})
