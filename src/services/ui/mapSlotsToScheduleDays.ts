import type { SCSchedule } from '../../types/training'

export type DayPreference = 'early_week' | 'mid_week' | 'late_week' | 'pre_match'

export interface SlotDayMapping {
  label: string
  dayNumber: number
}

const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const

const DEFAULTS: Record<2 | 3, number[]> = {
  2: [2, 4],
  3: [1, 3, 5],
}

/**
 * Map resolved mother-session slots to real schedule days.
 *
 * Uses `scSchedule` (from profile) when available, otherwise falls back
 * to default days based on slot count.
 *
 * For `pre_match`: finds the last scheduled day strictly before `matchDay`
 * (linear, no wrap-around). Falls back to the last scheduled day if none precede.
 */
export function mapSlotsToScheduleDays(
  slots: Array<{ dayPreference?: DayPreference }>,
  scSchedule?: SCSchedule,
  matchDay?: number,
): SlotDayMapping[] {
  if (slots.length === 0) return []

  // Sorted available SC days (ascending)
  const availableDays: number[] = scSchedule && scSchedule.sessions.length > 0
    ? [...scSchedule.sessions].sort((a, b) => a.day - b.day).map((s) => s.day)
    : DEFAULTS[slots.length as keyof typeof DEFAULTS] ?? Array.from({ length: slots.length }, (_, i) => i + 1)

  // Take only as many days as we have slots (F1-3)
  const usableDays = availableDays.slice(0, slots.length)

  return slots.map((slot, i) => {
    const day = resolveDay(slot.dayPreference, i, usableDays, matchDay, availableDays)
    return {
      label: DAY_LABELS_FR[day] ?? `J${day}`,
      dayNumber: day,
    }
  })
}

function resolveDay(
  pref: DayPreference | undefined,
  index: number,
  usableDays: number[],
  matchDay: number | undefined,
  allDays: number[],
): number {
  if (!pref) {
    // F1-4: positional assignment
    return usableDays[index] ?? allDays[allDays.length - 1] ?? index + 1
  }

  switch (pref) {
    case 'early_week':
      return usableDays[0] ?? 1
    case 'mid_week':
      return usableDays.length >= 2 ? usableDays[1] : usableDays[0] ?? 3
    case 'late_week':
      return usableDays[usableDays.length - 1] ?? 5
    case 'pre_match': {
      if (matchDay == null) {
        return allDays[allDays.length - 1] ?? 5
      }
      // Last scheduled day strictly before matchDay (linear, F1-2)
      const candidates = allDays.filter((d) => d < matchDay)
      if (candidates.length > 0) {
        return candidates[candidates.length - 1]
      }
      // Fallback: last scheduled day
      return allDays[allDays.length - 1] ?? 5
    }
  }
}
