import { describe, expect, it } from 'vitest'
import { buildShareWeekStrip } from '../buildShareWeekStrip'

describe('buildShareWeekStrip', () => {
  it('termine sur le match et marque la séance en Salle', () => {
    // Vendredi 8 mai 2026 + J-3 → match lundi 11 mai ; strip = 5…11 mai
    const days = buildShareWeekStrip('2026-05-08', 3, 'fr')
    expect(days).toHaveLength(7)
    expect(days!.map((d) => d.dayNumber)).toEqual([5, 6, 7, 8, 9, 10, 11])
    expect(days![3]).toMatchObject({ kind: 'salle', isToday: true, dayLabel: 'Ven' })
    expect(days![6]).toMatchObject({ kind: 'match', isToday: false, dayLabel: 'Lun' })
    expect(days!.filter((d) => d.kind === 'repos')).toHaveLength(5)
  })

  it('refuse une date absente ou un J-X hors plage', () => {
    expect(buildShareWeekStrip(null, 3, 'fr')).toBeNull()
    expect(buildShareWeekStrip('2026-05-08', 0, 'fr')).toBeNull()
    expect(buildShareWeekStrip('2026-05-08', 8, 'fr')).toBeNull()
  })
})
